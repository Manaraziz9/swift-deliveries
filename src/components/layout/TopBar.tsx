import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, User, ChevronDown } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function TopBar() {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-xl safe-area-top">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-gold-static flex items-center justify-center shadow-gold transition-transform duration-300 group-hover:scale-105">
            <span className="text-primary-foreground font-bold text-lg">و</span>
          </div>
          <span className="text-xl font-bold text-gradient-gold font-heading hidden sm:block">
            {t('appName')}
          </span>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 rounded-xl bg-muted/80 hover:bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
          
          {/* Notifications */}
          {user && <NotificationBell />}
          
          {/* Auth button */}
          {!user ? (
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-xl bg-gradient-gold-static px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold hover:shadow-glow-gold transition-all duration-300"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('loginSignup')}</span>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl bg-muted/80 hover:bg-muted px-3 py-2 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-gold-static flex items-center justify-center text-primary-foreground text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
