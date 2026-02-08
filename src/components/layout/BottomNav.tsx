import { Home, Search, ListOrdered, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'home' as const, icon: Home, path: '/' },
  { key: 'search' as const, icon: Search, path: '/search' },
  { key: 'orders' as const, icon: ListOrdered, path: '/orders' },
  { key: 'profile' as const, icon: User, path: '/profile' },
] as const;

export default function BottomNav() {
  const { t } = useLang();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-card/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ key, icon: Icon, path }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={key}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-sm")} />
              <span className="text-[10px] font-medium">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
