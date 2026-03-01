import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Zap, Gift, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const deals = [
  {
    id: 'first-order',
    icon: Gift,
    titleAr: 'أول طلب مجاناً',
    titleEn: 'First Order Free',
    descAr: 'توصيل مجاني لأول طلب',
    descEn: 'Free delivery on your first order',
    gradient: 'from-primary via-amber-400 to-yellow-300',
    action: '/create-order',
  },
  {
    id: 'flash',
    icon: Zap,
    titleAr: 'عرض خاطف ⚡',
    titleEn: 'Flash Deal ⚡',
    descAr: 'خصم 30% على مهام التوصيل',
    descEn: '30% off delivery tasks',
    gradient: 'from-violet-500 via-purple-400 to-fuchsia-400',
    action: '/create-order?intent=TASK',
  },
  {
    id: 'refer',
    icon: Percent,
    titleAr: 'ادعُ صديقك',
    titleEn: 'Refer a Friend',
    descAr: 'اكسب 15 ر.س لكل دعوة',
    descEn: 'Earn 15 SAR per referral',
    gradient: 'from-emerald-500 via-green-400 to-teal-400',
    action: '/profile',
  },
];

export default function DealsStrip() {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="px-4 sm:px-6 py-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          {lang === 'ar' ? 'عروض لك' : 'Deals for You'}
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {deals.map(({ id, icon: Icon, titleAr, titleEn, descAr, descEn, gradient, action }, i) => (
          <motion.button
            key={id}
            onClick={() => navigate(action)}
            className={cn(
              "relative min-w-[260px] sm:min-w-[280px] flex items-center gap-4 p-4 rounded-2xl snap-start",
              "bg-gradient-to-br text-white overflow-hidden shrink-0",
              gradient,
              "hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            )}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 end-2 w-24 h-24 rounded-full border-2 border-white/30" />
              <div className="absolute -bottom-4 -start-4 w-16 h-16 rounded-full border-2 border-white/20" />
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-white" strokeWidth={2} />
            </div>

            <div className="flex-1 text-start relative z-10">
              <h4 className="text-sm font-bold leading-tight">
                {lang === 'ar' ? titleAr : titleEn}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {lang === 'ar' ? descAr : descEn}
              </p>
            </div>

            <Arrow className="h-4 w-4 opacity-70 shrink-0" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
