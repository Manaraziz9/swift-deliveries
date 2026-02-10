import { useLang } from '@/contexts/LangContext';
import { Truck, ShoppingBag, Compass, Star, Wrench, Briefcase, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { TranslationKey } from '@/lib/i18n';

const domains = [
  { code: 'TASK_EXECUTION', icon: Truck, labelKey: 'taskExecution' as TranslationKey },
  { code: 'ASSISTED_PURCHASING', icon: ShoppingBag, labelKey: 'assistedPurchasing' as TranslationKey },
  { code: 'MARKET_DISCOVERY', icon: Compass, labelKey: 'marketDiscovery' as TranslationKey },
  { code: 'QUALITY_LAYER', icon: Star, labelKey: 'qualityReviews' as TranslationKey },
  { code: 'ONSITE_SERVICES', icon: Wrench, labelKey: 'onsiteServices' as TranslationKey },
  { code: 'SME_SUPPORT', icon: Briefcase, labelKey: 'smeSupport' as TranslationKey },
  { code: 'EXPERIMENTATION', icon: FlaskConical, labelKey: 'tryBeforeBuy' as TranslationKey },
];

export default function DomainTiles() {
  const { t } = useLang();

  return (
    <section className="container py-14">
      <h3 className="text-lg font-bold mb-8 text-center text-muted-foreground tracking-widest uppercase font-en">
        {t('domains')}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {domains.map(({ code, icon: Icon, labelKey }, i) => (
          <Link
            key={code}
            to={`/search?domain=${code}`}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl",
              "bg-card border border-border/40",
              "transition-all duration-300 ease-out",
              "hover:bg-ya-accent hover:border-ya-accent hover:shadow-ya-md hover:-translate-y-1",
              "animate-fade-in-up"
            )}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <Icon
              className="h-8 w-8 text-ya-primary transition-colors duration-300 group-hover:text-ya-highlight"
              strokeWidth={1.8}
            />
            <span className="text-sm font-semibold text-center leading-tight text-foreground transition-colors duration-300 group-hover:text-white">
              {t(labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
