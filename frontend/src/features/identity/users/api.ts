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
