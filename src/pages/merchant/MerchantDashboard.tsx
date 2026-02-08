import { useEffect, useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  LayoutDashboard,
  Package,
  MapPin,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MerchantData {
  id: string;
  business_name: string;
  business_name_ar: string | null;
  logo_url: string | null;
}

const navItems = [
  { path: '/merchant', icon: LayoutDashboard, labelAr: 'لوحة التحكم', labelEn: 'Dashboard' },
  { path: '/merchant/catalog', icon: Package, labelAr: 'الكتالوج', labelEn: 'Catalog' },
  { path: '/merchant/branches', icon: MapPin, labelAr: 'الفروع', labelEn: 'Branches' },
  { path: '/merchant/orders', icon: ClipboardList, labelAr: 'الطلبات', labelEn: 'Orders' },
];

export default function MerchantDashboard() {
  const { lang } = useLang();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMerchant();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading]);

  const fetchMerchant = async () => {
    const { data, error } = await supabase
      .from('merchants')
      .select('id, business_name, business_name_ar, logo_url')
      .eq('owner_user_id', user!.id)
      .single();

    if (error || !data) {
      // User is not a merchant
      navigate('/');
    } else {
      setMerchant(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  const merchantName = lang === 'ar' && merchant.business_name_ar
    ? merchant.business_name_ar
    : merchant.business_name;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 z-40 w-64 bg-card border-e border-border/30 transition-transform duration-300 lg:translate-x-0 lg:static',
          lang === 'ar' ? 'right-0' : 'left-0',
          sidebarOpen
            ? 'translate-x-0'
            : lang === 'ar'
            ? 'translate-x-full'
            : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            {merchant.logo_url ? (
              <img
                src={merchant.logo_url}
                alt={merchantName}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{merchantName}</p>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'بوابة المحلات' : 'Merchant Portal'}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-border/30">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <BackIcon className="h-4 w-4" />
            {lang === 'ar' ? 'العودة للموقع' : 'Back to Site'}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:text-destructive/80 w-full"
          >
            <LogOut className="h-4 w-4" />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-card border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-bold">{merchantName}</p>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet context={{ merchant }} />
        </main>
      </div>
    </div>
  );
}
