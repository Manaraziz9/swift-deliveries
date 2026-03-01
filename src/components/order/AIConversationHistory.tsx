import { useLang } from '@/contexts/LangContext';
import { useAIConversations, useDeleteAIConversation, type AIConversation } from '@/hooks/useAIConversations';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, Clock, Package, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Props {
  activeId: string | null;
  onSelect: (conv: AIConversation) => void;
  onNewChat: () => void;
}

const TEMPLATE_LABELS: Record<string, { ar: string; en: string }> = {
  tailoring: { ar: 'تفصيل', en: 'Tailoring' },
  car_repair: { ar: 'سيارات', en: 'Car' },
  food_order: { ar: 'طبخ', en: 'Food' },
  home_repair: { ar: 'صيانة', en: 'Home' },
  shopping: { ar: 'تسوّق', en: 'Shopping' },
  delivery: { ar: 'توصيل', en: 'Delivery' },
  tech_repair: { ar: 'تقنية', en: 'Tech' },
  personal: { ar: 'شخصي', en: 'Personal' },
};

export default function AIConversationHistory({ activeId, onSelect, onNewChat }: Props) {
  const { lang } = useLang();
  const { data: conversations, isLoading } = useAIConversations();
  const deleteConv = useDeleteAIConversation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* New chat button */}
      <button
        onClick={onNewChat}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-95 transition-all"
      >
        <Plus className="h-4 w-4" />
        {lang === 'ar' ? 'محادثة جديدة' : 'New Chat'}
      </button>

      {/* Conversations list */}
      {(!conversations || conversations.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {lang === 'ar' ? 'ما عندك محادثات سابقة' : 'No previous chats'}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {conversations.map(conv => {
            const templateLabel = conv.template_id ? TEMPLATE_LABELS[conv.template_id] : null;
            const timeAgo = formatDistanceToNow(new Date(conv.updated_at), {
              addSuffix: true,
              locale: lang === 'ar' ? ar : enUS,
            });

            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                onClick={() => onSelect(conv)}
                className={cn(
                  "w-full text-start flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all group",
                  activeId === conv.id
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card border-border hover:border-primary/20 hover:bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  conv.order_id ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                )}>
                  {conv.order_id ? (
                    <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.title || (lang === 'ar' ? 'محادثة بدون عنوان' : 'Untitled chat')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {templateLabel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                        {lang === 'ar' ? templateLabel.ar : templateLabel.en}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteConv.mutate(conv.id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.button>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
