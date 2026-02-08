import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { ListOrdered } from 'lucide-react';

export default function OrdersPage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen pb-20">
      <TopBar />
      <div className="container py-12 text-center">
        <ListOrdered className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-lg font-bold mb-2">{t('orders')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('loginSignup')}
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
