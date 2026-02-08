import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen pb-20">
      <TopBar />
      <div className="container py-12 text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-lg font-bold mb-2">{t('profile')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('loginSignup')}
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
