// src/contexts/SettingsContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SettingsContextType {
  isSimpleMode: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  isSimpleMode: false,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  useEffect(() => {
    const storedSimpleMode = localStorage.getItem('simpleMode') === 'true';
    setIsSimpleMode(storedSimpleMode);
  }, []);

  return (
    <SettingsContext.Provider value={{ isSimpleMode }}>
      {children}
    </SettingsContext.Provider>
  );
};
