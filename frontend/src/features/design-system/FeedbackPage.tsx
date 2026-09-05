import { useState } from 'react';

import {
  AccessDenied,
  Alert,
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilteredEmpty,
  LoadingBoundary,
  LoadingState,
  Modal,
  NotFound,
  Skeleton,
  Status,
  ToastProvider,
  useToast,
  type ToastVariant,
} from '@shared/components';
import { useT } from '@shared/i18n';

import styles from './FeedbackPage.module.css';

const TOAST_VARIANTS: ToastVariant[] = ['info', 'success', 'warning', 'danger'];
const STATUS_VARIANTS = ['success', 'neutral', 'warning'] as const;
const STATUS_LABEL_KEYS = ['status.active', 'status.inactive', 'status.pending'] as const;

function ToastDemo() {
  const { show } = useToast();
  const { t } = useT();

  return (
    <div className={styles.row}>
      {TOAST_VARIANTS.map((variant) => (
        <button
          key={variant}
          type="button"
          onClick={() => show({ variant, message: t(`designSystem.feedback.toast.message.${variant}`) })}
        >
          {t(`designSystem.feedback.toast.${variant}`)}
        </button>
      ))}
    </div>
  );
}

function ToastSection() {
  const { t } = useT();
  return (
    <section data-testid="ds-feedback-toast-section">
      <h2>{t('designSystem.feedback.sections.toast')}</h2>
      <p>{t('designSystem.feedback.rules.toast')}</p>
      {/* Self-contained provider so this section works when the page is
          rendered standalone (e.g. the axe test), independent of whatever
          ToastProvider the real app mounts at the root. */}
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>
    </section>
  );
}

function AlertSection() {
  const { t } = useT();
  return (
    <section data-testid="ds-feedback-alert-section">
      <h2>{t('designSystem.feedback.sections.alert')}</h2>
      <p>{t('designSystem.feedback.rules.alert')}</p>
      <div className={styles.stack}>
        <Alert variant="info" title={t('designSystem.feedback.alert.infoTitle')}>
          {t('designSystem.feedback.alert.infoBody')}
        </Alert>
        <Alert
          variant="success"
          title={t('designSystem.feedback.alert.successTitle')}
          actions={<a href="#feedback-invitations">{t('designSystem.feedback.alert.successAction')}</a>}
        >
          {t('designSystem.feedback.alert.successBody')}
        </Alert>
        <Alert
          variant="warning"
          title={t('designSystem.feedback.alert.warningTitle')}
          dismissible
          onDismiss={() => {}}
        >
          {t('designSystem.feedback.alert.warningBody')}
        </Alert>
        <Alert
          variant="danger"
          title={t('designSystem.feedback.alert.dangerTitle')}
          onRetry={() => {}}
          correlationId="a1b2c3d4"
        >
          {t('designSystem.feedback.alert.dangerBody')}
        </Alert>
      </div>
    </section>
  );
}

function PageStatesSection() {
  const { t } = useT();
  return (
    <section data-testid="ds-feedback-page-states-section">
      <h2>{t('designSystem.feedback.sections.pageStates')}</h2>
      <p>{t('designSystem.feedback.rules.pageStates')}</p>

      <h3>EmptyState</h3>
      <EmptyState title={t('admin.users.empty.title')} />

      <h3>FilteredEmpty</h3>
      <FilteredEmpty activeFilters={[t('admin.users.status.active'), 'Admin']} onClearFilters={() => {}} />

      <h3>ErrorState</h3>
      <ErrorState onRetry={() => {}} correlationId="req-9f21" />

      <h3>LoadingState</h3>
      <LoadingState />

      <h3>NotFound</h3>
      <NotFound onBack={() => {}} />

      <h3>AccessDenied</h3>
      <AccessDenied onBack={() => {}} />
    </section>
  );
}

function LoadingBoundarySection() {
  const { t } = useT();
  const [loading, setLoading] = useState(true);

  return (
    <section data-testid="ds-feedback-loading-boundary-section">
      <h2>{t('designSystem.feedback.sections.loadingBoundary')}</h2>
      <p>{t('designSystem.feedback.rules.loadingBoundary')}</p>
      <button type="button" onClick={() => setLoading((current) => !current)}>
        {t('designSystem.feedback.loadingBoundary.toggle')}
      </button>
      <div className={styles.loadingBoundaryDemo}>
        <LoadingBoundary loading={loading} fallback={<Skeleton inlineSize="60%" blockSize="1.25em" />}>
          <p>{t('designSystem.feedback.loadingBoundary.content')}</p>
        </LoadingBoundary>
      </div>
    </section>
  );
}

function ModalSection() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);

  return (
    <section data-testid="ds-feedback-modal-section">
      <h2>{t('designSystem.feedback.sections.modal')}</h2>
      <p>{t('designSystem.feedback.rules.modal')}</p>

      <button type="button" onClick={() => setOpen(true)}>
        {t('designSystem.feedback.modal.open')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('designSystem.feedback.modal.title')}>
        <p>{t('designSystem.feedback.modal.body')}</p>
      </Modal>

      <button type="button" onClick={() => setDestructiveOpen(true)}>
        {t('designSystem.feedback.modal.openDestructive')}
      </button>
      <ConfirmDialog
        open={destructiveOpen}
        onClose={() => setDestructiveOpen(false)}
        onConfirm={() => setDestructiveOpen(false)}
        title={t('admin.users.confirmDelete.title')}
        destructive
        consequence={<p>{t('designSystem.feedback.modal.consequence')}</p>}
        confirmationPhrase="amina@example.com"
      >
        <p>{t('admin.users.confirmDelete.body')}</p>
      </ConfirmDialog>
    </section>
  );
}

function BadgeStatusSection() {
  const { t } = useT();
  return (
    <section data-testid="ds-feedback-badge-status-section">
      <h2>{t('designSystem.feedback.sections.badgeStatus')}</h2>
      <p>{t('designSystem.feedback.rules.badgeStatus')}</p>

      <div className={styles.row}>
        <Badge>{t('designSystem.feedback.badge.neutralExample')}</Badge>
        <Badge variant="success" tone="semantic">
          {t('designSystem.feedback.badge.semanticExample')}
        </Badge>
      </div>

      <div className={styles.row}>
        {STATUS_VARIANTS.map((variant, index) => (
          <Status key={variant} variant={variant} label={t(STATUS_LABEL_KEYS[index])} />
        ))}
      </div>
    </section>
  );
}

function RtlPreviewSection() {
  const { t } = useT();
  return (
    <section data-testid="ds-feedback-rtl-section">
      <h2>{t('designSystem.feedback.sections.rtl')}</h2>
      <div dir="rtl" className={styles.stack}>
        <Alert
          variant="danger"
          title={t('designSystem.feedback.alert.dangerTitle')}
          onRetry={() => {}}
          dismissible
          onDismiss={() => {}}
          correlationId="a1b2c3d4"
        >
          {t('designSystem.feedback.alert.dangerBody')}
        </Alert>
        <div className={styles.row}>
          {STATUS_VARIANTS.map((variant, index) => (
            <Status key={variant} variant={variant} label={t(STATUS_LABEL_KEYS[index])} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FeedbackPage() {
  const { t } = useT();

  return (
    <main className={styles.page} data-testid="ds-feedback-section">
      <h1>{t('designSystem.feedback.title')}</h1>
      <ToastSection />
      <AlertSection />
      <PageStatesSection />
      <LoadingBoundarySection />
      <ModalSection />
      <BadgeStatusSection />
      <RtlPreviewSection />
    </main>
  );
}
