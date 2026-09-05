// Small inline icon set for the sidebar (AC4). Deliberately symmetric —
// none require a `[dir="rtl"]` flip (see `AppSidebar.module.css`'s comment
// on directional icons for the pattern to follow if a future icon needs one).
import type { SVGProps } from 'react';

function iconProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    width: '1em',
    height: '1em',
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  };
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="7" cy="6.5" r="2.5" />
      <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
      <circle cx="14" cy="7" r="2" />
      <path d="M12.5 12.2c1.9.3 3 1.5 3 3.8" />
    </svg>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M10 2.5 16 5v4.5c0 4-2.6 6.9-6 8-3.4-1.1-6-4-6-8V5l6-2.5Z" />
      <path d="M7.3 10 9 11.7 12.7 8" />
    </svg>
  );
}

export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="6" cy="14" r="3" />
      <path d="M8.1 11.9 15 5l2 2-1.5 1.5L17 10l-2 2-1.5-1.5L12 12" />
    </svg>
  );
}
