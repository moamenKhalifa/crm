import { useTranslation } from 'react-i18next';

import { defaultNS } from './config';

/** Thin re-export of `useTranslation`, pinned to the `common` namespace. */
export function useT() {
  return useTranslation(defaultNS);
}
