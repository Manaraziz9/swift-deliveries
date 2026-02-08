import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Map, List, Navigation, Loader2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import MerchantCard from '@/components/shared/MerchantCard';
import MerchantsMap from '@/components/map/MerchantsMap';
import { useMerchants, useQualityScores } from '@/hooks/useMerchants';
import { useLang } from '@/contexts/LangContext';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const domainFilter = params.get('domain') || undefined;
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');

  const { latitude, longitude, loading: geoLoading, requestLocation, hasLocation } = useGeolocation();

  const { data: merchants, isLoading } = useMerchants(domainFilter);
  const merchantIds = (merchants || []).map(m => m.id);
  const { data: qualities } = useQualityScores(merchantIds);
  const { data: branches } = useQuery({
    queryKey: ['all-branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchant_branches').select('*');
      if (error) throw error;
      return data;
    },
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('taxonomy').select('*').eq('type', 'category').eq('active', true).order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Process merchants with distance calculation
  const merchantsWithDistance = useMemo(() => {
    return (merchants || []).map(merchant => {
      const branch = branches?.find(b => b.merchant_id === merchant.id);
      let distance: number | null = null;
      
      if (hasLocation && branch?.lat && branch?.lng && latitude && longitude) {
        distance = calculateDistance(latitude, longitude, branch.lat, branch.lng);
      }
      
      return { merchant, branch, distance };
    });
  }, [merchants, branches, hasLocation, latitude, longitude]);

  const filtered = useMemo(() => {
    let list = merchantsWithDistance;
    
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(({ merchant }) =>
        merchant.business_name.toLowerCase().includes(q) ||
        (merchant.business_name_ar && merchant.business_name_ar.includes(q))
      );
    }
    if (categoryFilter) {
      list = list.filter(({ merchant }) => merchant.category_id === categoryFilter);
    }
    
    // Sort by distance or rating
    if (sortBy === 'distance' && hasLocation) {
      list = [...list].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      // Sort by rating
      list = [...list].sort((a, b) => {
        const qualityA = qualities?.find(q => q.entity_id === a.merchant.id);
        const qualityB = qualities?.find(q => q.entity_id === b.merchant.id);
        return (Number(qualityB?.composite_score) || 0) - (Number(qualityA?.composite_score) || 0);
      });
    }
    
    return list;
  }, [merchantsWithDistance, query, categoryFilter, sortBy, hasLocation, qualities]);

  const mapMarkers = useMemo(() => {
    return filtered.map(({ merchant, distance }) => {
      const branch = branches?.find(b => b.merchant_id === merchant.id);
      const quality = qualities?.find(q => q.entity_id === merchant.id);
      return {
        id: merchant.id,
        lat: branch?.lat || 0,
        lng: branch?.lng || 0,
        name: lang === 'ar' && merchant.business_name_ar ? merchant.business_name_ar : merchant.business_name,
        score: quality?.composite_score ? Number(quality.composite_score) : undefined,
      };
    }).filter(m => m.lat && m.lng);
  }, [filtered, branches, qualities, lang]);

  // Get user location for map center
  const mapCenter = useMemo<[number, number]>(() => {
    if (hasLocation && latitude && longitude) {
      return [latitude, longitude];
    }
    return [24.7136, 46.6753]; // Riyadh default
  }, [hasLocation, latitude, longitude]);

  const handleMarkerClick = (id: string) => {
    navigate(`/merchant/${id}`);
  };

  return (
    <div className="min-h-screen pb-20">
      <TopBar />
      
      {/* Search bar + view toggle */}
      <div className="container pt-4 pb-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-xl border bg-card ps-10 pe-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex rounded-xl border bg-card overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-2 transition-colors",
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "px-3 py-2 transition-colors",
                viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Map className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="container py-2 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              !categoryFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t('viewAll')}
          </button>
          {(categories || []).map(cat => (
            <button
              key={cat.code}
              onClick={() => setCategoryFilter(cat.code === categoryFilter ? null : cat.code)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                categoryFilter === cat.code ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {lang === 'ar' ? cat.name_ar : cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container py-4">
        {/* Location & Sort Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={requestLocation}
            disabled={geoLoading}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
              hasLocation 
                ? "bg-emerald/10 text-emerald" 
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {geoLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
            {hasLocation 
              ? (lang === 'ar' ? 'موقعك محدد' : 'Location set')
              : (lang === 'ar' ? 'حدد موقعك' : 'Set location')
            }
          </button>
          
          {hasLocation && (
            <div className="flex rounded-lg border overflow-hidden text-xs">
              <button
                onClick={() => setSortBy('distance')}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  sortBy === 'distance' ? 'bg-primary text-primary-foreground' : 'bg-card'
                )}
              >
                {lang === 'ar' ? 'الأقرب' : 'Nearest'}
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  sortBy === 'rating' ? 'bg-primary text-primary-foreground' : 'bg-card'
                )}
              >
                {lang === 'ar' ? 'الأعلى تقييماً' : 'Top Rated'}
              </button>
            </div>
          )}
        </div>

        {viewMode === 'map' ? (
          <div className="h-[400px] rounded-xl overflow-hidden shadow-card">
            <MerchantsMap 
              markers={mapMarkers} 
              onMarkerClick={handleMarkerClick}
              center={mapCenter}
            />
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(({ merchant, branch, distance }, i) => (
              <MerchantCard
                key={merchant.id}
                merchant={merchant}
                branch={branch || null}
                quality={qualities?.find(q => q.entity_id === merchant.id) || null}
                index={i}
                distance={distance}
              />
            ))}
          </div>
        )}

        {/* Show list below map */}
        {viewMode === 'map' && filtered.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-bold text-sm">{lang === 'ar' ? 'النتائج' : 'Results'} ({filtered.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.slice(0, 4).map(({ merchant, branch, distance }, i) => (
                <MerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  branch={branch || null}
                  quality={qualities?.find(q => q.entity_id === merchant.id) || null}
                  index={i}
                  distance={distance}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
