import { Navigate, Route, Routes } from 'react-router-dom';

import { PermissionGate } from '@shared/authorization';

import PermissionCreatePage from './PermissionCreatePage';
import PermissionDetailsPage from './PermissionDetailsPage';
import PermissionEditPage from './PermissionEditPage';
import PermissionListPage from './PermissionListPage';

export default function PermissionRoutes() {
  return (
    <Routes>
      <Route index element={<PermissionListPage />} />
      <Route
        path="new"
        element={
          <PermissionGate permission="Permission.Create" fallback={<Navigate to=".." replace />}>
            <PermissionCreatePage />
          </PermissionGate>
        }
      />
      <Route path=":id" element={<PermissionDetailsPage />} />
      <Route
        path=":id/edit"
        element={
          <PermissionGate permission="Permission.Update" fallback={<Navigate to=".." replace />}>
            <PermissionEditPage />
          </PermissionGate>
        }
      />
    </Routes>
  );
}
