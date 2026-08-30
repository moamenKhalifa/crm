import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

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

  it('each variant renders the correct data attribute', () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary');

    rerender(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary');

    rerender(<Button variant="danger">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'danger');
  });
});
