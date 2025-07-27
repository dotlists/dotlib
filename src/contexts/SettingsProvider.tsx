// src/contexts/SettingsProvider.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { SettingsContext } from './SettingsContextDef';

function SettingsProvider({ children }: { children: ReactNode }) {
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  useEffect(() => {
    const storedSimpleMode = localStorage.getItem('simpleMode') === 'true';
    setIsSimpleMode(storedSimpleMode);
  }, []);

  const handleSetIsSimpleMode = (isSimple: boolean) => {
    setIsSimpleMode(isSimple);
    localStorage.setItem('simpleMode', String(isSimple));
  };

  return (
    <SettingsContext.Provider value={{ isSimpleMode, setIsSimpleMode: handleSetIsSimpleMode }}>
      {children}
    </SettingsContext.Provider>
  );
}
export default SettingsProvider;


