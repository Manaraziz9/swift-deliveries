import { useLang } from '@/contexts/LangContext';
import { Lightbulb, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Intent, getIntentMetadata } from '@/lib/orderIntentRules';

interface SmartHintProps {
  isVisible: boolean;
  onConvert: () => void;
  onDismiss: () => void;
  suggestedIntent: Intent;
  className?: string;
}

export default function SmartHint({
  isVisible,
  onConvert,
  onDismiss,
  suggestedIntent,
  className,
}: SmartHintProps) {
  const { lang } = useLang();

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative bg-gradient-to-r from-ya-highlight/10 via-ya-highlight/5 to-transparent",
        "border-2 border-ya-highlight/20 rounded-ya-lg p-4 mb-4",
        "animate-fade-in",
        className
      )}
    >
      {/* Highlight bar */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-ya-highlight rounded-t-ya-lg" />

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 end-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-ya-md bg-ya-highlight/15 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-ya-highlight" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">
            {lang === 'ar' ? 'اقتراح سريع' : 'Quick Suggestion'}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {lang === 'ar'
              ? 'بس تنبيه 👀 طلبك فيه طرف ثاني، وغالبًا بيكون أسهل لو نسّقناها لك.'
              : 'Heads up 👀 Your order involves another party. It would be easier if we coordinate it for you.'}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onConvert}
              className="btn-ya py-2 px-4 text-sm flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              {lang === 'ar' ? 'حوّل الآن' : 'Convert Now'}
            </button>
            <button
              onClick={onDismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              {lang === 'ar' ? 'كمّل بدون تحويل' : 'Continue without converting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
