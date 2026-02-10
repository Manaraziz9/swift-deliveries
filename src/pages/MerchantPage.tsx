import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, MapPin, Phone, Clock, Star, BadgeCheck, Image } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import QualityBadge from '@/components/shared/QualityBadge';
import { useMerchant, useBranches, useCatalogItems, useQualityScore } from '@/hooks/useMerchants';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

export default function MerchantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, dir } = useLang();
  const { data: merchant, isLoading } = useMerchant(id);
  const { data: branches } = useBranches(id);
  const { data: catalog } = useCatalogItems(id);
  const { data: quality } = useQualityScore(id);

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

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
  const mainBranch = branches?.[0];

  return (
    <div className="min-h-screen pb-24">
      <TopBar />

      {/* Header */}
      <div className="container pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <BackArrow className="h-4 w-4" />
          {lang === 'ar' ? 'رجوع' : 'Back'}
        </button>

        <div className="flex items-start gap-4">
          {merchant.logo_url ? (
            <img src={merchant.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">{name[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{name}</h1>
              {isVerified && <BadgeCheck className="h-5 w-5 text-emerald shrink-0" />}
            </div>
            {desc && <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>}
            {quality?.composite_score && (
              <div className="mt-2">
                <QualityBadge score={Number(quality.composite_score)} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location & Hours */}
      {mainBranch && (
        <div className="container py-3">
          <div className="rounded-2xl bg-card border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{lang === 'ar' ? mainBranch.address_text_ar || mainBranch.address_text : mainBranch.address_text}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1",
                mainBranch.open_now ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"
              )}>
                <Clock className="h-3 w-3" />
                {mainBranch.open_now
                  ? (lang === 'ar' ? 'مفتوح الآن' : 'Open Now')
                  : (lang === 'ar' ? 'مغلق' : 'Closed')}
              </span>
              {mainBranch.phone && (
                <a href={`tel:${mainBranch.phone}`} className="inline-flex items-center gap-1 text-xs text-primary">
                  <Phone className="h-3 w-3" />
                  {mainBranch.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ratings */}
      {quality && (
        <div className="container py-2">
          <div className="rounded-2xl bg-card border p-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xl font-bold">
                  <Star className="h-5 w-5 fill-rating-star text-rating-star" />
                  {Number(quality.internal_avg).toFixed(1)}
                </div>
                <p className="text-[10px] text-muted-foreground">{quality.internal_count} {lang === 'ar' ? 'تقييم' : 'reviews'}</p>
              </div>
              {quality.external_rating && (
                <div className="text-center border-s ps-4">
                  <div className="text-xl font-bold">{Number(quality.external_rating).toFixed(1)}</div>
                  <p className="text-[10px] text-muted-foreground">{quality.external_source}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photos / Catalog preview */}
      {catalog && catalog.length > 0 && (
        <div className="container py-3">
          <h4 className="font-bold text-sm mb-3">{lang === 'ar' ? 'المنتجات' : 'Products'}</h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {catalog.slice(0, 6).map(item => {
              const photos = item.photos as string[] | null;
              const itemName = lang === 'ar' && item.name_ar ? item.name_ar : item.name;
              return (
                <div key={item.id} className="shrink-0 w-28">
                  {photos && photos.length > 0 ? (
                    <img src={photos[0]} alt={itemName} className="w-28 h-28 rounded-xl object-cover" />
                  ) : (
                    <div className="w-28 h-28 rounded-xl bg-muted flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs font-medium mt-1 truncate">{itemName}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="container">
          <button
            onClick={() => navigate(`/create-order?merchant=${id}&branch=${branches?.[0]?.id || ''}`)}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-ya-accent hover:brightness-95 transition-all"
          >
            {lang === 'ar' ? 'اطلب' : 'Order'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
