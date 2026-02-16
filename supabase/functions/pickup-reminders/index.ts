import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const now = new Date();

    // 1. Find orders completed > 24h ago that are still in "completed" status (awaiting pickup)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Auto-close orders older than 7 days
    const { data: expiredOrders } = await supabase
      .from("orders")
      .select("id, customer_id")
      .eq("status", "completed")
      .lt("updated_at", sevenDaysAgo.toISOString());

    if (expiredOrders && expiredOrders.length > 0) {
      for (const order of expiredOrders) {
        await supabase
          .from("orders")
          .update({ status: "canceled", notes: "Auto-closed after 7 days" })
          .eq("id", order.id);

        await supabase.from("notifications").insert({
          user_id: order.customer_id,
          title: "تم إغلاق طلبك تلقائياً",
          body: "مضى أكثر من 7 أيام بدون استلام — تم إغلاق الطلب تلقائياً.",
          type: "order_expired",
          data: { order_id: order.id },
        });
      }
    }

    // Send 24h reminders for completed orders not yet picked up (between 1-7 days old)
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("id, customer_id, updated_at")
      .eq("status", "completed")
      .lt("updated_at", oneDayAgo.toISOString())
      .gte("updated_at", sevenDaysAgo.toISOString());

    if (pendingOrders && pendingOrders.length > 0) {
      for (const order of pendingOrders) {
        const daysLeft = Math.max(
          1,
          7 - Math.floor((now.getTime() - new Date(order.updated_at).getTime()) / 86400000)
        );

        await supabase.from("notifications").insert({
          user_id: order.customer_id,
          title: "طلبك لا يزال جاهز للاستلام",
          body:
            daysLeft <= 1
              ? "آخر يوم لاستلام طلبك — بعدها يُغلق تلقائياً."
              : `متبقي ${daysLeft} أيام لاستلام طلبك.`,
          type: "pickup_reminder",
          data: { order_id: order.id, days_left: daysLeft },
        });
      }
    }

    const closedCount = expiredOrders?.length || 0;
    const remindedCount = pendingOrders?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        closed: closedCount,
        reminded: remindedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
