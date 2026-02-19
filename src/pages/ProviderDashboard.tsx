import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderOrders, useUpdateStageStatus, useAcceptRejectOrder } from '@/hooks/useProviderOrders';
import OrderChat from '@/components/chat/OrderChat';
import EscrowStatusCard from '@/components/order/EscrowStatusCard';
import ProviderRouteMap from '@/components/map/ProviderRouteMap';
import {
  Package, ClipboardList, Star, ArrowLeft, ArrowRight,
  Loader2, LogIn, TrendingUp, CheckCircle, Clock,
  AlertCircle, MessageCircle, Play, ChevronDown, ChevronUp,
  ThumbsUp, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { STAGE_LABELS } from '@/lib/orderConstants';
const stageLabels = STAGE_LABELS;

export default function ProviderDashboard() {
  const { lang, dir } = useLang();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const { data: orders = [], isLoading } = useProviderOrders();
  const updateStage = useUpdateStageStatus();
  const acceptReject = useAcceptRejectOrder();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <LogIn className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">{lang === 'ar' ? 'سجّل دخولك' : 'Sign In Required'}</h2>
        <Link to="/auth" className="btn-ya mt-4">{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</Link>
      </div>
    );
  }

  const filteredOrders = activeTab === 'active'
    ? orders.filter((o: any) => o.status !== 'completed' && o.status !== 'canceled')
    : activeTab === 'completed'
    ? orders.filter((o: any) => o.status === 'completed')
    : orders;

  const activeCount = orders.filter((o: any) => o.status !== 'completed' && o.status !== 'canceled').length;
  const completedCount = orders.filter((o: any) => o.status === 'completed').length;

  const handleStageAction = (stageId: string, newStatus: string) => {
    updateStage.mutate({ stageId, status: newStatus }, {
      onSuccess: () => {
        toast.success(lang === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
      },
      onError: () => {
        toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error updating status');
      },
    });
  };

  const handleOrderDecision = (orderId: string, accept: boolean) => {
    acceptReject.mutate({ orderId, accept }, {
      onSuccess: () => {
        toast.success(
          accept
            ? (lang === 'ar' ? 'تم قبول الطلب ✅' : 'Order accepted ✅')
            : (lang === 'ar' ? 'تم رفض الطلب' : 'Order rejected')
        );
      },
      onError: () => {
        toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error processing decision');
      },
    });
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-emerald" />;
    if (status === 'in_progress' || status === 'paid') return <Clock className="h-4 w-4 text-primary" />;
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  };

  const statusLabel = (status: string) => {
    if (lang === 'ar') {
      if (status === 'completed') return 'مكتمل';
      if (status === 'in_progress') return 'جاري التنفيذ';
      if (status === 'paid') return 'مدفوع';
      if (status === 'canceled') return 'ملغي';
      return 'بانتظار';
    }
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'paid') return 'Paid';
    if (status === 'canceled') return 'Canceled';
    return 'Pending';
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold">{lang === 'ar' ? 'لوحة تحكم المزوّد' : 'Provider Dashboard'}</h1>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'إدارة طلباتك وأرباحك' : 'Manage orders & earnings'}</p>
          </div>
          <span className="text-lg font-bold font-en text-primary">YA</span>
        </div>
      </div>

      <div className="container py-4 space-y-4">
        {/* Stats */}
        {/* Stats with Earnings */}
        {(() => {
          const totalEarnings = orders
            .filter((o: any) => o.status === 'completed')
            .reduce((sum: number, o: any) => sum + (o.totals_json?.total || 0), 0);
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekStart = new Date(todayStart);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const todayEarnings = orders
            .filter((o: any) => o.status === 'completed' && new Date(o.created_at) >= todayStart)
            .reduce((sum: number, o: any) => sum + (o.totals_json?.total || 0), 0);
          const weekEarnings = orders
            .filter((o: any) => o.status === 'completed' && new Date(o.created_at) >= weekStart)
            .reduce((sum: number, o: any) => sum + (o.totals_json?.total || 0), 0);

          return (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-card border p-3 text-center">
                  <ClipboardList className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'نشطة' : 'Active'}</p>
                  <p className="text-xl font-bold">{activeCount}</p>
                </div>
                <div className="rounded-2xl bg-card border p-3 text-center">
                  <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald" />
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مكتمل' : 'Done'}</p>
                  <p className="text-xl font-bold">{completedCount}</p>
                </div>
                <div className="rounded-2xl bg-card border p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الإجمالي' : 'Total'}</p>
                  <p className="text-xl font-bold">{orders.length}</p>
                </div>
              </div>

              {/* Earnings Strip */}
              <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4">
                <p className="text-xs font-bold text-primary mb-3">{lang === 'ar' ? '💰 الأرباح' : '💰 Earnings'}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'اليوم' : 'Today'}</p>
                    <p className="text-lg font-bold text-foreground">{todayEarnings.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'ر.س' : 'SAR'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'الأسبوع' : 'Week'}</p>
                    <p className="text-lg font-bold text-foreground">{weekEarnings.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'ر.س' : 'SAR'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'الإجمالي' : 'Total'}</p>
                    <p className="text-lg font-bold text-foreground">{totalEarnings.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'ر.س' : 'SAR'}</p>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Tabs */}
        <div className="flex rounded-xl border bg-card overflow-hidden">
          {(['all', 'active', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-all",
                activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang === 'ar'
                ? tab === 'all' ? 'الكل' : tab === 'active' ? 'نشطة' : 'مكتمل'
                : tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{lang === 'ar' ? 'لا توجد طلبات' : 'No orders'}</p>
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const isExpanded = expandedOrder === order.id;
              const stages = (order.order_stages || []).sort((a: any, b: any) => a.sequence_no - b.sequence_no);

              return (
                <motion.div
                  key={order.id}
                  layout
                  className="rounded-2xl bg-card border overflow-hidden"
                >
                  {/* Order header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-4 text-start"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcon(order.status)}
                          <span className="text-xs font-medium">{statusLabel(order.status)}</span>
                        </div>
                        <p className="font-bold text-sm truncate">
                          #{order.id.slice(0, 8)} — {order.order_type}
                        </p>
                        {order.pickup_address && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.pickup_address}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {order.totals_json?.total && (
                          <span className="text-sm font-bold text-primary whitespace-nowrap">
                            {Number(order.totals_json.total).toFixed(0)} {lang === 'ar' ? 'ر.س' : 'SAR'}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>

                  {/* Accept/Reject strip for new orders */}
                  {(order.status === 'paid' || order.status === 'payment_pending') && (
                    <div className="px-4 pb-3 flex gap-2">
                      <button
                        onClick={() => handleOrderDecision(order.id, true)}
                        disabled={acceptReject.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-95 transition-all disabled:opacity-50"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {lang === 'ar' ? 'قبول الطلب' : 'Accept Order'}
                      </button>
                      <button
                        onClick={() => handleOrderDecision(order.id, false)}
                        disabled={acceptReject.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:brightness-95 transition-all disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        {lang === 'ar' ? 'رفض الطلب' : 'Reject Order'}
                      </button>
                    </div>
                  )}

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t pt-4">
                          {/* Order details */}
                          {order.notes && (
                            <div className="bg-muted/50 rounded-xl p-3">
                              <p className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                              <p className="text-sm">{order.notes}</p>
                            </div>
                          )}

                          {/* Items */}
                          {order.order_items?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-2">
                                {lang === 'ar' ? 'العناصر' : 'Items'} ({order.order_items.length})
                              </p>
                              <div className="space-y-1.5">
                                {order.order_items.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="flex-1 truncate">{item.free_text_description || 'Item'}</span>
                                    {item.quantity > 1 && <span className="text-xs text-muted-foreground">x{item.quantity}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Stages with action buttons */}
                          <div>
                            <p className="text-xs font-bold text-muted-foreground mb-2">
                              {lang === 'ar' ? 'المراحل' : 'Stages'}
                            </p>
                            <div className="space-y-2">
                              {stages.map((stage: any) => {
                                const label = stageLabels[stage.stage_type] || { ar: stage.stage_type, en: stage.stage_type };
                                const isDone = stage.status === 'completed';
                                const isActive = stage.status === 'in_progress';
                                const isPending = stage.status === 'pending' || stage.status === 'accepted';

                                return (
                                  <div key={stage.id} className={cn(
                                    'rounded-xl border p-3 transition-colors',
                                    isActive && 'border-primary/50 bg-primary/5',
                                    isDone && 'border-emerald/30 bg-emerald/5',
                                  )}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                                          isDone ? 'bg-emerald text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        )}>
                                          {stage.sequence_no}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{lang === 'ar' ? label.ar : label.en}</p>
                                          {stage.address_text && (
                                            <p className="text-[10px] text-muted-foreground">{stage.address_text}</p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action buttons */}
                                      {isPending && (
                                        <button
                                          onClick={() => handleStageAction(stage.id, 'in_progress')}
                                          disabled={updateStage.isPending}
                                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-95 transition-all disabled:opacity-50"
                                        >
                                          <Play className="h-3 w-3" />
                                          {lang === 'ar' ? 'بدء' : 'Start'}
                                        </button>
                                      )}
                                      {isActive && (
                                        <button
                                          onClick={() => handleStageAction(stage.id, 'completed')}
                                          disabled={updateStage.isPending}
                                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald text-white text-xs font-bold hover:brightness-95 transition-all disabled:opacity-50"
                                        >
                                          <CheckCircle className="h-3 w-3" />
                                          {lang === 'ar' ? 'إتمام' : 'Done'}
                                        </button>
                                      )}
                                      {isDone && (
                                        <CheckCircle className="h-4 w-4 text-emerald" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Route Map */}
                          <div>
                            <p className="text-xs font-bold text-muted-foreground mb-2">
                              {lang === 'ar' ? 'خريطة المسار' : 'Route Map'}
                            </p>
                            <ProviderRouteMap
                              stages={stages}
                              pickupLat={order.pickup_lat}
                              pickupLng={order.pickup_lng}
                              dropoffLat={order.dropoff_lat}
                              dropoffLng={order.dropoff_lng}
                            />
                          </div>

                          {/* Escrow card */}
                          <EscrowStatusCard orderId={order.id} stages={stages} />

                          {/* Chat button */}
                          <button
                            onClick={() => setChatOrderId(order.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-all"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {lang === 'ar' ? 'محادثة العميل' : 'Chat with Customer'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat overlay */}
      {chatOrderId && (
        <OrderChat orderId={chatOrderId} isOpen={!!chatOrderId} onClose={() => setChatOrderId(null)} senderRole="executor" />
      )}
    </div>
  );
}
