import { useLang } from '@/contexts/LangContext';
import { Truck, ShoppingBag, Compass, Star, Wrench, Briefcase, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { TranslationKey } from '@/lib/i18n';

const domains = [
  { code: 'TASK_EXECUTION', icon: Truck, labelKey: 'taskExecution' as TranslationKey, color: 'from-primary/20 to-primary/5' },
  { code: 'ASSISTED_PURCHASING', icon: ShoppingBag, labelKey: 'assistedPurchasing' as TranslationKey, color: 'from-emerald/20 to-emerald/5' },
  { code: 'MARKET_DISCOVERY', icon: Compass, labelKey: 'marketDiscovery' as TranslationKey, color: 'from-accent/20 to-accent/5' },
  { code: 'QUALITY_LAYER', icon: Star, labelKey: 'qualityReviews' as TranslationKey, color: 'from-rating-star/20 to-rating-star/5' },
  { code: 'ONSITE_SERVICES', icon: Wrench, labelKey: 'onsiteServices' as TranslationKey, color: 'from-secondary/20 to-secondary/5' },
  { code: 'SME_SUPPORT', icon: Briefcase, labelKey: 'smeSupport' as TranslationKey, color: 'from-navy/20 to-navy/5' },
  { code: 'EXPERIMENTATION', icon: FlaskConical, labelKey: 'tryBeforeBuy' as TranslationKey, color: 'from-destructive/20 to-destructive/5' },
];

export default function DomainTiles() {
  const { t } = useLang();

  return (
    <section className="container py-6">
      <h3 className="text-lg font-bold mb-4">{t('domains')}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {domains.map(({ code, icon: Icon, labelKey, color }, i) => (
          <Link
            key={code}
            to={`/search?domain=${code}`}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl bg-gradient-to-b p-4 transition-transform hover:scale-105 animate-scale-in",
              color
            )}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="rounded-full bg-card p-2.5 shadow-card">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
