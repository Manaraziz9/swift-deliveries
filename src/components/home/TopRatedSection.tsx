import { useLang } from '@/contexts/LangContext';
import { useMerchants, useQualityScores } from '@/hooks/useMerchants';
import MerchantCard from '@/components/shared/MerchantCard';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TopRatedSection() {
  const { t } = useLang();
  const { data: merchants } = useMerchants();
  const merchantIds = (merchants || []).map(m => m.id);
  const { data: qualities } = useQualityScores(merchantIds);

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
    <section className="container py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('topRated')}</h3>
        <Link to="/search" className="text-xs font-medium text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    </section>
  );
}
