import { z } from 'zod';

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;

// Messages are set to the i18n keys themselves (rather than switching on
// `ZodIssue.code`) so `zodToFieldError` can return the issue's message
// directly — simpler and equally correct, since every schema below already
// controls its own failure message.
export const emailSchema = z.string().trim().min(1, 'validation.required').email('validation.email');

export const passwordSchema = z
  .string()
  .min(8, 'validation.passwordStrength')
  .refine((value) => HAS_LETTER.test(value) && HAS_DIGIT.test(value), 'validation.passwordStrength');

export const nonEmptyStringSchema = z.string().trim().min(1, 'validation.required');

export function zodToFieldError(err: z.ZodError): string {
  return err.issues[0]?.message ?? 'errors.unexpected';
}
