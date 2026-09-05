import { useNavigate } from 'react-router-dom';

import { Button } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface NotFoundProps {
  title?: string;
  description?: string;
  /** Defaults to `navigate('/', { replace: true })` — a plain `history.back()` could exit the app on a deep link. */
  onBack?: () => void;
}

export function NotFound({ title, description, onBack }: NotFoundProps) {
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
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
      </svg>
      <p className={styles.title}>{title ?? t('states.notFound.title')}</p>
      <p className={styles.description}>{description ?? t('states.notFound.description')}</p>
      <Button variant="secondary" onClick={handleBack}>
        {t('states.notFound.back')}
      </Button>
    </div>
  );
}
