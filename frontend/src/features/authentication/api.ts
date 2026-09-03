import type { HttpClient } from '@shared/api';

// The Identity & Access backend module is mounted under `/identity` (see
// `backend/app/main.py`: `app.include_router(identity_router, prefix="/identity", ...)`).
// `HttpClient.baseUrl` (`/api`, proxied to the backend root — see
// `vite.config.ts`) is shared across every future module, so each module's
// own prefix is applied here, not baked into the global base URL.
const IDENTITY = '/identity';

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
  return client.post<TokenPairResponse>(`${IDENTITY}/auth/login`, body);
}

export function refresh(client: HttpClient, refreshToken: string): Promise<TokenPairResponse> {
  return client.post<TokenPairResponse>(`${IDENTITY}/auth/refresh`, { refresh_token: refreshToken });
}

export interface RegisterCustomerBody {
  email: string;
  password: string;
  full_name: string;
}

// `/identity/auth/register` is in `HttpClient`'s `publicEndpoints` list, so
// the shared client never attaches a token here regardless of caller.
export function register(client: HttpClient, body: RegisterCustomerBody): Promise<UserResponse> {
  return client.post<UserResponse>(`${IDENTITY}/auth/register`, body);
}

// Not a public endpoint — the shared `HttpClient` auto-attaches the current
// access token from `tokenStore` (AuthProvider calls this before clearing
// the token store, so the caller is still authenticated at request time).
export function logout(client: HttpClient, refreshToken: string): Promise<void> {
  return client.post<void>(`${IDENTITY}/auth/logout`, { refresh_token: refreshToken });
}

export function fetchMe(client: HttpClient): Promise<UserResponse> {
  return client.get<UserResponse>(`${IDENTITY}/auth/me`);
}

// TODO(backend): `UserResponse` does not yet expose a flat `permissions[]`
// array (backend/app/modules/identity_access/api/schemas/user.py). Until a
// follow-up backend story adds it to `/auth/me`, derive the effective
// permission set client-side by fanning out per role.
export async function fetchPermissionsForRoles(client: HttpClient, roleIds: string[]): Promise<string[]> {
  const results = await Promise.all(
    roleIds.map((roleId) => client.get<PermissionSummaryResponse[]>(`${IDENTITY}/roles/${roleId}/permissions`)),
  );
  const codes = new Set<string>();
  for (const permissions of results) {
    for (const permission of permissions) {
      codes.add(permission.code);
    }
  }
  return Array.from(codes);
}
