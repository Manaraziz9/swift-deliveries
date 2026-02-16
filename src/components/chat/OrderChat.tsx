import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: string;
  message: string | null;
  image_url: string | null;
  created_at: string;
}

interface OrderChatProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderChat({ orderId, isOpen, onClose }: OrderChatProps) {
  const { user } = useAuth();
  const { lang, dir } = useLang();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', orderId],
    enabled: !!user && isOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user || !isOpen) return;
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        queryClient.setQueryData(
          ['chat-messages', orderId],
          (old: ChatMessage[] | undefined) => {
            if (!old) return [payload.new as ChatMessage];
            if (old.find(m => m.id === (payload.new as ChatMessage).id)) return old;
            return [...old, payload.new as ChatMessage];
          }
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, orderId, isOpen, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    const msg = text.trim();
    setText('');
    try {
      await supabase.from('chat_messages').insert({
        order_id: orderId,
        sender_id: user.id,
        sender_role: 'customer',
        message: msg,
      });
    } catch {
      setText(msg);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSending(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat/${orderId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('chat_messages').insert({
        order_id: orderId,
        sender_id: user.id,
        sender_role: 'customer',
        message: null,
        image_url: urlData.publicUrl,
      });
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex flex-col bg-background"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-bold text-sm flex-1">
            {lang === 'ar' ? 'محادثة الطلب' : 'Order Chat'}
          </h2>
          <span className="text-xs text-muted-foreground">#{orderId.slice(0, 8)}</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {lang === 'ar' ? 'ابدأ المحادثة مع المندوب' : 'Start chatting with the provider'}
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5',
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}>
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt=""
                      className="rounded-xl max-w-full max-h-48 object-cover mb-1"
                    />
                  )}
                  {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                  <p className={cn(
                    'text-[10px] mt-1',
                    isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    {new Date(msg.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 safe-area-bottom">
          <div className="flex items-center gap-2">
            <label className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <ImageIcon className="h-5 w-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
              className="flex-1 rounded-xl border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:brightness-95 transition-all"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
