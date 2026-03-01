import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Send, Bot, User, Sparkles,
  Package, Loader2, CheckCircle2, AlertCircle, Mic, MicOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateOrder } from '@/hooks/useOrders';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedOrder {
  template_id: string;
  summary_ar: string;
  summary_en?: string;
  estimated_price_low?: number;
  estimated_price_high?: number;
  details: Record<string, any>;
  is_complete: boolean;
  missing_fields?: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-order-ai`;

export default function AIOrderChat() {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const voice = useVoiceInput({
    lang,
    onResult: (text) => setInput(prev => prev + (prev ? ' ' : '') + text),
  });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send welcome message
  useEffect(() => {
    const welcome: Message = {
      role: 'assistant',
      content: lang === 'ar'
        ? 'أهلاً! 👋 أنا مساعدك الذكي في **YA**. قولي وش تبي وأنا أرتّب لك كل شي.\n\nمثلاً:\n- "أبي أفصّل عباية حرير سوداء"\n- "سيارتي فيها مشكلة في المكيف"\n- "أبي أحد يشتري لي من ايكيا"\n- "أبي طبخة كبسة لـ 10 أشخاص"'
        : "Hi! 👋 I'm your smart assistant at **YA**. Tell me what you need and I'll arrange everything.\n\nFor example:\n- \"I need a black silk abaya tailored\"\n- \"My car AC isn't working\"\n- \"Buy something from IKEA for me\"\n- \"I need kabsa for 10 people\"",
    };
    setMessages([welcome]);
  }, [lang]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantText = '';

    try {
      // Stream the response
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode: 'chat',
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error(lang === 'ar' ? 'كثرت الطلبات، جرّب بعد شوي' : 'Too many requests, try again later');
          setIsLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast.error(lang === 'ar' ? 'يحتاج تعبئة رصيد' : 'Credits needed');
          setIsLoading(false);
          return;
        }
        throw new Error('Failed');
      }

      if (!resp.body) throw new Error('No body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let toolCallArgs = '';
      let isToolCall = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;

          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta;
            
            // Check for tool calls
            if (delta?.tool_calls) {
              isToolCall = true;
              const tc = delta.tool_calls[0];
              if (tc?.function?.arguments) {
                toolCallArgs += tc.function.arguments;
              }
              continue;
            }
            
            const content = delta?.content;
            if (content) {
              assistantText += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: 'assistant', content: assistantText }];
              });
            }
          } catch { /* partial */ }
        }
      }

      // Handle tool call extraction
      if (isToolCall && toolCallArgs) {
        try {
          const extractedData = JSON.parse(toolCallArgs) as ExtractedOrder;
          setExtracted(extractedData);
          
          // Add a summary message
          const priceText = extractedData.estimated_price_low && extractedData.estimated_price_high
            ? `\n\n💰 ${lang === 'ar' ? 'التقدير:' : 'Estimate:'} ${extractedData.estimated_price_low}-${extractedData.estimated_price_high} ${lang === 'ar' ? 'ر.س' : 'SAR'}`
            : '';
          
          const summaryMsg = extractedData.is_complete
            ? (lang === 'ar' 
              ? `✅ جمعت كل التفاصيل!\n\n📋 **${extractedData.summary_ar}**${priceText}\n\nتبي أرسل الطلب؟`
              : `✅ Got all the details!\n\n📋 **${extractedData.summary_ar}**${priceText}\n\nShall I submit the order?`)
            : (lang === 'ar'
              ? `📝 فهمت طلبك: **${extractedData.summary_ar}**${priceText}\n\nبس أحتاج أعرف: ${extractedData.missing_fields?.join('، ')}`
              : `📝 I understand: **${extractedData.summary_ar}**${priceText}\n\nI still need: ${extractedData.missing_fields?.join(', ')}`);

          if (!assistantText) {
            setMessages(prev => [...prev, { role: 'assistant', content: summaryMsg }]);
          }
        } catch (e) {
          console.error('Failed to parse tool call:', e);
        }
      }

      // If no assistant text was generated and no tool call
      if (!assistantText && !isToolCall) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: lang === 'ar' ? 'عذراً، ما فهمت. ممكن توضح أكثر؟' : 'Sorry, I didn\'t understand. Can you clarify?'
        }]);
      }
    } catch (e) {
      console.error(e);
      toast.error(lang === 'ar' ? 'حدث خطأ، حاول مرة ثانية' : 'Error, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!extracted) return;
    setIsCreating(true);

    try {
      const detailsText = Object.entries(extracted.details)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\n');

      const result = await createOrder.mutateAsync({
        order: {
          order_type: 'DIRECT',
          notes: `[AI Smart Order]\n${extracted.summary_ar}\n\n${detailsText}`,
          status: 'draft',
          totals_json: {
            template_id: extracted.template_id,
            ai_extracted: true,
            estimated_low: extracted.estimated_price_low,
            estimated_high: extracted.estimated_price_high,
            details: extracted.details,
          },
        },
        items: [{
          item_mode: 'free_text',
          catalog_item_id: null,
          free_text_description: extracted.summary_ar,
          quantity: 1,
          unit: null,
          photo_urls: [],
        }],
      });

      toast.success(lang === 'ar' ? 'تم إنشاء الطلب!' : 'Order created!');
      navigate(`/orders/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'Error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick suggestion chips
  const suggestions = lang === 'ar'
    ? ['أبي أفصّل عباية', 'سيارتي تحتاج صيانة', 'أبي طبخ منزلي', 'وصّل لي طرد']
    : ['Tailor an abaya', 'Car needs service', 'Home cooking', 'Deliver a package'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-sm">
              {lang === 'ar' ? 'مساعد YA الذكي' : 'YA Smart Assistant'}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {lang === 'ar' ? 'يفهم طلبك ويرتّبه لك' : 'Understands & arranges your order'}
            </p>
          </div>
          <span className="text-lg font-bold font-en text-primary">YA</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("flex gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ul]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Extracted order card */}
        {extracted?.is_complete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-accent border-2 border-primary/30 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-bold">
                {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h3>
            </div>
            <p className="text-sm">{extracted.summary_ar}</p>
            {extracted.estimated_price_low && extracted.estimated_price_high && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-primary text-lg">
                  {extracted.estimated_price_low}-{extracted.estimated_price_high}
                </span>
                <span className="text-muted-foreground">{lang === 'ar' ? 'ر.س (تقدير)' : 'SAR (est.)'}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(extracted.details).slice(0, 6).map(([key, val]) => (
                <div key={key} className="bg-background/60 rounded-xl px-3 py-2">
                  <span className="text-muted-foreground">{key}:</span>{' '}
                  <span className="font-medium">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleCreateOrder}
              disabled={isCreating}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  {lang === 'ar' ? 'أرسل الطلب' : 'Submit Order'}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Quick suggestions (only when no messages from user yet) */}
        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground font-medium">
              {lang === 'ar' ? 'جرّب تقول:' : 'Try saying:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="px-3 py-2 rounded-xl bg-card border border-border text-sm hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-lg border-t border-border p-3">
        <div className="container flex items-end gap-2">
          {/* Voice */}
          <button
            onClick={voice.toggle}
            disabled={!voice.isSupported}
            className={cn(
              "p-3 rounded-xl transition-all shrink-0",
              voice.isListening
                ? "bg-destructive text-white animate-pulse"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {voice.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'ar' ? 'اكتب أو تكلّم...' : 'Type or speak...'}
            rows={1}
            className="flex-1 rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none max-h-32"
            style={{ minHeight: '48px' }}
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-3 rounded-xl transition-all shrink-0",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground shadow-lg hover:brightness-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
