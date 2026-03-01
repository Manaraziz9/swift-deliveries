import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت مساعد ذكي لمنصة "YA" — منصة خدمات سعودية. تتحدث بالعربية الفصحى البسيطة أو العامية السعودية حسب أسلوب المستخدم.

## دورك:
أنت تساعد المستخدم يحدد طلبه بطريقة محادثة طبيعية. بدل ما يعبي نموذج، يتكلم معك وأنت تجمع كل المعلومات المطلوبة.

## القوالب المتاحة:
1. **تفصيل وخياطة**: نوع القطعة، الستايل، القماش، اللون، المقاسات، صورة التصميم
2. **صيانة سيارات**: نوع الخدمة، ماركة السيارة، الموديل، وصف المشكلة، الاستعجال
3. **أكل وطبخ**: نوع الوجبة، المطبخ، عدد الأشخاص، حساسيات، تفاصيل الأطباق
4. **صيانة منزلية**: نوع الصيانة، وصف المشكلة، نوع العقار، الاستعجال
5. **تسوّق ومشاوير**: المحل، قائمة المشتريات، الميزانية، سياسة البدائل
6. **توصيل ونقل**: نوع الشحنة، هل قابل للكسر، الوصف
7. **أجهزة وتقنية**: نوع الخدمة، نوع الجهاز، وصف المشكلة
8. **خدمات شخصية**: نوع الخدمة، في البيت أو لا، التفاصيل

## قواعد المحادثة:
- ابدأ بترحيب قصير واسأل المستخدم إيش يبي
- اسأل سؤال واحد أو اثنين بالمرة، لا تطلب كل المعلومات دفعة واحدة
- اقترح خيارات عندما يكون ممكناً (مثل: "تبي حرير ولا قطن ولا شيفون؟")
- قدّم تقدير سعر تقريبي عندما تجمع معلومات كافية
- إذا المستخدم كتب جملة كاملة فيها تفاصيل، استخرج كل المعلومات منها مباشرة
- كن ودود ومختصر

## عندما تجمع معلومات كافية:
استخدم أداة extract_order_details لتجميع البيانات.

## تقدير الأسعار التقريبية (بالريال السعودي):
- تفصيل عباية: 150-500 | ثوب: 100-300 | فستان: 200-800
- تغيير زيت: 80-200 | بنشر: 30-80 | غسيل: 30-100
- طبخ منزلي: 50-200 للشخص حسب النوع
- سباكة/كهرباء: 100-500 | تكييف: 150-600
- توصيل: 15-50 حسب المسافة
- تصليح جوال شاشة: 100-800 حسب النوع`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_order_details",
          description: "Extract structured order details from the conversation when enough information is gathered",
          parameters: {
            type: "object",
            properties: {
              template_id: {
                type: "string",
                enum: ["tailoring", "car_repair", "food_order", "home_repair", "shopping", "delivery", "tech_repair", "personal"],
                description: "The service template that best matches the order"
              },
              summary_ar: { type: "string", description: "Arabic summary of the order" },
              summary_en: { type: "string", description: "English summary of the order" },
              estimated_price_low: { type: "number", description: "Low end price estimate in SAR" },
              estimated_price_high: { type: "number", description: "High end price estimate in SAR" },
              details: {
                type: "object",
                description: "All extracted order details as key-value pairs",
                additionalProperties: true
              },
              is_complete: {
                type: "boolean",
                description: "Whether enough information has been gathered to place the order"
              },
              missing_fields: {
                type: "array",
                items: { type: "string" },
                description: "List of important fields still missing"
              }
            },
            required: ["template_id", "summary_ar", "details", "is_complete"]
          }
        }
      }
    ];

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools,
      stream: mode !== "extract", // Don't stream for extraction mode
    };

    if (mode === "extract") {
      body.tool_choice = { type: "function", function: { name: "extract_order_details" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "extract") {
      // Non-streaming: parse and return tool call result
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          return new Response(JSON.stringify({ extracted: args }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ error: "parse_error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      // If no tool call, return the message content
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ message: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming mode
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("smart-order-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
