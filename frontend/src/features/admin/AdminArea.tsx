import { Outlet } from 'react-router-dom';

import { AuthenticatedShell } from '@features/authentication/AuthenticatedShell';

export default function AdminArea() {
  return (
    <AuthenticatedShell>
      <Outlet />
    </AuthenticatedShell>
  );
}
