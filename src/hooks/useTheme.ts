import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('ya-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  }
  return 'system';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (resolvedTheme: 'light' | 'dark') => {
      root.classList.add('theme-transitioning');
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
      
      const timer = setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 350);
      
      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | undefined;

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      cleanup = applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => {
        cleanup?.();
        cleanup = applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => {
        cleanup?.();
        mediaQuery.removeEventListener('change', handler);
      };
    } else {
      cleanup = applyTheme(theme);
      return () => cleanup?.();
    }
  }, [theme]);

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('ya-theme', newTheme);
  };

  return { theme, setTheme: setThemeValue };
}
