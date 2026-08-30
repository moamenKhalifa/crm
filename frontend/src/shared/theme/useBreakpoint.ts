import { useEffect, useState } from 'react';

import { useTheme } from './ThemeProvider';
import { lightTheme, type Breakpoints } from './tokens';

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide';

function resolveBreakpoint(breakpoints: Breakpoints): BreakpointName {
  if (window.matchMedia(`(min-width: ${breakpoints.wide}px)`).matches) {
    return 'wide';
  }
  if (window.matchMedia(`(min-width: ${breakpoints.desktop}px)`).matches) {
    return 'desktop';
  }
  if (window.matchMedia(`(min-width: ${breakpoints.tablet}px)`).matches) {
    return 'tablet';
  }
  return 'mobile';
}

/** Returns the current responsive bucket, re-evaluated on viewport changes. */
export function useBreakpoint(): BreakpointName {
  const { theme } = useTheme();
  const { breakpoints } = theme;

  const [breakpoint, setBreakpoint] = useState<BreakpointName>(() => resolveBreakpoint(breakpoints));

  useEffect(() => {
    const queries = (['wide', 'desktop', 'tablet'] as const).map(
      (name) => window.matchMedia(`(min-width: ${breakpoints[name]}px)`),
    );
    const handleChange = () => setBreakpoint(resolveBreakpoint(breakpoints));

    handleChange();
    queries.forEach((mql) => mql.addEventListener('change', handleChange));
    return () => queries.forEach((mql) => mql.removeEventListener('change', handleChange));
  }, [breakpoints]);

  return breakpoint;
}

/** A `@media (min-width: …)` string for the given breakpoint, for use in stylesheets. */
export function mediaQuery(min: keyof Breakpoints): string {
  return `@media (min-width: ${lightTheme.breakpoints[min]}px)`;
}
