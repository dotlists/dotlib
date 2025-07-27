// src/hooks/useTheme.ts
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContextDef';

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
