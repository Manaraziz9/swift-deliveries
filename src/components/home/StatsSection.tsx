import { useLang } from '@/contexts/LangContext';
import { Store, Package, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { 
    value: '4.8', 
    labelAr: 'تقييم', 
    labelEn: 'Rating',
    icon: Star,
  },
  { 
    value: '+10K', 
    labelAr: 'مهمة تمّت', 
    labelEn: 'Tasks Done',
    icon: Package,
  },
  { 
    value: '+500', 
    labelAr: 'جهة معنا', 
    labelEn: 'Partners',
    icon: Store,
  },
];

export default function StatsSection() {
  const { lang } = useLang();

  return (
    <section className="container py-12">
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        {stats.map(({ value, labelAr, labelEn, icon: Icon }, i) => (
          <div 
            key={i}
            className={cn(
              "flex flex-col items-center gap-2 text-center",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Icon className="h-5 w-5 text-ya-accent mb-1" />
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {value}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {lang === 'ar' ? labelAr : labelEn}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
