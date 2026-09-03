import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpClient } from '@shared/api';

import {
  assignRolePermissions,
  createRole,
  deleteRole,
  getRole,
  getRolePermissions,
  listRoles,
  removeRolePermissions,
  updateRole,
} from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('identity/roles api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const client = new HttpClient({ baseUrl: '/api' });

  it('listRoles issues a GET with the /identity prefix and query params', async () => {
    await listRoles(client, { limit: 25, offset: 0 });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/roles?limit=25&offset=0',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getRole issues a GET to /identity/roles/:id', async () => {
    await getRole(client, 'r1');
    expect(fetch).toHaveBeenCalledWith('/api/identity/roles/r1', expect.objectContaining({ method: 'GET' }));
  });

  it('createRole issues a POST with the body', async () => {
    await createRole(client, { name: 'Support Lead', description: 'Handles escalations' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/roles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Support Lead', description: 'Handles escalations' }),
      }),
    );
  });

  it('updateRole issues a PATCH with only the given fields', async () => {
    await updateRole(client, 'r1', { name: 'New Name' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/roles/r1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'New Name' }) }),
    );
  });

  it('deleteRole issues a DELETE', async () => {
    await deleteRole(client, 'r1');
    expect(fetch).toHaveBeenCalledWith('/api/identity/roles/r1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('getRolePermissions issues a GET to /permissions', async () => {
    await getRolePermissions(client, 'r1');
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/roles/r1/permissions',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('assignRolePermissions issues a PUT (adds only)', async () => {
    await assignRolePermissions(client, 'r1', ['p1', 'p2']);
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/roles/r1/permissions',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ permission_ids: ['p1', 'p2'] }) }),
    );
  });

  it('removeRolePermissions issues a DELETE with a body', async () => {
    await removeRolePermissions(client, 'r1', ['p1']);
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/roles/r1/permissions',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ permission_ids: ['p1'] }) }),
    );
  });

});
