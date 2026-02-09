import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, Moon, Sun, Bell, BellOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import BottomNav from '@/components/layout/BottomNav';

export default function SettingsPage() {
  const { lang, setLang, dir } = useLang();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const ArrowBack = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } else {
      setNotificationsEnabled(false);
    }
  };

  const themeOptions = [
    { value: 'light' as const, labelAr: 'فاتح', labelEn: 'Light', icon: Sun },
    { value: 'dark' as const, labelAr: 'داكن', labelEn: 'Dark', icon: Moon },
    { value: 'system' as const, labelAr: 'تلقائي', labelEn: 'System', icon: null },
  ];

  const languageOptions = [
    { value: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
    { value: 'en' as const, label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-ya-sm hover:bg-muted transition-colors"
            >
              <ArrowBack className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">
              {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Theme Section */}
        <section className="bg-card rounded-ya-lg p-5 border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {lang === 'ar' ? 'المظهر' : 'Appearance'}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, labelAr, labelEn, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-ya-md border transition-all",
                  theme === value
                    ? "border-ya-accent bg-ya-accent/10"
                    : "border-border hover:border-ya-accent/50"
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                {!Icon && <span className="text-lg">🔄</span>}
                <span className="text-sm font-medium">
                  {lang === 'ar' ? labelAr : labelEn}
                </span>
                {theme === value && (
                  <Check className="h-4 w-4 text-ya-accent" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Language Section */}
        <section className="bg-card rounded-ya-lg p-5 border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {lang === 'ar' ? 'اللغة' : 'Language'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {languageOptions.map(({ value, label, flag }) => (
              <button
                key={value}
                onClick={() => setLang(value)}
                className={cn(
                  "flex items-center justify-center gap-3 p-4 rounded-ya-md border transition-all",
                  lang === value
                    ? "border-ya-accent bg-ya-accent/10"
                    : "border-border hover:border-ya-accent/50"
                )}
              >
                <span className="text-2xl">{flag}</span>
                <span className="text-sm font-medium">{label}</span>
                {lang === value && (
                  <Check className="h-4 w-4 text-ya-accent" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-card rounded-ya-lg p-5 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-ya-accent" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' 
                    ? 'تلقي تحديثات حول طلباتك'
                    : 'Receive updates about your orders'}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </section>

        {/* User Info */}
        {user && (
          <section className="bg-card rounded-ya-lg p-5 border border-border">
            <h2 className="text-lg font-semibold mb-3">
              {lang === 'ar' ? 'الحساب' : 'Account'}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
