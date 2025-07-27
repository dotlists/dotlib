// src/contexts/ThemeContextDef.ts
import { createContext } from 'react';

type Theme = "light" | "dark" | "gruvbox" | "blue" | "monochrome";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
