import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextInput } from './TextInput';

const textInputCss = readFileSync(join(process.cwd(), 'src/shared/components/form/TextInput.module.css'), 'utf-8');

describe('TextInput', () => {
  it('renders the label, associated via htmlFor', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('error sets aria-invalid and renders the error text', () => {
    render(<TextInput label="Email" error="Required" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('required reflects on the input and sets aria-required (AC7)', () => {
    render(<TextInput label="Email" required />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('forwards readOnly and sets aria-readonly', () => {
    render(<TextInput label="Email" readOnly value="a@b.com" onChange={() => {}} />);
    const input = screen.getByLabelText(/Email/) as HTMLInputElement;
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-readonly', 'true');
  });

  it('applies data-max-width per the maxWidth prop, defaulting to "field" (AC3)', () => {
    const { rerender, container } = render(<TextInput label="Email" />);
    expect(container.querySelector('[data-max-width="field"]')).toBeInTheDocument();

    rerender(<TextInput label="Email" maxWidth="wide" />);
    expect(container.querySelector('[data-max-width="wide"]')).toBeInTheDocument();

    rerender(<TextInput label="Email" maxWidth="full" />);
    expect(container.querySelector('[data-max-width="full"]')).toBeInTheDocument();
  });

  it('composes aria-describedby from descriptionId, then hint, then error ids', () => {
    render(<TextInput label="Email" descriptionId="ext-desc" hint="We never share this" />);
    const input = screen.getByLabelText(/Email/);
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toMatch(/^ext-desc /);
    expect(describedBy).toContain('-hint');
  });

  it('defines a :-webkit-autofill override so the browser default background never shows (AC13)', () => {
    expect(textInputCss).toMatch(/:-webkit-autofill/);
    expect(textInputCss).toMatch(/box-shadow:\s*0 0 0 1000px/);
  });

  it('field maximum widths are constrained per the anatomy rule (AC3)', () => {
    expect(textInputCss).toMatch(/\[data-max-width='field'\]\s*\{[^}]*max-inline-size:\s*480px/);
    expect(textInputCss).toMatch(/\[data-max-width='wide'\]\s*\{[^}]*max-inline-size:\s*720px/);
    expect(textInputCss).toMatch(/\[data-max-width='full'\]\s*\{[^}]*max-inline-size:\s*100%/);
  });
});
