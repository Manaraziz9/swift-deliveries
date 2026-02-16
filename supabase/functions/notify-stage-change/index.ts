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

    const { orderId, stageId, stageType, newStatus, sequenceNo } = await req.json();

    if (!orderId || !stageId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'orderId, stageId, and newStatus are required' }),
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
    const label = stageLabels[stageType] || { ar: stageType, en: stageType };

    let title: string;
    let body: string;

    if (newStatus === 'in_progress') {
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
    await supabaseClient.from('notifications').insert({
      user_id: order.customer_id,
      title,
      body,
      type: 'stage_update',
      data: { orderId, stageId, stageType, newStatus, sequenceNo },
    });

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
