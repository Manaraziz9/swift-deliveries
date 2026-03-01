import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(preferences: Record<string, any> | null, userName: string | null) {
  let prefSection = "";
  if (preferences && Object.keys(preferences).length > 0) {
    prefSection = `\n\n## ذاكرة المستخدم (تفضيلات محفوظة):
${userName ? `اسم المستخدم: ${userName}` : ""}
${Object.entries(preferences).map(([cat, prefs]) => {
  const p = prefs as Record<string, any>;
  return `- **${cat}**: ${JSON.stringify(p)}`;
}).join("\n")}

**استخدم هذه المعلومات تلقائياً** — مثلاً إذا عنده مقاس محفوظ لا تسأله مرة ثانية، بس قوله "استخدمت مقاسك المحفوظ M" وكمّل.
إذا تعلّمت تفضيل جديد (مقاس، لون مفضل، ماركة سيارة) استخدم أداة save_user_preference لحفظه.`;
  }

  return `أنت مساعد ذكي عبقري لمنصة "YA" — منصة خدمات سعودية. تتحدث بالعامية السعودية بشكل طبيعي وودود.

## شخصيتك:
أنت مثل صديق ذكي يعرف كل شي. تفهم من أول كلمة وتتوقع احتياجات المستخدم. لا تكرر أسئلة، ولا تطلب معلومات واضحة.

## القوالب المتاحة:
1. **تفصيل وخياطة** (tailoring): نوع القطعة، الستايل، القماش، اللون، المقاسات
2. **صيانة سيارات** (car_repair): نوع الخدمة، ماركة السيارة، الموديل، وصف المشكلة
3. **أكل وطبخ** (food_order): نوع الوجبة، المطبخ، عدد الأشخاص، حساسيات
4. **صيانة منزلية** (home_repair): نوع الصيانة، وصف المشكلة، نوع العقار
5. **تسوّق ومشاوير** (shopping): المحل، قائمة المشتريات، الميزانية
6. **توصيل ونقل** (delivery): نوع الشحنة، هل قابل للكسر، الوصف
7. **أجهزة وتقنية** (tech_repair): نوع الخدمة، نوع الجهاز، وصف المشكلة
8. **خدمات شخصية** (personal): نوع الخدمة، في البيت أو لا
${prefSection}

## قواعد الذكاء في المحادثة:
1. **استخرج أقصى معلومات من أول رسالة** — "أبي عباية حرير سوداء M" = فهمت القطعة والقماش واللون والمقاس
2. **لا تسأل اللي تقدر تفترضه** — لون أسود هو الأشهر للعبايات مثلاً
3. **اسأل سؤال واحد فقط** في كل رد، واختر الأهم
4. **قدّم اقتراحات ذكية** — "أنصحك بالحرير الطبيعي لأنه أفخم" 
5. **إذا أرسل صورة**: حللها بالتفصيل واستخرج منها (التصميم، اللون، النوع، الستايل)
6. **قدّم تقدير السعر تلقائياً** بمجرد ما تجمع معلومات كافية
7. **إذا الطلب واضح وكامل من أول رسالة**: لا تسأل أسئلة إضافية، استخرج التفاصيل مباشرة

## تقدير الأسعار (ريال سعودي):
- تفصيل عباية: 150-500 | ثوب: 100-300 | فستان: 200-800
- تغيير زيت: 80-200 | بنشر: 30-80 | غسيل: 30-100
- طبخ منزلي: 50-200 للشخص | سباكة/كهرباء: 100-500
- توصيل: 15-50 حسب المسافة | تصليح جوال: 100-800

## عندما تجمع معلومات كافية:
استخدم أداة extract_order_details. **لا تنتظر كثير** — إذا عندك 80% من المعلومات، استخرج وحط الباقي كملاحظات.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, user_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch user preferences if user_id provided
    let preferences: Record<string, any> | null = null;
    let userName: string | null = null;
    
    if (user_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get preferences
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("category, preferences_json")
          .eq("user_id", user_id);
        
        if (prefs && prefs.length > 0) {
          preferences = {};
          for (const p of prefs) {
            preferences[p.category] = p.preferences_json;
          }
        }

        // Get user name
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user_id)
          .single();
        
        if (profile) userName = profile.name;
      } catch (e) {
        console.error("Failed to fetch preferences:", e);
      }
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_order_details",
          description: "Extract structured order details from the conversation when enough information is gathered. Use this as soon as you have 80%+ of needed info.",
          parameters: {
            type: "object",
            properties: {
              template_id: {
                type: "string",
                enum: ["tailoring", "car_repair", "food_order", "home_repair", "shopping", "delivery", "tech_repair", "personal"],
              },
              summary_ar: { type: "string", description: "Arabic summary of the order" },
              summary_en: { type: "string", description: "English summary" },
              estimated_price_low: { type: "number" },
              estimated_price_high: { type: "number" },
              details: { type: "object", additionalProperties: true },
              is_complete: { type: "boolean" },
              missing_fields: { type: "array", items: { type: "string" } }
            },
            required: ["template_id", "summary_ar", "details", "is_complete"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "save_user_preference",
          description: "Save a user preference learned from this conversation (size, color, car brand, etc.) for future use",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["tailoring", "car_repair", "food_order", "home_repair", "shopping", "delivery", "tech_repair", "personal", "general"],
              },
              key: { type: "string", description: "Preference key, e.g. 'size', 'favorite_color', 'car_brand'" },
              value: { type: "string", description: "Preference value" },
              label_ar: { type: "string", description: "Arabic label for this preference" }
            },
            required: ["category", "key", "value"]
          }
        }
      }
    ];

    const systemPrompt = buildSystemPrompt(preferences, userName);

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools,
      stream: mode !== "extract",
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "extract") {
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
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
