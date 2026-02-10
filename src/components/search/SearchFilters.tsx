import { Navigation, Loader2, Star, Clock, MapPin } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  sortBy: 'rating' | 'distance' | 'open';
  onChange: (sort: 'rating' | 'distance' | 'open') => void;
  hasLocation: boolean;
  onRequestLocation: () => void;
  geoLoading: boolean;
}

export default function SearchFilters({ sortBy, onChange, hasLocation, onRequestLocation, geoLoading }: SearchFiltersProps) {
  const { lang } = useLang();

  const filters: { key: 'rating' | 'distance' | 'open'; label: string; icon: any; needsLocation?: boolean }[] = [
    { key: 'rating', label: lang === 'ar' ? 'الأعلى تقييماً' : 'Top Rated', icon: Star },
    { key: 'distance', label: lang === 'ar' ? 'الأقرب' : 'Nearest', icon: MapPin, needsLocation: true },
    { key: 'open', label: lang === 'ar' ? 'مفتوح الآن' : 'Open Now', icon: Clock },
  ];

  const handleClick = (key: 'rating' | 'distance' | 'open') => {
    if (key === 'distance' && !hasLocation) {
      onRequestLocation();
      return;
    }
    onChange(key);
  };

  return (
    <div className="flex gap-1">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => handleClick(f.key)}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-colors",
            sortBy === f.key
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {f.key === 'distance' && geoLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <f.icon className="h-3 w-3" />
          )}
          {f.label}
        </button>
      ))}
    </div>
  );
}
