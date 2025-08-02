// src/contexts/ThemeProvider.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { setCookie, getCookie } from '@/lib/utils';
import { ThemeContext } from './ThemeContextDef';

type Theme = "light" | "dark" | "midnight" | "gruvbox" | "blue" | "monochrome";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = getCookie("theme") as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.className = storedTheme;
      document.body.className = storedTheme;
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setCookie("theme", newTheme, 365);
    document.documentElement.className = newTheme;
    document.body.className = newTheme;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
