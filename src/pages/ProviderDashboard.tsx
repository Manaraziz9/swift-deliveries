import { useState, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, ClipboardList, Star,
  ArrowLeft, ArrowRight, Loader2, LogIn, TrendingUp,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// Mock provider data for MVP
const mockStats = {
  activeOrders: 3,
  completedToday: 7,
  pendingOrders: 2,
  rating: 4.8,
  totalEarnings: 1250,
};

const mockOrders = [
  { id: '1', status: 'pending', customerName: 'أحمد', description: 'توصيل طرد من حي النزهة', amount: 35, createdAt: new Date() },
  { id: '2', status: 'in_progress', customerName: 'سارة', description: 'شراء مستلزمات من جرير', amount: 85, createdAt: new Date() },
  { id: '3', status: 'in_progress', customerName: 'خالد', description: 'توصيل ملف للمكتب', amount: 25, createdAt: new Date() },
  { id: '4', status: 'completed', customerName: 'نورة', description: 'شراء ورد وتوصيل', amount: 120, createdAt: new Date(Date.now() - 3600000) },
];

export default function ProviderDashboard() {
  const { lang, dir } = useLang();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history'>('overview');

  if (loading) {
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

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-primary" />;
    return <AlertCircle className="h-4 w-4 text-warning" />;
  };

  const statusLabel = (status: string) => {
    if (lang === 'ar') {
      if (status === 'completed') return 'مكتمل';
      if (status === 'in_progress') return 'جاري التنفيذ';
      return 'بانتظار القبول';
    }
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    return 'Pending';
  };

  const filteredOrders = activeTab === 'active'
    ? mockOrders.filter(o => o.status !== 'completed')
    : activeTab === 'history'
    ? mockOrders.filter(o => o.status === 'completed')
    : mockOrders;

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

      <div className="container py-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'طلبات نشطة' : 'Active'}</span>
            </div>
            <p className="text-2xl font-bold">{mockStats.activeOrders}</p>
          </div>
          <div className="rounded-2xl bg-card border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'مكتمل اليوم' : 'Today'}</span>
            </div>
            <p className="text-2xl font-bold">{mockStats.completedToday}</p>
          </div>
          <div className="rounded-2xl bg-card border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'التقييم' : 'Rating'}</span>
            </div>
            <p className="text-2xl font-bold">{mockStats.rating}</p>
          </div>
          <div className="rounded-2xl bg-card border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'الأرباح' : 'Earnings'}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{mockStats.totalEarnings} <span className="text-xs">{lang === 'ar' ? 'ر.س' : 'SAR'}</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border bg-card overflow-hidden">
          {(['overview', 'active', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-all",
                activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang === 'ar'
                ? tab === 'overview' ? 'الكل' : tab === 'active' ? 'نشطة' : 'مكتمل'
                : tab === 'overview' ? 'All' : tab === 'active' ? 'Active' : 'History'}
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
            filteredOrders.map(order => (
              <div key={order.id} className="rounded-2xl bg-card border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{order.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.customerName}</p>
                  </div>
                  <span className="text-sm font-bold text-primary whitespace-nowrap">
                    {order.amount} {lang === 'ar' ? 'ر.س' : 'SAR'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {statusIcon(order.status)}
                    <span className="text-xs font-medium">{statusLabel(order.status)}</span>
                  </div>
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="px-4 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
                        {lang === 'ar' ? 'رفض' : 'Decline'}
                      </button>
                      <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-95 transition-all">
                        {lang === 'ar' ? 'قبول' : 'Accept'}
                      </button>
                    </div>
                  )}
                  {order.status === 'in_progress' && (
                    <button className="px-4 py-1.5 rounded-lg bg-success text-success-foreground text-xs font-bold hover:brightness-95 transition-all">
                      {lang === 'ar' ? 'تم التسليم' : 'Mark Done'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
