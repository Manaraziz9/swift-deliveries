import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, User, ChevronDown } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function TopBar() {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl safe-area-top">
      <div className="container flex items-center justify-between h-16">
        {/* YA Logo - LOCKED DESIGN */}
        <Link to="/" className="flex items-center gap-1 group">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-ya-primary tracking-tight font-en group-hover:text-ya-accent transition-colors duration-200">
              YA
            </span>
            <span className="w-2 h-2 rounded-full bg-ya-highlight ms-0.5 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
          </div>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 rounded-ya-sm bg-muted/80 hover:bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
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
              className="btn-ya py-2 px-4 text-sm"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('loginSignup')}</span>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-ya-sm bg-muted/80 hover:bg-muted px-3 py-2 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-ya-sm bg-ya-accent-gradient flex items-center justify-center text-white text-xs font-bold">
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
