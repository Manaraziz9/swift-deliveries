import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function LastOrderStrip() {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: lastOrder } = useQuery({
    queryKey: ['last-order', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, notes, source_merchant_id, created_at, status, merchants!orders_source_merchant_id_fkey(business_name, business_name_ar)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!lastOrder || !user) return null;

  const merchantName = lang === 'ar'
    ? (lastOrder.merchants as any)?.business_name_ar || (lastOrder.merchants as any)?.business_name
    : (lastOrder.merchants as any)?.business_name;

  return (
    <div className="container px-4">
      <button
        onClick={() => navigate(`/create-order?merchant=${lastOrder.source_merchant_id || ''}`)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-ya-sm transition-all"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <RotateCcw className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-start min-w-0">
          <p className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'تبغى تكرر آخر طلب؟' : 'Repeat last order?'}
          </p>
          <p className="text-sm font-medium truncate">
            {merchantName || lastOrder.notes?.slice(0, 30) || (lang === 'ar' ? 'طلب سابق' : 'Previous order')}
          </p>
        </div>
        <span className="shrink-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
          {lang === 'ar' ? 'اطلبه مرة ثانية' : 'Reorder'}
        </span>
      </button>
    </div>
  );
}
