import { useLang } from '@/contexts/LangContext';
import { MapPin, Clock, BadgeCheck, Navigation, ArrowUpRight, Star } from 'lucide-react';
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
    internal_avg?: number | null;
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
      className="card-ya group block animate-fade-in"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Logo */}
            <div className="relative shrink-0">
              {merchant.logo_url ? (
                <img 
                  src={merchant.logo_url} 
                  alt="" 
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {name.charAt(0)}
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -end-1 bg-success rounded-full p-0.5">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                {name}
              </h4>
              {address && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>
          </div>
          
          {quality?.composite_score ? (
            <QualityBadge score={quality.composite_score} size="sm" />
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {branch && (
              <span className={cn(
                "flex items-center gap-1.5 font-medium",
                branch.open_now ? "text-success" : "text-destructive"
              )}>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  branch.open_now ? "bg-success animate-pulse" : "bg-destructive"
                )} />
                {branch.open_now ? t('openNow') : t('closed')}
              </span>
            )}
            {distance !== undefined && distance !== null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5" />
                {formatDistance(distance)}
              </span>
            )}
            {quality?.internal_avg && quality.internal_avg > 0 ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-ya-highlight fill-ya-highlight" />
                <span className="font-medium text-foreground">{Number(quality.internal_avg).toFixed(1)}</span>
                {quality.internal_count ? (
                  <span>({quality.internal_count})</span>
                ) : null}
              </span>
            ) : quality?.internal_count ? (
              <span className="text-muted-foreground">{quality.internal_count} {t('reviews')}</span>
            ) : null}
          </div>
          
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
