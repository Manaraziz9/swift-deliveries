import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useQualityScore(entityId: string | undefined, entityType: 'merchant' | 'executor' = 'merchant') {
  return useQuery({
    queryKey: ['quality_score', entityId, entityType],
    queryFn: async () => {
      if (!entityId) return null;
      const { data, error } = await supabase
        .from('quality_scores')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });
}

export function useQualityScores(entityIds: string[], entityType: 'merchant' | 'executor' = 'merchant') {
  return useQuery({
    queryKey: ['quality_scores', entityIds, entityType],
    queryFn: async () => {
      if (entityIds.length === 0) return [];
      const { data, error } = await supabase
        .from('quality_scores')
        .select('*')
        .in('entity_id', entityIds)
        .eq('entity_type', entityType);
      if (error) throw error;
      return data || [];
    },
    enabled: entityIds.length > 0,
  });
}

export function useMerchantQualityScores(merchantIds: string[]) {
  return useQualityScores(merchantIds, 'merchant');
}
