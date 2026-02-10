import { useRef } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { Truck, ShoppingBag, RefreshCw, Search, Star, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

const intents = [
  { code: 'TASK', icon: Truck, titleAr: 'خلّص لي مهمة', titleEn: 'Complete a Task' },
  { code: 'BUY', icon: ShoppingBag, titleAr: 'اشترِ لي', titleEn: 'Buy for Me' },
  { code: 'COORDINATE', icon: RefreshCw, titleAr: 'نسّقها لي', titleEn: 'Coordinate' },
  { code: 'DISCOVER', icon: Search, titleAr: 'اكتشف السوق', titleEn: 'Discover' },
  { code: 'RATE', icon: Star, titleAr: 'قيّم قبل ما تختار', titleEn: 'Rate First' },
  { code: 'TRY', icon: FlaskConical, titleAr: 'جرّب بدون مخاطرة', titleEn: 'Try Risk-Free' },
];

export default function IntentStrip() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClick = (code: string) => {
    if (code === 'DISCOVER') {
      navigate('/search');
    } else if (code === 'RATE') {
      navigate('/search?sort=quality');
    } else {
      navigate(`/create-order?intent=${code}`);
    }
  };

  return (
    <section className="py-6">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 snap-x snap-mandatory"
      >
        {intents.map(({ code, icon: Icon, titleAr, titleEn }) => (
          <button
            key={code}
            onClick={() => handleClick(code)}
            className={cn(
              "flex flex-col items-center gap-2.5 min-w-[100px] p-4 rounded-2xl snap-start",
              "bg-card border border-border/40",
              "transition-all duration-200",
              "hover:border-primary/30 hover:shadow-ya-sm hover:-translate-y-0.5",
              "active:scale-[0.97]"
            )}
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-foreground text-center leading-tight whitespace-nowrap">
              {lang === 'ar' ? titleAr : titleEn}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
