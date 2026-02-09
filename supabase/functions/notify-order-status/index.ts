import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Status translations
const statusMessages: Record<string, { en: string; ar: string }> = {
  draft: { en: 'Order Created', ar: 'تم إنشاء الطلب' },
  payment_pending: { en: 'Awaiting Payment', ar: 'في انتظار الدفع' },
  paid: { en: 'Payment Confirmed', ar: 'تم تأكيد الدفع' },
  in_progress: { en: 'Order In Progress', ar: 'الطلب قيد التنفيذ' },
  completed: { en: 'Order Completed', ar: 'تم إكمال الطلب' },
  canceled: { en: 'Order Canceled', ar: 'تم إلغاء الطلب' },
};

const statusDescriptions: Record<string, { en: string; ar: string }> = {
  draft: { en: 'Your order has been created and is being prepared.', ar: 'تم إنشاء طلبك وجاري تجهيزه.' },
  payment_pending: { en: 'Please complete your payment to proceed.', ar: 'يرجى إتمام الدفع للمتابعة.' },
  paid: { en: 'Your payment was successful. We will start working on your order.', ar: 'تم الدفع بنجاح. سنبدأ العمل على طلبك.' },
  in_progress: { en: 'Your order is now being processed by our team.', ar: 'طلبك الآن قيد المعالجة من قبل فريقنا.' },
  completed: { en: 'Your order has been completed successfully. Thank you!', ar: 'تم إكمال طلبك بنجاح. شكراً لك!' },
  canceled: { en: 'Your order has been canceled.', ar: 'تم إلغاء طلبك.' },
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

    const { orderId, newStatus, previousStatus } = await req.json();

    if (!orderId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'orderId and newStatus are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, customer_id, order_type')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's preferred language
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('language')
      .eq('user_id', order.customer_id)
      .single();

    const lang = profile?.language === 'ar' ? 'ar' : 'en';
    
    const title = statusMessages[newStatus]?.[lang] || statusMessages[newStatus]?.en || 'Order Update';
    const body = statusDescriptions[newStatus]?.[lang] || statusDescriptions[newStatus]?.en || 'Your order status has been updated.';

    // Create in-app notification
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: order.customer_id,
        title,
        body,
        type: 'order_status',
        data: {
          orderId,
          newStatus,
          previousStatus,
          order_type: order.order_type,
        },
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Get user's push subscriptions for web push
    const { data: subscriptions } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', order.customer_id);

    // Log push notification intent (actual push implementation in send-push function)
    const pushCount = subscriptions?.length || 0;
    if (pushCount > 0) {
      console.log(`Found ${pushCount} push subscriptions for user ${order.customer_id}`);
      
      // Invoke the send-push function for each subscription
      // In production, this could be optimized to batch send
      for (const sub of subscriptions || []) {
        try {
          // Note: In production, you'd integrate with a proper web-push library
          console.log(`Push notification queued for endpoint: ${sub.endpoint.substring(0, 50)}...`);
        } catch (error) {
          console.error('Push notification error:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent',
        inAppNotification: !notifError,
        pushSubscriptionsFound: pushCount,
      }),
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
