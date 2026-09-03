import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormRow } from './FormRow';

describe('FormRow', () => {
  it('defaults to a single column and reflects the columns prop as data-columns', () => {
    const { rerender, container } = render(
      <FormRow>
        <span>a</span>
      </FormRow>,
    );
    expect(container.querySelector('[data-columns="1"]')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();

    rerender(
      <FormRow columns={2}>
        <span>a</span>
        <span>b</span>
      </FormRow>,
    );
    expect(container.querySelector('[data-columns="2"]')).toBeInTheDocument();
  });
});
