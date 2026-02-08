import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Loader2, Package, MapPin, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MerchantContext {
  merchant: { id: string };
}

interface Order {
  id: string;
  status: string;
  order_type: string;
  created_at: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  dropoff_address: string | null;
  notes: string | null;
  order_items: {
    id: string;
    free_text_description: string | null;
    quantity: number | null;
    unit: string | null;
  }[];
}

const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
  draft: { ar: 'مسودة', en: 'Draft', color: 'bg-muted text-muted-foreground' },
  payment_pending: { ar: 'بانتظار الدفع', en: 'Payment Pending', color: 'bg-primary/20 text-primary' },
  paid: { ar: 'مدفوع', en: 'Paid', color: 'bg-primary/20 text-primary' },
  in_progress: { ar: 'قيد التنفيذ', en: 'In Progress', color: 'bg-emerald/20 text-emerald' },
  completed: { ar: 'مكتمل', en: 'Completed', color: 'bg-emerald text-white' },
  canceled: { ar: 'ملغي', en: 'Canceled', color: 'bg-destructive/20 text-destructive' },
};

const orderTypeLabels: Record<string, { ar: string; en: string }> = {
  DIRECT: { ar: 'توصيل مباشر', en: 'Direct Delivery' },
  PURCHASE_DELIVER: { ar: 'شراء وتوصيل', en: 'Purchase & Deliver' },
  CHAIN: { ar: 'سلسلة مهام', en: 'Chain Tasks' },
};

export default function MerchantOrders() {
  const { merchant } = useOutletContext<MerchantContext>();
  const { lang } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [merchant]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('source_merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const statusFilters = [
    { value: 'all', labelAr: 'الكل', labelEn: 'All' },
    { value: 'draft', labelAr: 'مسودة', labelEn: 'Draft' },
    { value: 'paid', labelAr: 'مدفوع', labelEn: 'Paid' },
    { value: 'in_progress', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
    { value: 'completed', labelAr: 'مكتمل', labelEn: 'Completed' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          {lang === 'ar' ? 'الطلبات الواردة' : 'Incoming Orders'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'ar' ? 'إدارة طلبات العملاء' : 'Manage customer orders'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {lang === 'ar' ? f.labelAr : f.labelEn}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {lang === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const status = statusLabels[order.status] || statusLabels.draft;
            const orderType = orderTypeLabels[order.order_type] || orderTypeLabels.DIRECT;

            return (
              <div
                key={order.id}
                className="bg-card rounded-xl shadow-card overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-bold">
                      #{order.id.slice(0, 8)}
                    </p>
                    <span className={cn('text-xs px-2 py-1 rounded-full', status.color)}>
                      {lang === 'ar' ? status.ar : status.en}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded-full">
                      {lang === 'ar' ? orderType.ar : orderType.en}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 border-b border-border/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {lang === 'ar' ? 'المنتجات' : 'Items'}
                  </p>
                  <div className="space-y-1">
                    {order.order_items.map(item => (
                      <div key={item.id} className="text-sm">
                        • {item.free_text_description || '-'}
                        {item.quantity && item.unit && (
                          <span className="text-muted-foreground">
                            {' '}({item.quantity} {item.unit})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipient Info */}
                <div className="p-4">
                  <div className="space-y-2">
                    {order.recipient_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {order.recipient_name}
                      </div>
                    )}
                    {order.recipient_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span dir="ltr">{order.recipient_phone}</span>
                      </div>
                    )}
                    {order.dropoff_address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{order.dropoff_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
