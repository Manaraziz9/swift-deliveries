import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, order_id, stage_id } = await req.json();

    if (action === "stage_completed" && order_id && stage_id) {
      // Get order and all stages
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_stages(*)")
        .eq("id", order_id)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stages = order.order_stages || [];
      const totalStages = stages.length;
      if (totalStages === 0) {
        return new Response(JSON.stringify({ error: "No stages" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get total held amount
      const { data: holdTx } = await supabase
        .from("escrow_transactions")
        .select("amount")
        .eq("order_id", order_id)
        .eq("transaction_type", "hold")
        .eq("status", "completed");

      const totalHeld = (holdTx || []).reduce(
        (s: number, t: any) => s + Number(t.amount),
        0
      );

      if (totalHeld === 0) {
        return new Response(
          JSON.stringify({ message: "No escrow to release" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already released for this stage
      const { data: existingRelease } = await supabase
        .from("escrow_transactions")
        .select("id")
        .eq("order_id", order_id)
        .eq("stage_id", stage_id)
        .eq("transaction_type", "release");

      if (existingRelease && existingRelease.length > 0) {
        return new Response(
          JSON.stringify({ message: "Already released for this stage" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate per-stage amount
      const releaseAmount = totalHeld / totalStages;

      // Insert release transaction
      await supabase.from("escrow_transactions").insert({
        order_id,
        stage_id,
        transaction_type: "release",
        amount: releaseAmount,
        currency: order.currency || "SAR",
        status: "completed",
        completed_at: new Date().toISOString(),
        notes: `Auto-release for stage completion`,
      });

      // Check completed stages count
      const completedCount = stages.filter(
        (s: any) => s.status === "completed"
      ).length;
      const escrowStatus =
        completedCount >= totalStages ? "released" : "partial";

      await supabase
        .from("orders")
        .update({ escrow_status: escrowStatus })
        .eq("id", order_id);

      return new Response(
        JSON.stringify({
          success: true,
          released: releaseAmount,
          escrow_status: escrowStatus,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refund" && order_id) {
      // Get held and already released amounts
      const { data: allTx } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("order_id", order_id);

      const held = (allTx || [])
        .filter((t: any) => t.transaction_type === "hold")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const released = (allTx || [])
        .filter((t: any) => t.transaction_type === "release")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const alreadyRefunded = (allTx || [])
        .filter((t: any) => t.transaction_type === "refund")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);

      const refundAmount = held - released - alreadyRefunded;

      if (refundAmount <= 0) {
        return new Response(
          JSON.stringify({ message: "Nothing to refund" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("escrow_transactions").insert({
        order_id,
        transaction_type: "refund",
        amount: refundAmount,
        status: "completed",
        completed_at: new Date().toISOString(),
        notes: "Refund due to order cancellation/failure",
      });

      await supabase
        .from("orders")
        .update({ escrow_status: "refunded" })
        .eq("id", order_id);

      return new Response(
        JSON.stringify({ success: true, refunded: refundAmount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use stage_completed or refund" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
