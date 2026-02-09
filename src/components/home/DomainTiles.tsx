import { useLang } from '@/contexts/LangContext';
import { Truck, ShoppingBag, Compass, Star, Wrench, Briefcase, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { TranslationKey } from '@/lib/i18n';

const domains = [
  { code: 'TASK_EXECUTION', icon: Truck, labelKey: 'taskExecution' as TranslationKey, color: 'text-primary' },
  { code: 'ASSISTED_PURCHASING', icon: ShoppingBag, labelKey: 'assistedPurchasing' as TranslationKey, color: 'text-ya-accent' },
  { code: 'MARKET_DISCOVERY', icon: Compass, labelKey: 'marketDiscovery' as TranslationKey, color: 'text-muted-foreground' },
  { code: 'QUALITY_LAYER', icon: Star, labelKey: 'qualityReviews' as TranslationKey, color: 'text-ya-highlight' },
  { code: 'ONSITE_SERVICES', icon: Wrench, labelKey: 'onsiteServices' as TranslationKey, color: 'text-secondary-foreground' },
  { code: 'SME_SUPPORT', icon: Briefcase, labelKey: 'smeSupport' as TranslationKey, color: 'text-primary' },
  { code: 'EXPERIMENTATION', icon: FlaskConical, labelKey: 'tryBeforeBuy' as TranslationKey, color: 'text-ya-accent' },
];

export default function DomainTiles() {
  const { t } = useLang();

  return (
    <section className="container py-10">
      <h3 className="text-xl font-bold mb-6 text-center">{t('domains')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {domains.map(({ code, icon: Icon, labelKey, color }, i) => (
          <Link
            key={code}
            to={`/search?domain=${code}`}
            className={cn(
              "group flex flex-col items-center gap-3 rounded-ya-md bg-card p-5",
              "border border-border/50 transition-all duration-200",
              "hover:border-ya-accent/50 hover:shadow-ya-sm hover:-translate-y-0.5",
              "animate-scale-in"
            )}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Icon - simple, no background */}
            <Icon className={cn("h-7 w-7 transition-transform group-hover:scale-110", color)} />
            
            {/* Label */}
            <span className="text-sm font-medium text-center leading-tight text-foreground">
              {t(labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
