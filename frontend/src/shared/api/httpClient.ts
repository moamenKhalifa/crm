import { ApiError, type FieldError } from './ApiError';
import { getAccessToken } from './tokenStore';

export const DEFAULT_PUBLIC_ENDPOINTS: readonly string[] = [
  '/identity/auth/login',
  '/identity/auth/register',
  '/identity/auth/refresh',
  '/identity/auth/password-reset',
  '/identity/auth/password-reset/confirm',
];

export interface HttpClientOptions {
  baseUrl: string;
  /** Path prefixes that never receive an `Authorization` header, even when a token is set (AC6). */
  publicEndpoints?: readonly string[];
  /** Called once per shared refresh attempt on a 401; return `true` to retry the original request. */
  onSessionExpired?: () => Promise<boolean>;
  /** Called on every 403 — for a global toast/log. MUST NOT log tokens. */
  onForbidden?: () => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** @internal set on the single retry after a refresh, to prevent looping. */
  _isRetry?: boolean;
  /**
   * Skip the global `onForbidden` toast/reauth-check for this call's 403s.
   * For auxiliary "fetch a picker's option list" lookups that a caller
   * already renders without (e.g. a filter dropdown backed by a sibling
   * resource's `.View` permission) — the caller degrades locally instead
   * of surfacing a scary global "Forbidden" toast for an optional lookup.
   */
  suppressForbiddenHandling?: boolean;
}

interface NormalizedError {
  code: string;
  message: string;
  correlationId?: string;
  fieldErrors: FieldError[];
}

function isAbsoluteUrl(path: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

function isPublicEndpoint(path: string, publicEndpoints: readonly string[]): boolean {
  return publicEndpoints.some((prefix) => path.startsWith(prefix));
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const asSeconds = Number(value);
  if (!Number.isNaN(asSeconds)) {
    return asSeconds;
  }
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, Math.round((asDate - Date.now()) / 1000));
  }
  return undefined;
}

async function normalizeErrorBody(response: Response): Promise<NormalizedError> {
  // The backend's current error envelope is `{"error":{"code","message"}}`
  // (see backend/app/modules/identity_access/api/error_handlers.py). The
  // future envelope is a flat `{code, message, correlationId, fieldErrors}`
  // (see the intake for this story). Both shapes are accepted here so the
  // frontend keeps working unchanged once the backend adopts the new shape.
  try {
    const data = (await response.json()) as {
      error?: { code?: string; message?: string; correlationId?: string; fieldErrors?: FieldError[] };
      code?: string;
      message?: string;
      correlationId?: string;
      fieldErrors?: FieldError[];
      [key: string]: unknown;
    };
    const envelope = data.error;
    return {
      code: envelope?.code ?? data.code ?? `HTTP_${response.status}`,
      message: envelope?.message ?? data.message ?? response.statusText,
      correlationId: envelope?.correlationId ?? data.correlationId ?? response.headers.get('X-Correlation-Id') ?? undefined,
      fieldErrors: envelope?.fieldErrors ?? data.fieldErrors ?? [],
    };
  } catch {
    return {
      code: `HTTP_${response.status}`,
      message: response.statusText,
      correlationId: response.headers.get('X-Correlation-Id') ?? undefined,
      fieldErrors: [],
    };
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly publicEndpoints: readonly string[];
  private readonly onSessionExpired?: () => Promise<boolean>;
  private readonly onForbidden?: () => void;
  /** Single in-flight refresh shared by every concurrent 401 — never more than one `onSessionExpired` call at a time. */
  private refreshPromise: Promise<boolean> | null = null;

  constructor({ baseUrl, publicEndpoints = DEFAULT_PUBLIC_ENDPOINTS, onSessionExpired, onForbidden }: HttpClientOptions) {
    this.baseUrl = baseUrl;
    this.publicEndpoints = publicEndpoints;
    this.onSessionExpired = onSessionExpired;
    this.onForbidden = onForbidden;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, _isRetry = false, suppressForbiddenHandling = false } = options;
    const absolute = isAbsoluteUrl(path);
    const url = absolute ? path : `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }
    // Cross-origin (absolute) requests and public auth endpoints never carry
    // the app's access token — AC5, AC6. Ordinary same-origin relative paths
    // are the only case that attaches it (AC4).
    if (!absolute && !isPublicEndpoint(path, this.publicEndpoints)) {
      const token = getAccessToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      // This is the only place `NETWORK_ERROR` is emitted — any `fetch`
      // rejection (offline, DNS failure, CORS, etc.) lands here. No
      // `X-Correlation-Id` response header exists for a failed fetch, so one
      // is synthesised client-side so the retryable banner (G5) still has a
      // stable id to display.
      throw new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: cause instanceof Error ? cause.message : 'Network request failed',
        correlationId: crypto.randomUUID(),
      });
    }

    if (response.status === 401 && !_isRetry && this.onSessionExpired) {
      const refreshed = await this.refreshOnce();
      if (refreshed) {
        return this.request<T>(path, { ...options, _isRetry: true });
      }
    }

    if (response.status === 403 && !suppressForbiddenHandling) {
      this.onForbidden?.();
    }

    if (!response.ok) {
      // Not gated to 429 — 423 (locked) and other account-state statuses
      // also carry a `Retry-After` header for a timed countdown (e.g.
      // ACCOUNT_LOCKED), and `parseRetryAfter` returns `undefined` when the
      // header is absent, so this is a no-op for responses that lack it.
      const retryAfterSeconds = parseRetryAfter(response.headers.get('Retry-After'));
      const { code, message, correlationId, fieldErrors } = await normalizeErrorBody(response);
      throw new ApiError({ status: response.status, code, message, correlationId, fieldErrors, retryAfterSeconds });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private refreshOnce(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (this.onSessionExpired?.() ?? Promise.resolve(false)).finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  get<T>(path: string, headers?: Record<string, string>, options?: { suppressForbiddenHandling?: boolean }): Promise<T> {
    return this.request<T>(path, { method: 'GET', headers, suppressForbiddenHandling: options?.suppressForbiddenHandling });
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, headers });
  }

  put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body, headers });
  }

  patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body, headers });
  }

  delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', headers });
  }
}
