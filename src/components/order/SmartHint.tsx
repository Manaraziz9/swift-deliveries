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
  const metadata = getIntentMetadata(suggestedIntent);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative bg-gradient-to-r from-accent/10 via-accent/5 to-transparent",
        "border border-accent/20 rounded-2xl p-4 mb-4",
        "animate-fade-in",
        className
      )}
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 end-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-accent" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-1">
            {lang === 'ar' ? 'اقتراح سريع' : 'Quick Suggestion'}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {lang === 'ar'
              ? 'طلبك فيه طرف ثالث. غالبًا راح يكون أنسب إذا حوّلناه إلى «نسّقها لي» عشان نضيف إثباتات وتسليم منظم.'
              : 'Your order involves a third party. It would be better to convert it to "Coordinate for Me" to add proofs and organized delivery.'}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onConvert}
              className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
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
