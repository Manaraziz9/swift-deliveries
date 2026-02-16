import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PackageCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AwaitingOrder {
  id: string;
  notes: string | null;
  created_at: string;
  source_merchant_id: string | null;
  merchants: { business_name: string; business_name_ar: string | null } | null;
}

export default function AwaitingPickupStrip() {
  const { lang, dir } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const Arrow = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const { data: awaitingOrders } = useQuery({
    queryKey: ['awaiting-pickup', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, notes, created_at, source_merchant_id, merchants!orders_source_merchant_id_fkey(business_name, business_name_ar)')
        .eq('customer_id', user!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as AwaitingOrder[];
    },
  });

  if (!awaitingOrders || awaitingOrders.length === 0 || !user) return null;

  return (
    <div className="container px-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/30 bg-primary/5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <PackageCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-primary">
            {lang === 'ar' ? 'بانتظار الاستلام' : 'Awaiting Pickup'}
          </h3>
          <span className="ms-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {awaitingOrders.length}
          </span>
        </div>

        {/* Orders list */}
        <div className="px-3 pb-3 space-y-2 mt-2">
          <AnimatePresence>
            {awaitingOrders.map((order, i) => {
              const merchantName = lang === 'ar'
                ? order.merchants?.business_name_ar || order.merchants?.business_name
                : order.merchants?.business_name;
              const label = merchantName || order.notes?.slice(0, 30) || (lang === 'ar' ? 'طلب' : 'Order');
              const daysAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000);

              return (
                <motion.button
                  key={order.id}
                  initial={{ opacity: 0, x: dir === 'rtl' ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-ya-sm transition-all"
                >
                  <div className="flex-1 text-start min-w-0">
                    <p className="text-sm font-bold truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {daysAgo === 0
                        ? (lang === 'ar' ? 'اليوم' : 'Today')
                        : `${daysAgo} ${lang === 'ar' ? 'يوم' : daysAgo === 1 ? 'day' : 'days'} ${lang === 'ar' ? 'مضت' : 'ago'}`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}`);
                    }}
                    className="shrink-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:brightness-95 transition-all"
                  >
                    {lang === 'ar' ? 'استلم الآن' : 'Pickup Now'}
                    <Arrow className="h-3 w-3" />
                  </button>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
