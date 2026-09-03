import { AuthenticatedShell } from '@features/authentication/AuthenticatedShell';

export default function PortalArea() {
  return (
    <AuthenticatedShell>
      <h1>Portal</h1>
      {/* CRM modules for this area will register their own sub-routes here. */}
    </AuthenticatedShell>
  );
}
