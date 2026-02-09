import { useLang } from '@/contexts/LangContext';
import { Truck, ShoppingBag, Compass, Star, Wrench, Briefcase, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { TranslationKey } from '@/lib/i18n';

const domains = [
  { code: 'TASK_EXECUTION', icon: Truck, labelKey: 'taskExecution' as TranslationKey, gradient: 'from-primary/20 via-primary/10 to-transparent', iconBg: 'bg-primary/15', iconColor: 'text-primary' },
  { code: 'ASSISTED_PURCHASING', icon: ShoppingBag, labelKey: 'assistedPurchasing' as TranslationKey, gradient: 'from-emerald/20 via-emerald/10 to-transparent', iconBg: 'bg-emerald/15', iconColor: 'text-emerald' },
  { code: 'MARKET_DISCOVERY', icon: Compass, labelKey: 'marketDiscovery' as TranslationKey, gradient: 'from-accent/20 via-accent/10 to-transparent', iconBg: 'bg-accent/15', iconColor: 'text-accent' },
  { code: 'QUALITY_LAYER', icon: Star, labelKey: 'qualityReviews' as TranslationKey, gradient: 'from-rating-star/20 via-rating-star/10 to-transparent', iconBg: 'bg-rating-star/15', iconColor: 'text-rating-star' },
  { code: 'ONSITE_SERVICES', icon: Wrench, labelKey: 'onsiteServices' as TranslationKey, gradient: 'from-secondary/20 via-secondary/10 to-transparent', iconBg: 'bg-secondary/15', iconColor: 'text-secondary' },
  { code: 'SME_SUPPORT', icon: Briefcase, labelKey: 'smeSupport' as TranslationKey, gradient: 'from-navy/20 via-navy/10 to-transparent', iconBg: 'bg-navy/15', iconColor: 'text-navy' },
  { code: 'EXPERIMENTATION', icon: FlaskConical, labelKey: 'tryBeforeBuy' as TranslationKey, gradient: 'from-destructive/20 via-destructive/10 to-transparent', iconBg: 'bg-destructive/15', iconColor: 'text-destructive' },
];

export default function DomainTiles() {
  const { t } = useLang();

  return (
    <section className="container py-8">
      <h3 className="text-xl font-bold mb-5">{t('domains')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {domains.map(({ code, icon: Icon, labelKey, gradient, iconBg, iconColor }, i) => (
          <Link
            key={code}
            to={`/search?domain=${code}`}
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-2xl bg-card p-5 overflow-hidden",
              "shadow-card transition-all duration-300",
              "hover:shadow-card-hover hover:-translate-y-1",
              "animate-scale-in"
            )}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {/* Gradient background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-100",
              gradient
            )} />
            
            {/* Icon container */}
            <div className={cn(
              "relative z-10 rounded-2xl p-4 transition-all duration-300",
              iconBg,
              "group-hover:scale-110 group-hover:shadow-lg"
            )}>
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            
            {/* Label */}
            <span className="relative z-10 text-sm font-semibold text-center leading-tight">
              {t(labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
