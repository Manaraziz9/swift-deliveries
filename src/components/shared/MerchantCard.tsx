import { useLang } from '@/contexts/LangContext';
import { MapPin, Clock, BadgeCheck, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import QualityBadge from './QualityBadge';
import { cn } from '@/lib/utils';

interface MerchantCardProps {
  merchant: {
    id: string;
    business_name: string;
    business_name_ar?: string | null;
    category_id?: string | null;
    tags?: unknown;
    verification_status?: string | null;
    logo_url?: string | null;
  };
  branch?: {
    address_text?: string | null;
    address_text_ar?: string | null;
    open_now?: boolean | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  quality?: {
    composite_score?: number | null;
    internal_count?: number | null;
  } | null;
  index?: number;
  distance?: number | null;
}

export default function MerchantCard({ merchant, branch, quality, index = 0, distance }: MerchantCardProps) {
  const { lang, t } = useLang();
  const name = lang === 'ar' && merchant.business_name_ar ? merchant.business_name_ar : merchant.business_name;
  const address = lang === 'ar' && branch?.address_text_ar ? branch.address_text_ar : branch?.address_text;
  const tags = Array.isArray(merchant.tags) ? merchant.tags : [];
  const isVerified = tags.includes('verified') || merchant.verification_status === 'verified';

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} ${lang === 'ar' ? 'م' : 'm'}`;
    }
    return `${km.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}`;
  };

  return (
    <Link
      to={`/merchant/${merchant.id}`}
      className="block rounded-xl bg-card shadow-card overflow-hidden hover:shadow-lg transition-all animate-fade-in group"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Color bar */}
      <div className="h-1.5 bg-gradient-gold" />
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {merchant.logo_url && (
              <img 
                src={merchant.logo_url} 
                alt="" 
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h4 className="font-bold text-sm truncate">{name}</h4>
                {isVerified && <BadgeCheck className="h-4 w-4 text-emerald shrink-0" />}
              </div>
              {address && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>
          </div>
          {quality?.composite_score ? (
            <QualityBadge score={quality.composite_score} size="sm" />
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {branch && (
            <span className={cn(
              "flex items-center gap-1",
              branch.open_now ? "text-emerald" : "text-destructive"
            )}>
              <Clock className="h-3 w-3" />
              {branch.open_now ? t('openNow') : t('closed')}
            </span>
          )}
          {distance !== undefined && distance !== null && (
            <span className="flex items-center gap-1 text-primary">
              <Navigation className="h-3 w-3" />
              {formatDistance(distance)}
            </span>
          )}
          {quality?.internal_count ? (
            <span>{quality.internal_count} {t('reviews')}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
