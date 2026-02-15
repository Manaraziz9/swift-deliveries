import { useLang } from '@/contexts/LangContext';
import { Store, Package, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '4.8', labelAr: 'تقييم', labelEn: 'Rating', icon: Star },
  { value: '+10K', labelAr: 'مهمة تمّت', labelEn: 'Tasks Done', icon: Package },
  { value: '+500', labelAr: 'جهة معنا', labelEn: 'Partners', icon: Store },
];

export default function StatsSection() {
  const { lang } = useLang();

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container">
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {stats.map(({ value, labelAr, labelEn, icon: Icon }, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Icon className="h-5 w-5 text-primary mb-1" strokeWidth={1.8} />
              <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight font-en">
                {value}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {lang === 'ar' ? labelAr : labelEn}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
