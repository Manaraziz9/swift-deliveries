import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import RatingModal from '@/components/rating/RatingModal';
import OrderProgressBar from '@/components/order/OrderProgressBar';
import OrderChat from '@/components/chat/OrderChat';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  CheckCircle,
  Circle,
  MapPin,
  Package,
  Truck,
  Star,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import 'leaflet/dist/leaflet.css';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Stage {
  id: string;
  stage_type: string;
  sequence_no: number;
  status: string;
  lat: number | null;
  lng: number | null;
  address_text: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface OrderData {
  id: string;
  order_type: string;
  status: string;
  created_at: string;
  source_merchant_id: string | null;
  recipient_name: string | null;
  dropoff_address: string | null;
  pickup_address: string | null;
  notes: string | null;
  order_stages: Stage[];
}

const stageIcons: Record<string, any> = {
  purchase: Package,
  pickup: Package,
  dropoff: MapPin,
  handover: Truck,
  onsite: MapPin,
};

const stageLabels: Record<string, { ar: string; en: string }> = {
  purchase: { ar: 'الشراء', en: 'Purchase' },
  pickup: { ar: 'الاستلام', en: 'Pickup' },
  dropoff: { ar: 'التوصيل', en: 'Delivery' },
  handover: { ar: 'التسليم', en: 'Handover' },
  onsite: { ar: 'في الموقع', en: 'On-site' },
};

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  accepted: 'bg-primary/20 text-primary',
  in_progress: 'bg-emerald/20 text-emerald',
  completed: 'bg-emerald text-white',
  failed: 'bg-destructive/20 text-destructive',
};

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<{ id: string; business_name: string } | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<'merchant' | 'executor'>('merchant');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && id) {
      fetchOrder();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, id]);

  // Realtime stage updates
  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase
      .channel(`order-stages-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_stages',
        filter: `order_id=eq.${id}`,
      }, () => {
        fetchOrder();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_stages(*)')
      .eq('id', id)
      .single();

    if (!error && data) {
      const sortedStages = (data.order_stages || []).sort(
        (a: Stage, b: Stage) => a.sequence_no - b.sequence_no
      );
      setOrder({ ...data, order_stages: sortedStages } as OrderData);

      if (data.source_merchant_id) {
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('id, business_name')
          .eq('id', data.source_merchant_id)
          .single();
        if (merchantData) setMerchant(merchantData);
      }
    }
    setLoading(false);
  };

  const mapCenter: [number, number] = order?.order_stages?.[0]?.lat && order?.order_stages?.[0]?.lng
    ? [order.order_stages[0].lat, order.order_stages[0].lng]
    : [24.7136, 46.6753];

  const polylinePositions = order?.order_stages
    ?.filter(s => s.lat && s.lng)
    .map(s => [s.lat!, s.lng!] as [number, number]) || [];

  const isCompleted = order?.status === 'completed';
  const isActive = order?.status === 'in_progress' || order?.status === 'paid';
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

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

  if (!order) {
    return (
      <div className="min-h-screen pb-20">
        <TopBar />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">
            {lang === 'ar' ? 'الطلب غير موجود' : 'Order not found'}
          </p>
          <Link to="/orders" className="text-primary underline mt-4 inline-block">
            {lang === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <TopBar />

      <div className="container py-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <BackIcon className="h-4 w-4" />
          {lang === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}
        </Link>

        {/* Order header card */}
        <div className="bg-card rounded-xl shadow-ya-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">
              {lang === 'ar' ? 'طلب' : 'Order'} #{order.id.slice(0, 8)}
            </h2>
            <span className={cn('text-xs px-2 py-1 rounded-full', statusColors[order.status])}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {order.recipient_name && (
            <p className="text-sm mt-2">
              <span className="text-muted-foreground">{lang === 'ar' ? 'المستلم:' : 'Recipient:'}</span>{' '}
              {order.recipient_name}
            </p>
          )}
        </div>

        {/* Horizontal Progress Bar */}
        {order.order_stages.length > 0 && (
          <OrderProgressBar stages={order.order_stages} />
        )}

        {/* Map */}
        {polylinePositions.length > 0 && (
          <div className="rounded-xl overflow-hidden shadow-ya-sm mb-4 h-[200px]">
            <MapContainer
              center={mapCenter}
              zoom={12}
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {order.order_stages.filter(s => s.lat && s.lng).map((stage) => (
                <Marker key={stage.id} position={[stage.lat!, stage.lng!]} />
              ))}
              {polylinePositions.length > 1 && (
                <Polyline
                  positions={polylinePositions}
                  color="hsl(var(--primary))"
                  weight={3}
                  dashArray="8, 8"
                />
              )}
            </MapContainer>
          </div>
        )}

        {/* Vertical Timeline */}
        <div className="bg-card rounded-xl shadow-ya-sm p-4 mb-4">
          <h3 className="font-bold mb-4">
            {lang === 'ar' ? 'مراحل الطلب' : 'Order Stages'}
          </h3>
          <div className="space-y-4">
            {order.order_stages.map((stage, idx) => {
              const StageIcon = stageIcons[stage.stage_type] || Circle;
              const isStageActive = stage.status === 'in_progress';
              const isDone = stage.status === 'completed';
              const label = stageLabels[stage.stage_type] || { ar: stage.stage_type, en: stage.stage_type };

              return (
                <div key={stage.id} className="flex gap-3 relative">
                  {idx < order.order_stages.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-8 w-0.5 h-[calc(100%+8px)]',
                        isDone ? 'bg-primary' : 'bg-border'
                      )}
                      style={{ left: lang === 'ar' ? 'auto' : '15px', right: lang === 'ar' ? '15px' : 'auto' }}
                    />
                  )}
                  <div className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    isDone ? 'bg-primary text-primary-foreground'
                      : isStageActive ? 'bg-primary text-primary-foreground animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : <StageIcon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-sm">{lang === 'ar' ? label.ar : label.en}</p>
                    {stage.address_text && (
                      <p className="text-xs text-muted-foreground mt-0.5">{stage.address_text}</p>
                    )}
                    {stage.completed_at && (
                      <p className="text-xs text-primary mt-1">
                        ✓ {new Date(stage.completed_at).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat button for active orders */}
        {(isActive || isCompleted) && (
          <button
            onClick={() => setChatOpen(true)}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-primary/30 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            {lang === 'ar' ? 'محادثة المندوب' : 'Chat with Provider'}
          </button>
        )}

        {/* Rating buttons for completed orders */}
        {isCompleted && (
          <div className="bg-card rounded-xl shadow-ya-sm p-4">
            <h3 className="font-bold mb-3">
              {lang === 'ar' ? 'قيّم تجربتك' : 'Rate Your Experience'}
            </h3>
            <div className="flex flex-col gap-2">
              {merchant && (
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => { setRatingTarget('merchant'); setShowRating(true); }}
                >
                  <Star className="h-4 w-4 text-primary" />
                  {lang === 'ar' ? `قيّم ${merchant.business_name}` : `Rate ${merchant.business_name}`}
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => { setRatingTarget('executor'); setShowRating(true); }}
              >
                <Star className="h-4 w-4 text-primary" />
                {lang === 'ar' ? 'قيّم المنفذ' : 'Rate Executor'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat overlay */}
      <OrderChat orderId={order.id} isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Rating Modal */}
      {showRating && (
        <RatingModal
          isOpen={showRating}
          onClose={() => setShowRating(false)}
          orderId={order.id}
          entityId={ratingTarget === 'merchant' && merchant ? merchant.id : order.id}
          entityType={ratingTarget}
          entityName={
            ratingTarget === 'merchant' && merchant
              ? merchant.business_name
              : lang === 'ar' ? 'المنفذ' : 'Executor'
          }
        />
      )}

      <BottomNav />
    </div>
  );
}
