import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useLang } from '@/contexts/LangContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { dir } = useLang();

  const options = [
    { value: 'light' as const, icon: Sun, label: dir === 'rtl' ? 'فاتح' : 'Light' },
    { value: 'dark' as const, icon: Moon, label: dir === 'rtl' ? 'داكن' : 'Dark' },
    { value: 'system' as const, icon: Monitor, label: dir === 'rtl' ? 'تلقائي' : 'System' },
  ];

  const CurrentIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-ya-sm bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
          aria-label="Toggle theme"
        >
          <CurrentIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {options.map(({ value, icon: Icon, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === value && "bg-accent/10 text-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
