import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SuggestedOrder {
  merchantId: string | null;
  merchantName: string;
  merchantNameAr: string;
  itemsSummary: string;
  itemsSummaryAr: string;
  orderCount: number;
  lastOrderedAt: string;
}

export function useSmartSuggestions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['smart-suggestions', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 min
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, source_merchant_id, notes, created_at, order_items(free_text_description), merchants!orders_source_merchant_id_fkey(business_name, business_name_ar)')
        .eq('customer_id', user!.id)
        .in('status', ['completed', 'in_progress', 'paid'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data?.length) return [];

      // Group by merchant and count frequency
      const merchantMap = new Map<string, {
        merchantId: string;
        merchantName: string;
        merchantNameAr: string;
        items: string[];
        count: number;
        lastAt: string;
      }>();

      for (const order of data) {
        const mid = order.source_merchant_id || 'no-merchant';
        const merchant = order.merchants as any;
        const existing = merchantMap.get(mid);
        const itemDescs = (order.order_items || [])
          .map((i: any) => i.free_text_description)
          .filter(Boolean);

        if (existing) {
          existing.count++;
          existing.items.push(...itemDescs);
        } else {
          merchantMap.set(mid, {
            merchantId: order.source_merchant_id || '',
            merchantName: merchant?.business_name || order.notes?.slice(0, 30) || 'Order',
            merchantNameAr: merchant?.business_name_ar || merchant?.business_name || order.notes?.slice(0, 30) || 'طلب',
            items: itemDescs,
            count: 1,
            lastAt: order.created_at,
          });
        }
      }

      // Sort by frequency, take top 5
      const sorted = [...merchantMap.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return sorted.map((s): SuggestedOrder => {
        const uniqueItems = [...new Set(s.items)].slice(0, 3);
        return {
          merchantId: s.merchantId,
          merchantName: s.merchantName,
          merchantNameAr: s.merchantNameAr,
          itemsSummary: uniqueItems.join(', ') || 'Previous order',
          itemsSummaryAr: uniqueItems.join('، ') || 'طلب سابق',
          orderCount: s.count,
          lastOrderedAt: s.lastAt,
        };
      });
    },
  });
}
