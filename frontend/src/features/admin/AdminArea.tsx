import { Outlet } from 'react-router-dom';

import { AuthenticatedShell } from '@features/authentication/AuthenticatedShell';

import { AdminLayout } from './AdminLayout';

export default function AdminArea() {
  return (
    <AuthenticatedShell>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AuthenticatedShell>
  );
}
