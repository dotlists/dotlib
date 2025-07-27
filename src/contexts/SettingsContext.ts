// src/contexts/SettingsContext.ts
import { useContext } from 'react';
import { SettingsContext } from './SettingsContextDef';

export const useSettings = () => useContext(SettingsContext);
