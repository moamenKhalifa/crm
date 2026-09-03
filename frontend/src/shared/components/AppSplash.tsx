import { defaultBranding, type Branding } from '@shared/theme';
import { useT } from '@shared/i18n';

export interface AppSplashProps {
  branding?: Branding;
}

/**
 * Neutral, branded splash shown while auth status is `'unknown'` — no login
 * form or other auth affordance (AC1, AC3). Distinct from `AppLoading`,
 * which is for narrower "loading a page" states inside protected screens.
 */
export function AppSplash({ branding = defaultBranding }: AppSplashProps) {
  const { t } = useT();

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="app-splash"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-md)',
        height: '100vh',
      }}
    >
      <img src={branding.logoUrl} alt={branding.logoAlt} width={40} height={40} />
      <p>{t('states.loading')}</p>
    </div>
  );
}
