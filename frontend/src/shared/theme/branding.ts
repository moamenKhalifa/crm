export interface Branding {
  appName: string;
  logoUrl: string;
  logoAlt: string;
  faviconUrl?: string;
  /** Bumped on deploy so `versionedLogoUrl` cache-busts explicitly. */
  logoVersion: string;
}

export const defaultBranding: Branding = {
  appName: 'Customer Support CRM',
  logoUrl: '/logo.svg',
  logoAlt: 'Customer Support CRM',
  logoVersion: '1',
};

export function versionedLogoUrl(branding: Branding): string {
  return `${branding.logoUrl}?v=${branding.logoVersion}`;
}
