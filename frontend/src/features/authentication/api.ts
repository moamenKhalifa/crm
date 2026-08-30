import type { HttpClient } from '@shared/api';

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  access_expires_in: number;
  refresh_expires_in: number;
}

export interface RoleSummaryResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_customer: boolean;
  roles: RoleSummaryResponse[];
}

export interface PermissionSummaryResponse {
  id: string;
  code: string;
  description: string | null;
}

export function login(client: HttpClient, body: { email: string; password: string }): Promise<TokenPairResponse> {
  return client.post<TokenPairResponse>('/auth/login', body);
}

export function refresh(client: HttpClient, refreshToken: string): Promise<TokenPairResponse> {
  return client.post<TokenPairResponse>('/auth/refresh', { refresh_token: refreshToken });
}

// Logout carries its own Bearer token explicitly (rather than relying on a
// configured `getAuthorizationHeader`) since the caller — `AuthProvider` —
// uses a private, unauthenticated `HttpClient` for auth endpoints. See
// `AuthProvider.tsx` for why.
export function logout(client: HttpClient, refreshToken: string, accessToken: string): Promise<void> {
  return client.post<void>(
    '/auth/logout',
    { refresh_token: refreshToken },
    { Authorization: `Bearer ${accessToken}` },
  );
}

export function fetchMe(client: HttpClient, accessToken: string): Promise<UserResponse> {
  return client.get<UserResponse>('/auth/me', { Authorization: `Bearer ${accessToken}` });
}

// TODO(backend): `UserResponse` does not yet expose a flat `permissions[]`
// array (backend/app/modules/identity_access/api/schemas/user.py). Until a
// follow-up backend story adds it to `/auth/me`, derive the effective
// permission set client-side by fanning out per role.
export async function fetchPermissionsForRoles(
  client: HttpClient,
  accessToken: string,
  roleIds: string[],
): Promise<string[]> {
  const results = await Promise.all(
    roleIds.map((roleId) =>
      client.get<PermissionSummaryResponse[]>(`/roles/${roleId}/permissions`, {
        Authorization: `Bearer ${accessToken}`,
      }),
    ),
  );
  const codes = new Set<string>();
  for (const permissions of results) {
    for (const permission of permissions) {
      codes.add(permission.code);
    }
  }
  return Array.from(codes);
}
