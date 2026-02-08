import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMerchants(domainFilter?: string) {
  return useQuery({
    queryKey: ['merchants', domainFilter],
    queryFn: async () => {
      let query = supabase.from('merchants').select('*');
      if (domainFilter) {
        query = query.eq('domain_id', domainFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMerchant(id?: string) {
  return useQuery({
    queryKey: ['merchant', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('merchants').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useBranches(merchantId?: string) {
  return useQuery({
    queryKey: ['branches', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase.from('merchant_branches').select('*').eq('merchant_id', merchantId);
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });
}

export function useCatalogItems(merchantId?: string) {
  return useQuery({
    queryKey: ['catalog', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase.from('catalog_items').select('*').eq('merchant_id', merchantId).eq('active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });
}

export function useQualityScores(merchantIds: string[]) {
  return useQuery({
    queryKey: ['quality_scores', merchantIds],
    queryFn: async () => {
      if (!merchantIds.length) return [];
      const { data, error } = await supabase
        .from('quality_scores')
        .select('*')
        .eq('entity_type', 'merchant')
        .in('entity_id', merchantIds);
      if (error) throw error;
      return data;
    },
    enabled: merchantIds.length > 0,
  });
}

export function useQualityScore(merchantId?: string) {
  return useQuery({
    queryKey: ['quality_score', merchantId],
    queryFn: async () => {
      if (!merchantId) return null;
      const { data, error } = await supabase
        .from('quality_scores')
        .select('*')
        .eq('entity_type', 'merchant')
        .eq('entity_id', merchantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });
}
