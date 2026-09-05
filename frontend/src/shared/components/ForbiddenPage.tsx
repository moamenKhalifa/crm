import { useNavigate } from 'react-router-dom';

import { useT } from '@shared/i18n';

import { AccessDenied } from './feedback/AccessDenied';

export default function ForbiddenPage() {
  const { t } = useT();
  const navigate = useNavigate();

  return <AccessDenied description={t('errors.forbidden')} onBack={() => navigate('/', { replace: true })} />;
}
