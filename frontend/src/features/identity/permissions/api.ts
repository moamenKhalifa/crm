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
  options?: { suppressForbiddenHandling?: boolean },
): Promise<PermissionSummaryResponse[]> {
  const search = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  return client.get<PermissionSummaryResponse[]>(`${IDENTITY}/permissions?${search.toString()}`, undefined, options);
}

export interface ListPermissionsPagedParams {
  limit: number;
  offset: number;
  q?: string;
  sort?: string;
}

// See `users/api.ts`'s `PagedResponse<T>` comment — duplicated per-file
// rather than shared, matching this codebase's existing convention.
export interface PagedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** `paged=true` variant of `listPermissions`. Only `code` is a valid `sort` column — the backend 400s on anything else. */
export function listPermissionsPaged(
  client: HttpClient,
  params: ListPermissionsPagedParams,
): Promise<PagedResponse<PermissionSummaryResponse>> {
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
  return client.get<PagedResponse<PermissionSummaryResponse>>(`${IDENTITY}/permissions?${search.toString()}`);
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
