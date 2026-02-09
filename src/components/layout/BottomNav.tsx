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
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-18">
        {navItems.map(({ key, icon: Icon, path }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={key}
              to={path}
              className={cn(
                "relative flex flex-col items-center gap-1 px-5 py-2 transition-all duration-200",
                active ? "text-ya-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute -top-0.5 inset-x-4 h-0.5 bg-ya-accent-gradient rounded-full" />
              )}
              
              <div className={cn(
                "relative p-1.5 rounded-ya-sm transition-all duration-200",
                active && "bg-ya-accent/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  active && "scale-110"
                )} />
              </div>
              
              <span className={cn(
                "text-[11px] font-medium transition-all duration-200",
                active && "font-semibold"
              )}>
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
