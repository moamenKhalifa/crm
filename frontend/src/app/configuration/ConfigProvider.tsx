import { createContext, useContext, type ReactNode } from 'react';

import { appConfig, type AppConfig } from './env';

const ConfigContext = createContext<AppConfig | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  return <ConfigContext.Provider value={appConfig}>{children}</ConfigContext.Provider>;
}

export function useAppConfig(): AppConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error('useAppConfig must be used within ConfigProvider');
  }
  return config;
}
