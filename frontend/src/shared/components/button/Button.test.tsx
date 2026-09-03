import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button, type ButtonVariant } from './Button';

// `?raw` is intercepted by Vite's CSS-modules plugin before the raw-loader
// special-casing applies (it still resolves to a class-map object for
// `.module.css`), so the stylesheet source is read directly instead. Vitest
// runs with `process.cwd()` at the `frontend/` package root.
const buttonCss = readFileSync(
  join(process.cwd(), 'src/shared/components/button/Button.module.css'),
  'utf-8',
);

const ALL_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'danger-subtle', 'link'];

describe('Button', () => {
  it('loading disables the button and renders a spinner', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('disabled blocks onClick', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders each of the six variants with data-variant', () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    for (const variant of ALL_VARIANTS) {
      rerender(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
    }
  });

  it('sets aria-busy while loading and does not fire onClick', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');

    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps its label rendered while loading (spinner is additive, not a replacement)', () => {
    render(<Button loading>Save changes</Button>);
    expect(screen.getByText('Save changes')).toBeInTheDocument();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('renders disabledReason as an sr-only description and as title', () => {
    render(
      <Button disabled disabledReason="Requires the User.Delete permission">
        Delete
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Requires the User.Delete permission');

    const describedById = button.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById!)).toHaveTextContent('Requires the User.Delete permission');
  });

  it('does not set aria-describedby or title when disabled without a reason', () => {
    render(<Button disabled>Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('aria-describedby');
    expect(button).not.toHaveAttribute('title');
  });

  it('icon-only button warns in dev when aria-label is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Button iconOnly>★</Button>);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('iconOnly'));
    warnSpy.mockRestore();
  });

  it('icon-only button does not warn when aria-label is present', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Button iconOnly aria-label="More actions">
        ★
      </Button>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does not suppress the focus outline', () => {
    expect(buttonCss).not.toMatch(/outline:\s*none/);
    expect(buttonCss).not.toMatch(/outline:\s*0[^.]/);
  });

  it('defines a prefers-reduced-motion block', () => {
    expect(buttonCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it('disabled state is signalled by surface/border, not opacity dimming (AC4)', () => {
    // jsdom does not cascade a CSS-module `:disabled` rule onto a rendered
    // element reliably, so this asserts on the stylesheet source itself —
    // the same technique the token layer-boundary check uses.
    expect(buttonCss).not.toMatch(/:disabled\s*{[^}]*opacity/);
    expect(buttonCss).toMatch(/:disabled\s*{[^}]*background:\s*var\(--color-surface-disabled\)/);
    expect(buttonCss).toMatch(/:disabled\s*{[^}]*color:\s*var\(--color-text-disabled\)/);
    expect(buttonCss).toMatch(/:disabled\s*{[^}]*cursor:\s*not-allowed/);

    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
