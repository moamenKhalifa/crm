// Module-scoped in-memory access token. Never persisted, never in React
// state or the Zustand store. Consumed by HttpClient's interceptor and
// updated exclusively by AuthProvider on sign-in / refresh / sign-out.
let accessToken: string | undefined;
type Listener = (token: string | undefined) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | undefined {
  return accessToken;
}

export function setAccessToken(token: string | undefined): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

export function subscribeAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test-only: clears listeners + token between tests. */
export function __resetTokenStoreForTests(): void {
  accessToken = undefined;
  listeners.clear();
}
