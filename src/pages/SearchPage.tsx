import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, StaggerList, StaggerItem, staggerContainer, staggerItem } from '@/components/motion/MotionWrappers';
import { Search, Map, List, Navigation, Loader2, X, ArrowLeft, ArrowRight, Clock, Star, MapPin, Mic } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import MerchantsMap from '@/components/map/MerchantsMap';
import { useMerchants, useQualityScores } from '@/hooks/useMerchants';
import { useLang } from '@/contexts/LangContext';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import SearchResultCard from '@/components/search/SearchResultCard';
import SearchChips from '@/components/search/SearchChips';
import SearchTabs from '@/components/search/SearchTabs';
import SearchFilters from '@/components/search/SearchFilters';
import VoiceInputButton from '@/components/shared/VoiceInputButton';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export default function SearchPage() {
  const { t, lang, dir } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const domainFilter = params.get('domain') || undefined;
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'shops' | 'services'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'open'>('rating');

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const { latitude, longitude, loading: geoLoading, requestLocation, hasLocation } = useGeolocation();
  const voice = useVoiceInput({ lang, onResult: (text) => setQuery(text) });

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

  // Process merchants with distance
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

    // Sort
    if (sortBy === 'distance' && hasLocation) {
      list = [...list].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'open') {
      list = [...list].sort((a, b) => {
        const aOpen = a.branch?.open_now ? 1 : 0;
        const bOpen = b.branch?.open_now ? 1 : 0;
        return bOpen - aOpen;
      });
    } else {
      list = [...list].sort((a, b) => {
        const qualityA = qualities?.find(q => q.entity_id === a.merchant.id);
        const qualityB = qualities?.find(q => q.entity_id === b.merchant.id);
        return (Number(qualityB?.composite_score) || 0) - (Number(qualityA?.composite_score) || 0);
      });
    }

    return list;
  }, [merchantsWithDistance, query, sortBy, hasLocation, qualities]);

  const mapMarkers = useMemo(() => {
    return filtered.map(({ merchant }) => {
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

  const mapCenter = useMemo<[number, number]>(() => {
    if (hasLocation && latitude && longitude) return [latitude, longitude];
    return [24.7136, 46.6753];
  }, [hasLocation, latitude, longitude]);

  const handleMarkerClick = (id: string) => navigate(`/merchant/${id}`);

  const chipSuggestions = lang === 'ar'
    ? ['توصيل', 'شراء', 'ورد', 'أقمشة', 'قطع غيار', 'بقالة', 'هدية']
    : ['Delivery', 'Purchase', 'Flowers', 'Fabrics', 'Parts', 'Grocery', 'Gift'];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="container py-3">
          {/* Back + Search */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
              <BackArrow className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'وش تبغى نخلّصه؟' : 'What do you need done?'}
                className="w-full rounded-full border bg-card ps-10 pe-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <VoiceInputButton isListening={voice.isListening} isSupported={voice.isSupported} onToggle={voice.toggle} />
              </div>
            </div>
            {/* View Toggle */}
            <div className="flex rounded-full border bg-card overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn("px-2.5 py-2", viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn("px-2.5 py-2", viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Chips (when query empty) */}
        {!query.trim() && (
          <SearchChips chips={chipSuggestions} onSelect={setQuery} />
        )}

        {/* Tabs + Filters */}
        <div className="container flex items-center gap-2 pb-2">
          <SearchTabs active={activeTab} onChange={setActiveTab} />
          <div className="ms-auto">
            <SearchFilters
              sortBy={sortBy}
              onChange={setSortBy}
              hasLocation={hasLocation}
              onRequestLocation={requestLocation}
              geoLoading={geoLoading}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-4">
        {viewMode === 'map' ? (
          <FadeIn>
            <div className="h-[400px] rounded-xl overflow-hidden shadow-card">
              <MerchantsMap markers={mapMarkers} onMarkerClick={handleMarkerClick} center={mapCenter} />
            </div>
          </FadeIn>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <FadeIn className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>
          </FadeIn>
        ) : (
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {filtered.map(({ merchant, branch, distance }, i) => (
              <motion.div key={merchant.id} variants={staggerItem}>
                <SearchResultCard
                  merchant={merchant}
                  branch={branch || null}
                  quality={qualities?.find(q => q.entity_id === merchant.id) || null}
                  distance={distance}
                  index={i}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* List below map */}
        {viewMode === 'map' && filtered.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-bold text-sm">
              {lang === 'ar' ? 'النتائج' : 'Results'} ({filtered.length})
            </h4>
            <div className="space-y-3">
              {filtered.slice(0, 4).map(({ merchant, branch, distance }, i) => (
                <SearchResultCard
                  key={merchant.id}
                  merchant={merchant}
                  branch={branch || null}
                  quality={qualities?.find(q => q.entity_id === merchant.id) || null}
                  distance={distance}
                  index={i}
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
