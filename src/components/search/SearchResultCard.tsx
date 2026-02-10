import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

interface SearchResultCardProps {
  merchant: any;
  branch: any | null;
  quality: any | null;
  distance: number | null;
  index: number;
}

export default function SearchResultCard({ merchant, branch, quality, distance, index }: SearchResultCardProps) {
  const { lang } = useLang();
  const navigate = useNavigate();

  const name = lang === 'ar' && merchant.business_name_ar ? merchant.business_name_ar : merchant.business_name;
  const address = branch
    ? (lang === 'ar' ? branch.address_text_ar || branch.address_text : branch.address_text)
    : null;
  const score = quality?.composite_score ? Number(quality.composite_score) : null;

  return (
    <button
      onClick={() => navigate(`/merchant/${merchant.id}`)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50",
        "text-start transition-all hover:shadow-ya-sm hover:border-primary/20",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {/* Image */}
      {merchant.logo_url ? (
        <img
          src={merchant.logo_url}
          alt=""
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-muted-foreground">{name[0]}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate">{name}</h3>

        {/* Location */}
        {address && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {address}
            {distance !== null && (
              <span className="shrink-0"> • {distance.toFixed(1)} {lang === 'ar' ? 'كم' : 'km'}</span>
            )}
          </p>
        )}

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {branch?.open_now !== null && branch?.open_now !== undefined && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5",
              branch.open_now ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"
            )}>
              <Clock className="h-2.5 w-2.5" />
              {branch.open_now
                ? (lang === 'ar' ? 'مفتوح' : 'Open')
                : (lang === 'ar' ? 'مغلق' : 'Closed')}
            </span>
          )}
          {score && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-foreground">
              <Star className="h-2.5 w-2.5 fill-rating-star text-rating-star" />
              {score.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <span className="shrink-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full">
        {lang === 'ar' ? 'اطلب' : 'Order'}
      </span>
    </button>
  );
}
