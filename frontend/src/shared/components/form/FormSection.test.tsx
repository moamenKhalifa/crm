import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormSection } from './FormSection';

describe('FormSection', () => {
  it('renders a labelled section with a heading and its children', () => {
    render(
      <FormSection title="Contact details" description="How we reach you">
        <p>field goes here</p>
      </FormSection>,
    );

    expect(screen.getByRole('region', { name: 'Contact details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contact details' })).toBeInTheDocument();
    expect(screen.getByText('How we reach you')).toBeInTheDocument();
    expect(screen.getByText('field goes here')).toBeInTheDocument();
  });
});
