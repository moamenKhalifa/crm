import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useForm } from './useForm';

interface Values extends Record<string, string> {
  email: string;
  password: string;
}

const schema = z.object({
  email: z.string().min(1, 'email.required').email('email.invalid'),
  password: z.string().min(1, 'password.required'),
});

describe('useForm', () => {
  it('mode "submit" (default) never validates before a submit attempt', () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: '', password: '' }, schema, onSubmit: vi.fn() }),
    );

    act(() => result.current.setField('email', 'not-an-email'));
    act(() => result.current.handleBlur('email'));

    expect(result.current.errors.email).toBeUndefined();
  });

  it('mode "blur-then-live": a field validates only after it is blurred, then live on every keystroke', () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: '', password: '' }, schema, onSubmit: vi.fn(), mode: 'blur-then-live' }),
    );

    // Typing in password must never surface the email error before email has been touched.
    act(() => result.current.setField('password', 'a'));
    expect(result.current.errors.email).toBeUndefined();

    act(() => result.current.handleBlur('email'));
    expect(result.current.errors.email).toBe('email.required');

    act(() => result.current.setField('email', 'still-bad'));
    expect(result.current.errors.email).toBe('email.invalid');

    act(() => result.current.setField('email', 'a@b.com'));
    expect(result.current.errors.email).toBeUndefined();
  });

  it('a failed submit surfaces every field error, even for untouched fields', async () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: '', password: '' }, schema, onSubmit: vi.fn(), mode: 'blur-then-live' }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errors.email).toBe('email.required');
    expect(result.current.errors.password).toBe('password.required');
    expect(result.current.submitCount).toBe(1);
  });

  it('firstInvalidField returns the first key of initial order with a truthy error', async () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: '', password: '' }, schema, onSubmit: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.firstInvalidField()).toBe('email');
  });

  it('firstInvalidField returns null when there are no errors', () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: 'a@b.com', password: 'x' }, schema, onSubmit: vi.fn() }),
    );

    expect(result.current.firstInvalidField()).toBeNull();
  });

  it('setFieldErrors merges server-returned field errors into the existing map (AC10)', () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: 'a@b.com', password: 'x' }, schema, onSubmit: vi.fn() }),
    );

    act(() => result.current.setFieldErrors({ email: 'server.email.taken' }));
    expect(result.current.errors.email).toBe('server.email.taken');
  });

  it('setFormError sets and clears the top-of-form banner directly (AC10)', () => {
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: 'a@b.com', password: 'x' }, schema, onSubmit: vi.fn() }),
    );

    act(() => result.current.setFormError('errors.unexpected'));
    expect(result.current.submitError).toBe('errors.unexpected');

    act(() => result.current.setFormError(null));
    expect(result.current.submitError).toBeNull();
  });

  it('clears the submit error and resolves once onSubmit succeeds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm<Values>({ initial: { email: 'a@b.com', password: 'x' }, schema, onSubmit }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(result.current.submitError).toBeNull();
  });
});
