import { useNavigate } from 'react-router-dom';

import { Button } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface AccessDeniedProps {
  title?: string;
  description?: string;
  /** Defaults to `navigate('/', { replace: true })` — a plain `history.back()` could exit the app on a deep link. */
  onBack?: () => void;
}

export function AccessDenied({ title, description, onBack }: AccessDeniedProps) {
  const { t } = useT();
  const navigate = useNavigate();

  const handleBack = onBack ?? (() => navigate('/', { replace: true }));

  return (
    <div className={styles.panel} role="status">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      <p className={styles.title}>{title ?? t('states.accessDenied.title')}</p>
      <p className={styles.description}>{description ?? t('states.accessDenied.description')}</p>
      <Button variant="secondary" onClick={handleBack}>
        {t('states.accessDenied.back')}
      </Button>
    </div>
  );
}
