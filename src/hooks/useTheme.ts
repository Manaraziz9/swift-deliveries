import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ya-theme') as Theme) || 'system';
    }
    return 'system';
  });

  const applyTheme = useCallback((resolvedTheme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    
    // Add transitioning class for smooth animation
    root.classList.add('theme-transitioning');
    
    // Apply the theme
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 350);
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme, applyTheme]);

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('ya-theme', newTheme);
  };

  return { theme, setTheme: setThemeValue };
}
