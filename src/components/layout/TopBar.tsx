import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, User } from 'lucide-react';

export default function TopBar() {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-14">
        <Link to="/" className="text-xl font-bold text-gradient-gold font-heading">
          {t('appName')}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          {!user && (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <User className="h-3.5 w-3.5" />
              {t('loginSignup')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
