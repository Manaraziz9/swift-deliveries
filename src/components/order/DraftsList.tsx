import { useLang } from '@/contexts/LangContext';
import { useOrderDrafts, OrderDraft } from '@/hooks/useOrderDrafts';
import { FileText, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getIntentMetadata } from '@/lib/orderIntentRules';

interface DraftsListProps {
  onSelectDraft: (draft: OrderDraft) => void;
  className?: string;
}

export default function DraftsList({ onSelectDraft, className }: DraftsListProps) {
  const { lang, dir } = useLang();
  const { drafts, deleteDraft } = useOrderDrafts();

  const ChevronNext = dir === 'rtl' ? ChevronLeft : ChevronRight;

  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="h-4 w-4" />
        {lang === 'ar' ? 'المسودات المحفوظة' : 'Saved Drafts'}
      </div>

      <div className="space-y-2">
        {drafts.slice(0, 3).map((draft) => {
          const intentMeta = draft.formData.intent 
            ? getIntentMetadata(draft.formData.intent) 
            : null;

          return (
            <button
              key={draft.id}
              onClick={() => onSelectDraft(draft)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl",
                "bg-card border border-border",
                "hover:border-primary/50 hover:shadow-sm transition-all",
                "text-start group"
              )}
            >
              {/* Intent Emoji */}
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                {intentMeta?.emoji || '📝'}
              </div>

              {/* Draft Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {draft.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(draft.updatedAt), {
                      addSuffix: true,
                      locale: lang === 'ar' ? ar : enUS,
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {lang === 'ar' ? `الخطوة ${draft.step}` : `Step ${draft.step}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDraft(draft.id);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronNext className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {drafts.length > 3 && (
        <p className="text-xs text-center text-muted-foreground">
          {lang === 'ar' 
            ? `+${drafts.length - 3} مسودات أخرى` 
            : `+${drafts.length - 3} more drafts`}
        </p>
      )}
    </div>
  );
}
