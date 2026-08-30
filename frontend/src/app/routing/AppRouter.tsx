import { lazy, useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { useAuth } from '@features/authentication/AuthProvider';
import { RequireAuth, type RequireAuthProps } from '@shared/authorization';

const AgentArea = lazy(() => import('@features/agent/AgentArea'));
const AdminArea = lazy(() => import('@features/admin/AdminArea'));
const PortalArea = lazy(() => import('@features/portal/PortalArea'));
const SignInPage = lazy(() => import('@features/authentication/SignInPage'));
const NotFoundPage = lazy(() => import('@shared/components/NotFoundPage'));

// `shared/authorization/RequireAuth` cannot import `useAuth` itself (shared/
// must not import features/) — this wrapper, living in app/routing (which
// may import features/), supplies the one piece it needs: auth status.
function Protected(props: Omit<RequireAuthProps, 'status'>) {
  const { status } = useAuth();
  return <RequireAuth status={status} {...props} />;
}

// The `/*` wildcard matches any nested or Unicode-encoded segment (e.g.
// /agent/foo/bar, /agent/한글) and renders the area's placeholder — React
// Router decodes the URL for us, so no custom handling is required here.
function createRouter() {
  return createBrowserRouter([
    { path: '/', element: <Navigate to="/agent" replace /> },
    { path: '/sign-in', element: <SignInPage /> },
    {
      path: '/agent/*',
      element: (
        <Protected anyRole={['agent', 'admin']}>
          <AgentArea />
        </Protected>
      ),
    },
    {
      path: '/admin/*',
      element: (
        <Protected role="admin">
          <AdminArea />
        </Protected>
      ),
    },
    {
      path: '/portal/*',
      element: (
        <Protected>
          <PortalArea />
        </Protected>
      ),
    },
    { path: '*', element: <NotFoundPage /> },
  ]);
}

export function AppRouter() {
  // Built per mount, not as a module-level singleton: a plain `pushState`
  // (as opposed to react-router's own `navigate()`) doesn't fire `popstate`,
  // so a singleton router created once at module-import time would ignore a
  // test's attempt to change the starting URL for a later render. Building
  // it in `useMemo` gives every fresh mount (each test's `render()` call) its
  // own router bound to whatever `window.location` is current at that time.
  // In the real app `AppRouter` is mounted exactly once, so this is
  // behaviourally identical to a module-level constant.
  const router = useMemo(() => createRouter(), []);
  return <RouterProvider router={router} />;
}
