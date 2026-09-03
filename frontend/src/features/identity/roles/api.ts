import type { HttpClient } from '@shared/api';
import type { PermissionSummaryResponse, RoleSummaryResponse } from '@features/authentication/api';

// See `frontend/src/features/authentication/api.ts` — every Identity &
// Access route is mounted under `/identity`.
const IDENTITY = '/identity';

export interface ListRolesParams {
  limit: number;
  offset: number;
}

export function listRoles(client: HttpClient, params: ListRolesParams): Promise<RoleSummaryResponse[]> {
  const search = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  return client.get<RoleSummaryResponse[]>(`${IDENTITY}/roles?${search.toString()}`);
}

export function getRole(client: HttpClient, id: string): Promise<RoleSummaryResponse> {
  return client.get<RoleSummaryResponse>(`${IDENTITY}/roles/${id}`);
}

export interface CreateRoleBody {
  name: string;
  description?: string | null;
}

export function createRole(client: HttpClient, body: CreateRoleBody): Promise<RoleSummaryResponse> {
  return client.post<RoleSummaryResponse>(`${IDENTITY}/roles`, body);
}

export interface UpdateRoleBody {
  name?: string;
  description?: string | null;
}

export function updateRole(client: HttpClient, id: string, body: UpdateRoleBody): Promise<RoleSummaryResponse> {
  return client.patch<RoleSummaryResponse>(`${IDENTITY}/roles/${id}`, body);
}

export function deleteRole(client: HttpClient, id: string): Promise<void> {
  return client.delete<void>(`${IDENTITY}/roles/${id}`);
}

export function getRolePermissions(client: HttpClient, id: string): Promise<PermissionSummaryResponse[]> {
  return client.get<PermissionSummaryResponse[]>(`${IDENTITY}/roles/${id}/permissions`);
}

// `PUT` only ADDS the given ids to the role's existing permission set (see
// `backend/.../application/use_cases/roles/assign_permissions_to_role.py`
// — it unions, it does not replace). Removal is a separate endpoint below.
export function assignRolePermissions(
  client: HttpClient,
  id: string,
  permissionIds: string[],
): Promise<RoleSummaryResponse> {
  return client.put<RoleSummaryResponse>(`${IDENTITY}/roles/${id}/permissions`, { permission_ids: permissionIds });
}

// `DELETE` with a body — not covered by `HttpClient.delete()` (GET-shaped
// sugar), so this goes through `request()` directly.
export function removeRolePermissions(
  client: HttpClient,
  id: string,
  permissionIds: string[],
): Promise<RoleSummaryResponse> {
  return client.request<RoleSummaryResponse>(`${IDENTITY}/roles/${id}/permissions`, {
    method: 'DELETE',
    body: { permission_ids: permissionIds },
  });
}
