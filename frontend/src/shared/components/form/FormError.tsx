import { useT } from '@shared/i18n';

export interface FormErrorProps {
  errorKey?: string | null;
}

/** Renders a validation/submit error resolved through i18n — pass a key from `@shared/validation`. */
export function FormError({ errorKey }: FormErrorProps) {
  const { t } = useT();

  if (!errorKey) {
    return null;
  }

  return (
    <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
      {t(errorKey)}
    </p>
  );
}
