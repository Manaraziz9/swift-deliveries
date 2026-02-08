import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, MapPin, ClipboardList, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MerchantContext {
  merchant: {
    id: string;
    business_name: string;
  };
}

interface Stats {
  catalogCount: number;
  branchCount: number;
  orderCount: number;
  avgRating: number;
}

export default function MerchantOverview() {
  const { merchant } = useOutletContext<MerchantContext>();
  const { lang } = useLang();
  const [stats, setStats] = useState<Stats>({
    catalogCount: 0,
    branchCount: 0,
    orderCount: 0,
    avgRating: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (merchant) {
      fetchStats();
      fetchRecentOrders();
    }
  }, [merchant]);

  const fetchStats = async () => {
    const [catalog, branches, orders, ratings] = await Promise.all([
      supabase.from('catalog_items').select('id', { count: 'exact' }).eq('merchant_id', merchant.id),
      supabase.from('merchant_branches').select('id', { count: 'exact' }).eq('merchant_id', merchant.id),
      supabase.from('orders').select('id', { count: 'exact' }).eq('source_merchant_id', merchant.id),
      supabase.from('quality_scores').select('composite_score').eq('entity_id', merchant.id).single(),
    ]);

    setStats({
      catalogCount: catalog.count || 0,
      branchCount: branches.count || 0,
      orderCount: orders.count || 0,
      avgRating: ratings.data?.composite_score || 0,
    });
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, created_at, recipient_name')
      .eq('source_merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentOrders(data || []);
  };

  const statCards = [
    {
      icon: Package,
      labelAr: 'منتجات/خدمات',
      labelEn: 'Products/Services',
      value: stats.catalogCount,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: MapPin,
      labelAr: 'الفروع',
      labelEn: 'Branches',
      value: stats.branchCount,
      color: 'text-emerald',
      bg: 'bg-emerald/10',
    },
    {
      icon: ClipboardList,
      labelAr: 'الطلبات',
      labelEn: 'Orders',
      value: stats.orderCount,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      icon: Star,
      labelAr: 'التقييم',
      labelEn: 'Rating',
      value: stats.avgRating.toFixed(1),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
    draft: { ar: 'مسودة', en: 'Draft', color: 'bg-muted text-muted-foreground' },
    payment_pending: { ar: 'بانتظار الدفع', en: 'Payment Pending', color: 'bg-primary/20 text-primary' },
    paid: { ar: 'مدفوع', en: 'Paid', color: 'bg-primary/20 text-primary' },
    in_progress: { ar: 'قيد التنفيذ', en: 'In Progress', color: 'bg-emerald/20 text-emerald' },
    completed: { ar: 'مكتمل', en: 'Completed', color: 'bg-emerald text-white' },
    canceled: { ar: 'ملغي', en: 'Canceled', color: 'bg-destructive/20 text-destructive' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'ar' ? 'نظرة عامة على نشاطك' : 'Overview of your activity'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-card rounded-xl shadow-card p-4 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                <Icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ar' ? stat.labelAr : stat.labelEn}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl shadow-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-bold">
            {lang === 'ar' ? 'أحدث الطلبات' : 'Recent Orders'}
          </h2>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {lang === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => {
              const status = statusLabels[order.status] || statusLabels.draft;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.recipient_name || (lang === 'ar' ? 'بدون اسم' : 'No name')}
                    </p>
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded-full', status.color)}>
                    {lang === 'ar' ? status.ar : status.en}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
