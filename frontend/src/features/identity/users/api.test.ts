import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpClient } from '@shared/api';

import {
  assignRoles,
  createUser,
  deleteUser,
  getUser,
  getUserRoles,
  listUsers,
  setUserActive,
  updateUser,
} from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('identity/users api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const client = new HttpClient({ baseUrl: '/api' });

  it('listUsers issues a GET with the /identity prefix and query params', async () => {
    await listUsers(client, { limit: 25, offset: 50 });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/users?limit=25&offset=50',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getUser issues a GET to /identity/users/:id', async () => {
    await getUser(client, 'u1');
    expect(fetch).toHaveBeenCalledWith('/api/identity/users/u1', expect.objectContaining({ method: 'GET' }));
  });

  it('createUser issues a POST with the body', async () => {
    const body = { email: 'a@b.com', password: 'Passw0rd!', full_name: 'A B', is_customer: false, role_ids: ['r1'] };
    await createUser(client, body);
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/users',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }),
    );
  });

  it('updateUser issues a PATCH with only the given fields', async () => {
    await updateUser(client, 'u1', { full_name: 'New Name' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/users/u1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ full_name: 'New Name' }) }),
    );
  });

  it('setUserActive issues a PATCH to /active', async () => {
    await setUserActive(client, 'u1', false);
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/users/u1/active',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ is_active: false }) }),
    );
  });

  it('deleteUser issues a DELETE', async () => {
    await deleteUser(client, 'u1');
    expect(fetch).toHaveBeenCalledWith('/api/identity/users/u1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('assignRoles issues a PUT to /roles', async () => {
    await assignRoles(client, 'u1', ['r1', 'r2']);
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/users/u1/roles',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ role_ids: ['r1', 'r2'] }) }),
    );
  });

  it('getUserRoles issues a GET to /roles', async () => {
    await getUserRoles(client, 'u1');
    expect(fetch).toHaveBeenCalledWith(
      '/api/identity/users/u1/roles',
      expect.objectContaining({ method: 'GET' }),
    );
  });

});
