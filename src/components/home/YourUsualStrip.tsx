import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, RotateCcw } from 'lucide-react';

export default function YourUsualStrip() {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: suggestions = [] } = useSmartSuggestions();

  if (!user || suggestions.length === 0) return null;

  return (
    <section className="container px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">
          {lang === 'ar' ? 'طلباتك المعتادة' : 'Your Usual'}
        </h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate(`/create-order?merchant=${s.merchantId || ''}`)}
            className="min-w-[160px] max-w-[200px] flex flex-col gap-1.5 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-ya-sm transition-all text-start shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold truncate">
                {lang === 'ar' ? s.merchantNameAr : s.merchantName}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {lang === 'ar' ? s.itemsSummaryAr : s.itemsSummary}
            </p>
            <span className="text-[10px] text-primary font-medium">
              {lang === 'ar' ? `${s.orderCount}x طلبت` : `Ordered ${s.orderCount}x`}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
