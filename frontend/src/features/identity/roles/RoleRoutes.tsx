import { Navigate, Route, Routes } from 'react-router-dom';

import { PermissionGate } from '@shared/authorization';

import RoleCreatePage from './RoleCreatePage';
import RoleDetailsPage from './RoleDetailsPage';
import RoleEditPage from './RoleEditPage';
import RoleListPage from './RoleListPage';

export default function RoleRoutes() {
  return (
    <Routes>
      <Route index element={<RoleListPage />} />
      <Route
        path="new"
        element={
          <PermissionGate permission="Role.Create" fallback={<Navigate to=".." replace />}>
            <RoleCreatePage />
          </PermissionGate>
        }
      />
      <Route path=":id" element={<RoleDetailsPage />} />
      <Route
        path=":id/edit"
        element={
          <PermissionGate permission="Role.Update" fallback={<Navigate to=".." replace />}>
            <RoleEditPage />
          </PermissionGate>
        }
      />
    </Routes>
  );
}
