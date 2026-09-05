import type { HttpClient } from '@shared/api';
import type { RoleSummaryResponse, UserResponse } from '@features/authentication/api';

// See `frontend/src/features/authentication/api.ts` — the backend mounts
// every Identity & Access route under `/identity`.
const IDENTITY = '/identity';

export interface ListUsersParams {
  limit: number;
  offset: number;
}

export function listUsers(client: HttpClient, params: ListUsersParams): Promise<UserResponse[]> {
  const search = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  return client.get<UserResponse[]>(`${IDENTITY}/users?${search.toString()}`);
}

export interface ListUsersPagedParams {
  limit: number;
  offset: number;
  q?: string;
  sort?: string;
  is_active?: boolean;
  role_id?: string[];
}

// Small per-file duplicate of the `{ items, total, limit, offset }` envelope
// shape — matches this codebase's existing convention of duplicating small
// per-file param/response interfaces (see `ListUsersParams` above) rather
// than introducing a shared module for a two-line type.
export interface PagedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** `paged=true` variant of `listUsers` — see Story 13's DataTable migration. */
export function listUsersPaged(client: HttpClient, params: ListUsersPagedParams): Promise<PagedResponse<UserResponse>> {
  const search = new URLSearchParams();
  search.set('limit', String(params.limit));
  search.set('offset', String(params.offset));
  search.set('paged', 'true');
  if (params.q) {
    search.set('q', params.q);
  }
  if (params.sort) {
    search.set('sort', params.sort);
  }
  if (params.is_active !== undefined) {
    search.set('is_active', String(params.is_active));
  }
  for (const id of params.role_id ?? []) {
    search.append('role_id', id);
  }
  return client.get<PagedResponse<UserResponse>>(`${IDENTITY}/users?${search.toString()}`);
}

export function getUser(client: HttpClient, id: string): Promise<UserResponse> {
  return client.get<UserResponse>(`${IDENTITY}/users/${id}`);
}

export interface CreateUserBody {
  email: string;
  password: string;
  full_name: string;
  is_customer: boolean;
  role_ids: string[];
}

export function createUser(client: HttpClient, body: CreateUserBody): Promise<UserResponse> {
  return client.post<UserResponse>(`${IDENTITY}/users`, body);
}

export interface UpdateUserBody {
  email?: string;
  full_name?: string;
}

export function updateUser(client: HttpClient, id: string, body: UpdateUserBody): Promise<UserResponse> {
  return client.patch<UserResponse>(`${IDENTITY}/users/${id}`, body);
}

export function setUserActive(client: HttpClient, id: string, isActive: boolean): Promise<UserResponse> {
  return client.patch<UserResponse>(`${IDENTITY}/users/${id}/active`, { is_active: isActive });
}

export function deleteUser(client: HttpClient, id: string): Promise<void> {
  return client.delete<void>(`${IDENTITY}/users/${id}`);
}

export function assignRoles(client: HttpClient, id: string, roleIds: string[]): Promise<UserResponse> {
  return client.put<UserResponse>(`${IDENTITY}/users/${id}/roles`, { role_ids: roleIds });
}

export function getUserRoles(client: HttpClient, id: string): Promise<RoleSummaryResponse[]> {
  return client.get<RoleSummaryResponse[]>(`${IDENTITY}/users/${id}/roles`);
}
