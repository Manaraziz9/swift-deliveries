import { useParams } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Clock, Star, BadgeCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import QualityBadge from '@/components/shared/QualityBadge';
import { useMerchant, useBranches, useCatalogItems, useQualityScore } from '@/hooks/useMerchants';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

export default function MerchantPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { data: merchant, isLoading } = useMerchant(id);
  const { data: branches } = useBranches(id);
  const { data: catalog } = useCatalogItems(id);
  const { data: quality } = useQualityScore(id);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <TopBar />
        <div className="container py-8 space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!merchant) return null;

  const name = lang === 'ar' && merchant.business_name_ar ? merchant.business_name_ar : merchant.business_name;
  const desc = lang === 'ar' && merchant.description_ar ? merchant.description_ar : merchant.description;
  const tags = Array.isArray(merchant.tags) ? merchant.tags : [];
  const isVerified = tags.includes('verified');

  return (
    <div className="min-h-screen pb-24">
      <TopBar />

      {/* Header */}
      <div className="bg-gradient-navy px-4 py-8 relative overflow-hidden">
        <div className="absolute -top-16 -end-16 h-48 w-48 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
        <div className="container relative">
          <Link to="/search" className="inline-flex items-center gap-1 text-secondary-foreground/60 text-xs mb-4 hover:text-secondary-foreground">
            <ArrowRight className="h-3 w-3 rotate-180" />
            {t('search')}
          </Link>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-secondary-foreground">{name}</h2>
                {isVerified && <BadgeCheck className="h-5 w-5 text-emerald" />}
              </div>
              {desc && <p className="text-secondary-foreground/60 text-sm">{desc}</p>}
            </div>
            {quality?.composite_score && (
              <QualityBadge score={Number(quality.composite_score)} size="lg" />
            )}
          </div>
        </div>
      </div>

      {/* Quality breakdown */}
      {quality && (
        <div className="container py-4">
          <div className="rounded-xl bg-card shadow-card p-4 animate-fade-in">
            <h4 className="font-bold text-sm mb-3">{t('qualityScore')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-primary mb-1">
                  <Star className="h-5 w-5 fill-rating-star text-rating-star" />
                  {Number(quality.internal_avg).toFixed(1)}
                </div>
                <p className="text-[10px] text-muted-foreground">{t('internalRating')}</p>
                <p className="text-[10px] text-muted-foreground">{quality.internal_count} {t('reviews')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-foreground mb-1">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  {quality.external_rating ? Number(quality.external_rating).toFixed(1) : '—'}
                </div>
                <p className="text-[10px] text-muted-foreground">{t('externalRating')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {quality.external_review_count || 0} {t('reviews')} • {quality.external_source || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branches */}
      {branches && branches.length > 0 && (
        <div className="container py-2">
          <h4 className="font-bold text-sm mb-3">{lang === 'ar' ? 'الفروع' : 'Branches'}</h4>
          <div className="space-y-2">
            {branches.map(branch => (
              <div key={branch.id} className="rounded-xl bg-card shadow-card p-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {branch.branch_name || (lang === 'ar' ? branch.address_text_ar : branch.address_text)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {lang === 'ar' ? branch.address_text_ar || branch.address_text : branch.address_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
                      branch.open_now ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"
                    )}>
                      <Clock className="h-3 w-3" />
                      {branch.open_now ? t('openNow') : t('closed')}
                    </span>
                    {branch.phone && (
                      <a href={`tel:${branch.phone}`} className="text-primary">
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog */}
      {catalog && catalog.length > 0 && (
        <div className="container py-4">
          <h4 className="font-bold text-sm mb-3">{t('products')}</h4>
          <div className="space-y-2">
            {catalog.map((item, i) => {
              const itemName = lang === 'ar' && item.name_ar ? item.name_ar : item.name;
              const itemDesc = lang === 'ar' && item.description_ar ? item.description_ar : item.description;
              return (
                <div key={item.id} className="rounded-xl bg-card shadow-card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-sm">{itemName}</h5>
                      {itemDesc && <p className="text-xs text-muted-foreground mt-0.5">{itemDesc}</p>}
                    </div>
                    <div className="text-end shrink-0">
                      <div className="font-bold text-sm text-primary">
                        {item.price_type === 'fixed'
                          ? `${item.price_fixed} ${t('sar')}`
                          : `${item.price_min}–${item.price_max} ${t('sar')}`
                        }
                      </div>
                      <button className="mt-1 text-[10px] font-medium text-primary underline underline-offset-2">
                        {t('addToOrder')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="container">
          <button className="w-full bg-gradient-gold text-primary-foreground py-3.5 rounded-xl font-bold shadow-gold hover:opacity-90 transition-opacity">
            {t('createOrder')}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
