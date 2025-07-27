// src/contexts/SettingsContextDef.ts
import { createContext } from 'react';

interface SettingsContextType {
    isSimpleMode: boolean;
    setIsSimpleMode: (isSimple: boolean) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
    isSimpleMode: false,
    setIsSimpleMode: () => {},
});
