import { describe, expect, it } from 'vitest';

import { applyDocumentDirection } from './documentDirection';

describe('applyDocumentDirection', () => {
  it('sets dir="rtl", lang="ar", and data-locale="ar" for Arabic', () => {
    applyDocumentDirection('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dataset.locale).toBe('ar');
  });

  it('sets dir="ltr", lang="en", and data-locale="en" for English', () => {
    applyDocumentDirection('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.locale).toBe('en');
  });
});
