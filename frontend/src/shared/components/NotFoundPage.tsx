import { useT } from '@shared/i18n';

export default function NotFoundPage() {
  const { t } = useT();

  return (
    <main>
      <h1>404</h1>
      <p>{t('errors.notFound')}</p>
    </main>
  );
}
