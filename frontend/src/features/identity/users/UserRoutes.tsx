import { Navigate, Route, Routes } from 'react-router-dom';

import { PermissionGate } from '@shared/authorization';

import UserCreatePage from './UserCreatePage';
import UserDetailsPage from './UserDetailsPage';
import UserEditPage from './UserEditPage';
import UserListPage from './UserListPage';

// Route-level gates are a UI convenience — the backend's `require_permission`
// dependency (see `backend/.../api/routers/users.py`) is the real boundary.
export default function UserRoutes() {
  return (
    <Routes>
      <Route index element={<UserListPage />} />
      <Route
        path="new"
        element={
          <PermissionGate permission="User.Create" fallback={<Navigate to=".." replace />}>
            <UserCreatePage />
          </PermissionGate>
        }
      />
      <Route path=":id" element={<UserDetailsPage />} />
      <Route
        path=":id/edit"
        element={
          <PermissionGate permission="User.Update" fallback={<Navigate to=".." replace />}>
            <UserEditPage />
          </PermissionGate>
        }
      />
    </Routes>
  );
}
