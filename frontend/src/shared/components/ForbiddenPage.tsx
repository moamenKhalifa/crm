import { useNavigate } from 'react-router-dom';

import { useT } from '@shared/i18n';

import { Button } from './button/Button';

export default function ForbiddenPage() {
  const { t } = useT();
  const navigate = useNavigate();

  return (
    <main>
      <h1>{t('errors.forbiddenTitle')}</h1>
      <p>{t('errors.forbidden')}</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        {t('errors.backHome')}
      </Button>
    </main>
  );
}
