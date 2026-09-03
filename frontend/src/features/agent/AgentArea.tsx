import { AuthenticatedShell } from '@features/authentication/AuthenticatedShell';

export default function AgentArea() {
  return (
    <AuthenticatedShell>
      <h1>Agent</h1>
      {/* CRM modules for this area will register their own sub-routes here. */}
    </AuthenticatedShell>
  );
}
