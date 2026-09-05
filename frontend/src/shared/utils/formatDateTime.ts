export interface FormattedDateTime {
  /** Locale-formatted, human-readable string — safe to render directly. */
  display: string;
  /** Machine-readable ISO 8601 string — for `<time dateTime>` / `title`. */
  iso: string;
}

/**
 * Formats a date for display in a given locale, alongside its ISO string
 * for `<time dateTime>` / `title` attributes. Demonstrated on the DataTable
 * documentation page (`DataTablePage.tsx`) with mock data — no real
 * Identity & Access list page has a date field to wire this into yet (see
 * Story 13's brief: `UserResponse` does not currently expose one).
 */
export function formatDateTime(date: Date, locale: 'en' | 'ar', timeZone?: string): FormattedDateTime {
  const resolvedTimeZone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const display = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: resolvedTimeZone,
  }).format(date);
  return { display, iso: date.toISOString() };
}
