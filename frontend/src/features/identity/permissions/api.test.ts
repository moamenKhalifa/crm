import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpClient } from '@shared/api';

import { createPermission, deletePermission, getPermission, listPermissions, updatePermission } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('identity/permissions api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const client = new HttpClient({ baseUrl: '/api' });

  it('listPermissions issues a GET with the /identity prefix and query params', async () => {
    await listPermissions(client, { limit: 25, offset: 0 });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/permissions?limit=25&offset=0',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getPermission issues a GET to /identity/permissions/:id', async () => {
    await getPermission(client, 'p1');
    expect(fetch).toHaveBeenCalledWith('/api/identity/permissions/p1', expect.objectContaining({ method: 'GET' }));
  });

  it('createPermission issues a POST with the body', async () => {
    await createPermission(client, { code: 'User.View', description: 'View users' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/permissions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'User.View', description: 'View users' }),
      }),
    );
  });

  it('updatePermission issues a PATCH with only the given fields', async () => {
    await updatePermission(client, 'p1', { code: 'User.ViewAll' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/permissions/p1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ code: 'User.ViewAll' }) }),
    );
  });

  it('deletePermission issues a DELETE', async () => {
    await deletePermission(client, 'p1');
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/permissions/p1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
