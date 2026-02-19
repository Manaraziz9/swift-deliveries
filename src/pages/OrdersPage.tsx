import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FadeIn, staggerContainer, staggerItem } from '@/components/motion/MotionWrappers';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ListOrdered, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/lib/orderConstants';

interface Order {
  id: string;
  order_type: string;
  status: string;
  created_at: string;
  notes: string | null;
}

export default function OrdersPage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setOrders(data as Order[]);
          }
          setLoading(false);
        });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const statusLabels = ORDER_STATUS_LABELS;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-20">
        <TopBar />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-20">
        <TopBar />
        <div className="container py-12 text-center">
          <ListOrdered className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-lg font-bold mb-2">{t('orders')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === 'ar' ? 'سجّل دخولك لعرض طلباتك' : 'Sign in to view your orders'}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-ya-accent"
          >
            {t('loginSignup')}
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <TopBar />
      
      <div className="container py-6">
        <FadeIn>
          <h2 className="text-lg font-bold mb-4">{t('orders')}</h2>
        </FadeIn>
        
        {orders.length === 0 ? (
          <FadeIn delay={0.1} className="text-center py-12">
            <ListOrdered className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' ? 'ما عندك طلبات حالياً' : 'No orders yet'}
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-ya-accent mt-4"
            >
              {lang === 'ar' ? 'اطلب الآن' : 'Order Now'}
            </Link>
          </FadeIn>
        ) : (
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {orders.map(order => {
              const status = statusLabels[order.status] || statusLabels.draft;
              const StatusIcon = status.icon;
              return (
                <motion.div key={order.id} variants={staggerItem}>
                  <Link to={`/orders/${order.id}`} className="block rounded-xl bg-card shadow-ya-sm p-4 hover:shadow-ya-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm">
                          {lang === 'ar' ? 'طلب' : 'Order'} #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                        {order.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{order.notes}</p>
                        )}
                      </div>
                      <span className={cn("flex items-center gap-1 text-xs font-medium", status.color)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {lang === 'ar' ? status.ar : status.en}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
