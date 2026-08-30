export interface Branding {
  appName: string;
  logoUrl: string;
  logoAlt: string;
  faviconUrl?: string;
}

export const defaultBranding: Branding = {
  appName: 'Customer Support CRM',
  logoUrl: '/logo.svg',
  logoAlt: 'Customer Support CRM',
};
