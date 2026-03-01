import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, Wrench, Search, Zap, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const actions = [
  {
    code: 'BUY',
    icon: ShoppingBag,
    titleAr: 'اشترِ لي',
    titleEn: 'Buy for Me',
    descAr: 'أي منتج من أي محل',
    descEn: 'Any product, any store',
    gradient: 'from-orange-500 to-amber-400',
    bgTint: 'bg-orange-50 dark:bg-orange-950/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    code: 'TASK',
    icon: Truck,
    titleAr: 'وصّل لي',
    titleEn: 'Deliver',
    descAr: 'استلام وتوصيل سريع',
    descEn: 'Fast pickup & delivery',
    gradient: 'from-blue-500 to-cyan-400',
    bgTint: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    code: 'COORDINATE',
    icon: Wrench,
    titleAr: 'خلّص لي مهمة',
    titleEn: 'Get It Done',
    descAr: 'صيانة، حجوزات، وأكثر',
    descEn: 'Errands, bookings & more',
    gradient: 'from-emerald-500 to-green-400',
    bgTint: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    code: 'DISCOVER',
    icon: Search,
    titleAr: 'اكتشف',
    titleEn: 'Discover',
    descAr: 'تصفّح المحلات القريبة',
    descEn: 'Browse nearby shops',
    gradient: 'from-violet-500 to-purple-400',
    bgTint: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
];

export default function QuickActions() {
  const { lang } = useLang();
  const navigate = useNavigate();

  const handleClick = (code: string) => {
    if (code === 'DISCOVER') navigate('/search');
    else navigate(`/create-order?intent=${code}`);
  };

  return (
    <section className="px-4 sm:px-6 -mt-6 relative z-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(({ code, icon: Icon, titleAr, titleEn, descAr, descEn, bgTint, iconColor, gradient }, i) => (
          <motion.button
            key={code}
            onClick={() => handleClick(code)}
            className={cn(
              "relative flex flex-col items-start gap-3 p-4 rounded-2xl text-start overflow-hidden",
              "border border-border/50 backdrop-blur-sm",
              bgTint,
              "hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
              "group"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Gradient accent line */}
            <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-80", gradient)} />

            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              "bg-background/80 shadow-sm",
              "group-hover:scale-110 transition-transform duration-300"
            )}>
              <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {lang === 'ar' ? titleAr : titleEn}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {lang === 'ar' ? descAr : descEn}
              </p>
            </div>

            {/* Hover glow */}
            <div className={cn(
              "absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
              `bg-gradient-to-br ${gradient}`
            )} />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
