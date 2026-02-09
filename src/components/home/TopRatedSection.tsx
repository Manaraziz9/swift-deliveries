import { useLang } from '@/contexts/LangContext';
import { useMerchants, useQualityScores } from '@/hooks/useMerchants';
import MerchantCard from '@/components/shared/MerchantCard';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Award } from 'lucide-react';

export default function TopRatedSection() {
  const { t, dir } = useLang();
  const { data: merchants, isLoading } = useMerchants();
  const merchantIds = (merchants || []).map(m => m.id);
  const { data: qualities } = useQualityScores(merchantIds);
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // Get first branch for each merchant
  const { data: branches } = useQuery({
    queryKey: ['all-branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchant_branches').select('*');
      if (error) throw error;
      return data;
    },
  });

  const sorted = [...(merchants || [])].sort((a, b) => {
    const qa = qualities?.find(q => q.entity_id === a.id)?.composite_score || 0;
    const qb = qualities?.find(q => q.entity_id === b.id)?.composite_score || 0;
    return Number(qb) - Number(qa);
  }).slice(0, 4);

  return (
    <section className="container py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rating-star/15 flex items-center justify-center">
            <Award className="h-5 w-5 text-rating-star" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{t('topRated')}</h3>
            <p className="text-sm text-muted-foreground">
              {dir === 'rtl' ? 'أفضل المحلات تقييماً' : 'Highest rated merchants'}
            </p>
          </div>
        </div>
        <Link 
          to="/search" 
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t('viewAll')}
          <Arrow className="h-4 w-4" />
        </Link>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-premium p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-2/3 skeleton" />
                  <div className="h-4 w-1/2 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((merchant, i) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              branch={branches?.find(b => b.merchant_id === merchant.id) || null}
              quality={qualities?.find(q => q.entity_id === merchant.id) || null}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-muted/50">
          <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {dir === 'rtl' ? 'لا توجد محلات حالياً' : 'No merchants yet'}
          </p>
        </div>
      )}
    </section>
  );
}
