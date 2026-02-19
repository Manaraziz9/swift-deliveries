import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const stageLabels: Record<string, { ar: string; en: string }> = {
  purchase: { ar: 'الشراء', en: 'Purchase' },
  pickup: { ar: 'الاستلام', en: 'Pickup' },
  dropoff: { ar: 'التوصيل', en: 'Delivery' },
  handover: { ar: 'التسليم', en: 'Handover' },
  onsite: { ar: 'في الموقع', en: 'On-site' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, stageId, stageType, newStatus, sequenceNo, action } = await req.json();

    if (!orderId || (!stageId && !action) || (!newStatus && !action)) {
      return new Response(
        JSON.stringify({ error: 'orderId and (stageId + newStatus) or action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order to find customer
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user language
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('language')
      .eq('user_id', order.customer_id)
      .single();

    const lang = profile?.language === 'ar' ? 'ar' : 'en';
    const effectiveStageType = stageType || 'pickup';
    const label = stageLabels[effectiveStageType] || { ar: effectiveStageType, en: effectiveStageType };

    let title: string;
    let body: string;

    // Handle order-level accept/reject
    if (action === 'order_accepted') {
      title = lang === 'ar' ? '✅ تم قبول طلبك' : '✅ Order Accepted';
      body = lang === 'ar'
        ? 'المندوب قبل طلبك وسيبدأ التنفيذ قريباً'
        : 'The provider accepted your order and will start working on it soon';
    } else if (action === 'order_rejected') {
      title = lang === 'ar' ? '❌ تم رفض طلبك' : '❌ Order Rejected';
      body = lang === 'ar'
        ? 'للأسف، المندوب رفض طلبك. يمكنك إعادة المحاولة مع مندوب آخر.'
        : 'Unfortunately, the provider declined your order. You can try with another provider.';
    } else if (newStatus === 'in_progress') {
      title = lang === 'ar' ? `🚀 بدأت مرحلة ${label.ar}` : `🚀 ${label.en} Stage Started`;
      body = lang === 'ar'
        ? `المندوب بدأ مرحلة "${label.ar}" في طلبك (الخطوة ${sequenceNo || ''})`
        : `The provider has started the "${label.en}" stage of your order (Step ${sequenceNo || ''})`;
    } else if (newStatus === 'completed') {
      title = lang === 'ar' ? `✅ اكتملت مرحلة ${label.ar}` : `✅ ${label.en} Stage Completed`;
      body = lang === 'ar'
        ? `تم إتمام مرحلة "${label.ar}" بنجاح في طلبك`
        : `The "${label.en}" stage has been completed successfully`;
    } else {
      title = lang === 'ar' ? `📋 تحديث المرحلة: ${label.ar}` : `📋 Stage Update: ${label.en}`;
      body = lang === 'ar'
        ? `تم تحديث حالة مرحلة "${label.ar}" إلى ${newStatus}`
        : `The "${label.en}" stage status changed to ${newStatus}`;
    }

    // Create in-app notification
    const notificationType = action === 'order_accepted' || action === 'order_rejected' ? 'order_decision' : 'stage_update';
    await supabaseClient.from('notifications').insert({
      user_id: order.customer_id,
      title,
      body,
      type: notificationType,
      data: { orderId, stageId, stageType, newStatus, sequenceNo, action },
    });

    // Auto-release escrow when stage completes
    if (newStatus === 'completed') {
      try {
        const escrowUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/escrow-release`;
        await fetch(escrowUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            action: 'stage_completed',
            order_id: orderId,
            stage_id: stageId,
          }),
        });
      } catch (escrowErr) {
        console.error('Escrow release error:', escrowErr);
      }
    }

    // Auto-refund on stage failure
    if (newStatus === 'failed') {
      try {
        const escrowUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/escrow-release`;
        await fetch(escrowUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            action: 'refund',
            order_id: orderId,
          }),
        });
      } catch (escrowErr) {
        console.error('Escrow refund error:', escrowErr);
      }
    }

    // Get push subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', order.customer_id);

    const pushCount = subscriptions?.length || 0;
    if (pushCount > 0) {
      console.log(`${pushCount} push subscriptions found for stage notification`);
    }

    return new Response(
      JSON.stringify({ success: true, title, pushSubscriptionsFound: pushCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
