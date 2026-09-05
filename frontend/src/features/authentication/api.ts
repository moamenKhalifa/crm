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

/** `/auth/me` only — the caller's own effective permissions, live-resolved
 * server-side. Gated only by being authenticated (unlike, say,
 * `GET /roles/{id}/permissions`, which requires `Role.View`), since a user
 * is always entitled to know their own permission set. */
export interface MeResponse extends UserResponse {
  permissions: string[];
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

export function fetchMe(client: HttpClient): Promise<MeResponse> {
  return client.get<MeResponse>(`${IDENTITY}/auth/me`);
}
