import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthorizationProvider } from './AuthorizationProvider';
import { PermissionGate, type PermissionGateProps } from './PermissionGate';

function renderGate(
  roles: string[],
  permissions: string[],
  gateProps: Partial<Omit<PermissionGateProps, 'children' | 'fallback'>>,
) {
  return render(
    <AuthorizationProvider roles={roles} permissions={permissions}>
      <PermissionGate {...gateProps} fallback={<span>fallback</span>}>
        <span>granted</span>
      </PermissionGate>
    </AuthorizationProvider>,
  );
}

describe('PermissionGate', () => {
  it('renders children when authorized', () => {
    renderGate(['admin'], ['User.View'], { role: 'admin' });
    expect(screen.getByText('granted')).toBeInTheDocument();
  });

  it('renders fallback when not authorized', () => {
    renderGate(['agent'], [], { role: 'admin' });
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('an empty anyPermission array means no restriction', () => {
    renderGate([], [], { anyPermission: [] });
    expect(screen.getByText('granted')).toBeInTheDocument();
  });
});
