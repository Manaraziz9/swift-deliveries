import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import MyLocationsSection from '@/components/location/MyLocationsSection';
import ReferralSection from '@/components/referral/ReferralSection';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, LogOut, Settings, Phone, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  language: string | null;
}

export default function ProfilePage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data as Profile);
          }
          setLoading(false);
        });
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج' : 'Signed out');
    navigate('/');
  };

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

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20">
      <TopBar />

      {/* Profile Header */}
      <div className="bg-foreground px-4 py-8 relative overflow-hidden">
        <div className="container relative flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-card flex items-center justify-center shadow-lg">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-background">
              {profile?.name || user.email?.split('@')[0]}
            </h2>
            <p className="text-background/50 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Info Cards */}
        <div className="space-y-3">
          <div className="rounded-xl bg-card shadow-ya-sm p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
              <p className="font-medium text-sm">{user.email}</p>
            </div>
          </div>

          {profile?.phone && (
            <div className="rounded-xl bg-card shadow-ya-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الهاتف' : 'Phone'}</p>
                <p className="font-medium text-sm">{profile.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* My Locations */}
        <MyLocationsSection />

        {/* Referral */}
        <ReferralSection />

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-full rounded-xl bg-card shadow-ya-sm p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full rounded-xl bg-destructive/10 p-4 flex items-center gap-3 hover:bg-destructive/20 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <span className="font-medium text-sm text-destructive">
              {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
