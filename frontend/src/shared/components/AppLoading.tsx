import { useT } from '@shared/i18n';

export function AppLoading() {
  const { t } = useT();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>{t('states.loading')}</p>
    </div>
  );
}
