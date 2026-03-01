import { useState, useRef, useEffect, useCallback } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Send, Bot, User, Sparkles,
  Package, Loader2, CheckCircle2, Mic, MicOff, ImagePlus, X, Camera,
  Brain, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateOrder } from '@/hooks/useOrders';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  useCreateAIConversation,
  useUpdateAIConversation,
  useSaveAIChatMessage,
  useAIConversationMessages,
  type AIConversation,
} from '@/hooks/useAIConversations';
import AIConversationHistory from './AIConversationHistory';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
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

interface SavedPreference {
  category: string;
  key: string;
  value: string;
  label_ar?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-order-ai`;

function getTextContent(content: string | MessageContent[]): string {
  if (typeof content === 'string') return content;
  return content.filter(c => c.type === 'text').map(c => c.text || '').join('');
}

function getImageUrls(content: string | MessageContent[]): string[] {
  if (typeof content === 'string') return [];
  return content.filter(c => c.type === 'image_url').map(c => c.image_url?.url || '').filter(Boolean);
}

export default function AIOrderChat() {
  const { lang, dir } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [savedPrefs, setSavedPrefs] = useState<SavedPreference[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createConv = useCreateAIConversation();
  const updateConv = useUpdateAIConversation();
  const saveMsg = useSaveAIChatMessage();
  const { data: loadedMessages } = useAIConversationMessages(activeConvId);

  const voice = useVoiceInput({
    lang,
    onResult: (text) => setInput(prev => prev + (prev ? ' ' : '') + text),
  });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // Build welcome message
  const buildWelcome = useCallback((): Message => ({
    role: 'assistant',
    content: lang === 'ar'
      ? 'أهلاً! 👋 أنا مساعدك الذكي في **YA**. قولي وش تبي وأنا أرتّب لك كل شي.\n\n📸 تقدر ترسل لي **صورة** وأفهم منها المطلوب\n🎤 أو تكلّم بصوتك\n⌨️ أو اكتب طلبك\n\nمثلاً:\n- "أبي أفصّل عباية حرير سوداء"\n- "سيارتي فيها مشكلة في المكيف"\n- ارسل صورة تصميم وقول "أبي زي كذا"'
      : "Hi! 👋 I'm your smart assistant at **YA**.\n\n📸 Send me a **photo** and I'll understand what you need\n🎤 Or speak\n⌨️ Or type\n\nFor example:\n- \"I need a black silk abaya tailored\"\n- \"My car AC isn't working\"\n- Send a design photo and say \"I want this\"",
  }), [lang]);

  // Send welcome on mount
  useEffect(() => {
    if (!activeConvId) {
      setMessages([buildWelcome()]);
    }
  }, [lang, activeConvId, buildWelcome]);

  // Load conversation messages when switching
  useEffect(() => {
    if (loadedMessages && loadedMessages.length > 0 && activeConvId) {
      const restored: Message[] = [buildWelcome()];
      for (const m of loadedMessages) {
        restored.push({ role: m.role as 'user' | 'assistant', content: m.content as any });
      }
      setMessages(restored);
      setExtracted(null);
    }
  }, [loadedMessages, activeConvId, buildWelcome]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files.slice(0, 3)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(lang === 'ar' ? 'الصورة كبيرة جداً (الحد 5MB)' : 'Image too large (max 5MB)');
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPendingImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [lang]);

  const removePendingImage = (idx: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const savePreference = useCallback(async (pref: SavedPreference) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id, preferences_json')
        .eq('user_id', user.id)
        .eq('category', pref.category)
        .maybeSingle();

      const currentPrefs = (existing?.preferences_json as Record<string, any>) || {};
      const updatedPrefs = { ...currentPrefs, [pref.key]: pref.value };

      if (existing) {
        await supabase.from('user_preferences').update({ preferences_json: updatedPrefs }).eq('id', existing.id);
      } else {
        await supabase.from('user_preferences').insert({ user_id: user.id, category: pref.category, preferences_json: updatedPrefs });
      }
      setSavedPrefs(prev => [...prev, pref]);
    } catch (e) {
      console.error('Failed to save preference:', e);
    }
  }, [user]);

  // Ensure conversation exists, create if not
  const ensureConversation = useCallback(async (firstMessageText?: string): Promise<string> => {
    if (activeConvId) return activeConvId;
    const title = firstMessageText
      ? (firstMessageText.length > 40 ? firstMessageText.slice(0, 40) + '…' : firstMessageText)
      : undefined;
    const conv = await createConv.mutateAsync({ title });
    setActiveConvId(conv.id);
    return conv.id;
  }, [activeConvId, createConv]);

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && pendingImages.length === 0) || isLoading) return;

    let userContent: string | MessageContent[];
    if (pendingImages.length > 0) {
      const parts: MessageContent[] = [];
      parts.push({ type: 'text', text: text || (lang === 'ar' ? 'شوف هالصورة وقولي رأيك' : 'Check this image') });
      for (const img of pendingImages) {
        parts.push({ type: 'image_url', image_url: { url: img } });
      }
      userContent = parts;
    } else {
      userContent = text;
    }

    const userMsg: Message = { role: 'user', content: userContent };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setPendingImages([]);
    setIsLoading(true);

    // Persist conversation + user message
    const convId = await ensureConversation(text || (lang === 'ar' ? 'صورة' : 'Image'));
    saveMsg.mutate({ conversation_id: convId, role: 'user', content: userContent });

    let assistantText = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode: 'chat',
          user_id: user?.id,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast.error(lang === 'ar' ? 'كثرت الطلبات، جرّب بعد شوي' : 'Too many requests'); setIsLoading(false); return; }
        if (resp.status === 402) { toast.error(lang === 'ar' ? 'يحتاج تعبئة رصيد' : 'Credits needed'); setIsLoading(false); return; }
        throw new Error('Failed');
      }

      if (!resp.body) throw new Error('No body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let toolCallArgs: Record<string, string> = {};
      let currentToolName = '';

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

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) { currentToolName = tc.function.name; if (!toolCallArgs[currentToolName]) toolCallArgs[currentToolName] = ''; }
                if (tc.function?.arguments) toolCallArgs[currentToolName] += tc.function.arguments;
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

      // Handle tool calls
      let extractedTitle: string | undefined;
      for (const [toolName, args] of Object.entries(toolCallArgs)) {
        if (!args) continue;
        try {
          if (toolName === 'extract_order_details') {
            const extractedData = JSON.parse(args) as ExtractedOrder;
            setExtracted(extractedData);
            extractedTitle = extractedData.template_id;

            const priceText = extractedData.estimated_price_low && extractedData.estimated_price_high
              ? `\n\n💰 ${lang === 'ar' ? 'التقدير:' : 'Estimate:'} ${extractedData.estimated_price_low}-${extractedData.estimated_price_high} ${lang === 'ar' ? 'ر.س' : 'SAR'}`
              : '';

            const summaryMsg = extractedData.is_complete
              ? (lang === 'ar'
                ? `✅ جمعت كل التفاصيل!\n\n📋 **${extractedData.summary_ar}**${priceText}\n\nتبي أرسل الطلب؟`
                : `✅ Got all the details!\n\n📋 **${extractedData.summary_ar}**${priceText}\n\nShall I submit?`)
              : (lang === 'ar'
                ? `📝 فهمت طلبك: **${extractedData.summary_ar}**${priceText}\n\nبس أحتاج أعرف: ${extractedData.missing_fields?.join('، ')}`
                : `📝 Got it: **${extractedData.summary_ar}**${priceText}\n\nStill need: ${extractedData.missing_fields?.join(', ')}`);

            if (!assistantText) {
              assistantText = summaryMsg;
              setMessages(prev => [...prev, { role: 'assistant', content: summaryMsg }]);
            }

            // Update conversation with extracted data
            updateConv.mutate({ id: convId, extracted_order_json: extractedData, template_id: extractedData.template_id });
          } else if (toolName === 'save_user_preference') {
            const pref = JSON.parse(args) as SavedPreference;
            await savePreference(pref);
            toast.success(lang === 'ar' ? `🧠 حفظت: ${pref.label_ar || pref.key} = ${pref.value}` : `🧠 Saved: ${pref.key} = ${pref.value}`, { duration: 2000 });
          }
        } catch (e) {
          console.error('Failed to parse tool call:', toolName, e);
        }
      }

      // Save assistant message
      if (assistantText) {
        saveMsg.mutate({ conversation_id: convId, role: 'assistant', content: assistantText });
      }

      // Update conversation title if we got extraction
      if (extractedTitle && !activeConvId) {
        // title already set
      }

      if (!assistantText && Object.keys(toolCallArgs).length === 0) {
        const fallback = lang === 'ar' ? 'عذراً، ما فهمت. ممكن توضح أكثر؟' : 'Sorry, I didn\'t understand. Can you clarify?';
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
        saveMsg.mutate({ conversation_id: convId, role: 'assistant', content: fallback });
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

      // Link order to conversation
      if (activeConvId) {
        updateConv.mutate({ id: activeConvId, status: 'completed', order_id: result.id });
      }

      toast.success(lang === 'ar' ? 'تم إنشاء الطلب!' : 'Order created!');
      navigate(`/orders/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'Error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectConversation = (conv: AIConversation) => {
    setActiveConvId(conv.id);
    setExtracted(conv.extracted_order_json as ExtractedOrder | null);
    setHistoryOpen(false);
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([buildWelcome()]);
    setExtracted(null);
    setHistoryOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

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
          {savedPrefs.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
              <Brain className="h-3 w-3" />
              <span>{savedPrefs.length}</span>
            </div>
          )}
          {/* History button */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all">
                <History className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-[320px] p-4">
              <SheetHeader className="mb-4">
                <SheetTitle>{lang === 'ar' ? 'المحادثات السابقة' : 'Chat History'}</SheetTitle>
              </SheetHeader>
              <AIConversationHistory
                activeId={activeConvId}
                onSelect={handleSelectConversation}
                onNewChat={handleNewChat}
              />
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold font-en text-primary">YA</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => {
            const text = getTextContent(msg.content);
            const images = getImageUrls(msg.content);
            return (
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
                <div className={cn("max-w-[80%] space-y-2")}>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {images.map((img, imgIdx) => (
                        <img key={imgIdx} src={img} alt="" className="w-24 h-24 object-cover rounded-xl border border-border" />
                      ))}
                    </div>
                  )}
                  {text && (
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                    )}>
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ul]:mb-0">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading */}
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
              <h3 className="font-bold">{lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h3>
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
              {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><Package className="h-5 w-5" />{lang === 'ar' ? 'أرسل الطلب' : 'Submit Order'}</>
              )}
            </button>
          </motion.div>
        )}

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground font-medium">
              {lang === 'ar' ? 'جرّب تقول:' : 'Try saying:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="px-3 py-2 rounded-xl bg-card border border-border text-sm hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 flex-wrap">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border-2 border-primary/30" />
                <button
                  onClick={() => removePendingImage(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-lg border-t border-border p-3">
        <div className="container flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
          <button onClick={() => cameraInputRef.current?.click()} className="p-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0">
            <Camera className="h-5 w-5" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0">
            <ImagePlus className="h-5 w-5" />
          </button>
          <button
            onClick={voice.toggle}
            disabled={!voice.isSupported}
            className={cn("p-3 rounded-xl transition-all shrink-0", voice.isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            {voice.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'ar' ? 'اكتب أو أرسل صورة...' : 'Type or send a photo...'}
            rows={1}
            className="flex-1 rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
            className={cn(
              "p-3 rounded-xl transition-all shrink-0",
              (input.trim() || pendingImages.length > 0) && !isLoading
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
