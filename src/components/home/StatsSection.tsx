import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { Store, Package, Star } from 'lucide-react';

const stats = [
  { value: '4.8', labelAr: 'تقييم', labelEn: 'Rating', icon: Star },
  { value: '+10K', labelAr: 'مهمة تمّت', labelEn: 'Tasks Done', icon: Package },
  { value: '+500', labelAr: 'جهة معنا', labelEn: 'Partners', icon: Store },
];

export default function StatsSection() {
  const { lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Only animate when section is near viewport
      if (rect.top < windowH && rect.bottom > 0) {
        const progress = (windowH - rect.top) / (windowH + rect.height);
        setOffset(Math.min(progress * 30, 30)); // max 30px parallax
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-16 overflow-hidden"
      style={{ transform: `translateY(-${offset}px)` }}
    >
      {/* Subtle divider gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container">
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {stats.map(({ value, labelAr, labelEn, icon: Icon }, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 text-center animate-fade-in"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <Icon className="h-5 w-5 text-ya-accent mb-1" strokeWidth={1.8} />
              <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight font-en">
                {value}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {lang === 'ar' ? labelAr : labelEn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
