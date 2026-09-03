import type { HttpClient } from '@shared/api';
import type { PermissionSummaryResponse } from '@features/authentication/api';

// See `frontend/src/features/authentication/api.ts` — every Identity &
// Access route is mounted under `/identity`.
const IDENTITY = '/identity';

export interface ListPermissionsParams {
  limit: number;
  offset: number;
}

export function listPermissions(
  client: HttpClient,
  params: ListPermissionsParams,
): Promise<PermissionSummaryResponse[]> {
  const search = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  return client.get<PermissionSummaryResponse[]>(`${IDENTITY}/permissions?${search.toString()}`);
}

export function getPermission(client: HttpClient, id: string): Promise<PermissionSummaryResponse> {
  return client.get<PermissionSummaryResponse>(`${IDENTITY}/permissions/${id}`);
}

export interface CreatePermissionBody {
  code: string;
  description?: string | null;
}

export function createPermission(client: HttpClient, body: CreatePermissionBody): Promise<PermissionSummaryResponse> {
  return client.post<PermissionSummaryResponse>(`${IDENTITY}/permissions`, body);
}

export interface UpdatePermissionBody {
  code?: string;
  description?: string | null;
}

export function updatePermission(
  client: HttpClient,
  id: string,
  body: UpdatePermissionBody,
): Promise<PermissionSummaryResponse> {
  return client.patch<PermissionSummaryResponse>(`${IDENTITY}/permissions/${id}`, body);
}

export function deletePermission(client: HttpClient, id: string): Promise<void> {
  return client.delete<void>(`${IDENTITY}/permissions/${id}`);
}
