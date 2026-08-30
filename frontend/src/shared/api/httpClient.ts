import { ApiError } from './ApiError';

export type AuthHeaderSupplier = () => string | undefined;

export interface HttpClientOptions {
  baseUrl: string;
  getAuthorizationHeader?: AuthHeaderSupplier;
  /** Called once per shared refresh attempt on a 401; return `true` to retry the original request. */
  onUnauthorized?: () => Promise<boolean>;
  /** Called on every 403 — for a global toast/log. MUST NOT log tokens. */
  onForbidden?: () => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** @internal set on the single retry after a refresh, to prevent looping. */
  _isRetry?: boolean;
}

async function parseErrorBody(response: Response): Promise<{ code: string; message: string; details?: unknown }> {
  try {
    const data = (await response.json()) as { code?: string; message?: string; [key: string]: unknown };
    return {
      code: data.code ?? `HTTP_${response.status}`,
      message: data.message ?? response.statusText,
      details: data,
    };
  } catch {
    return { code: `HTTP_${response.status}`, message: response.statusText };
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly getAuthorizationHeader?: AuthHeaderSupplier;
  private readonly onUnauthorized?: () => Promise<boolean>;
  private readonly onForbidden?: () => void;
  /** Single in-flight refresh shared by every concurrent 401 — never more than one `onUnauthorized` call at a time. */
  private refreshPromise: Promise<boolean> | null = null;

  constructor({ baseUrl, getAuthorizationHeader, onUnauthorized, onForbidden }: HttpClientOptions) {
    this.baseUrl = baseUrl;
    this.getAuthorizationHeader = getAuthorizationHeader;
    this.onUnauthorized = onUnauthorized;
    this.onForbidden = onForbidden;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, _isRetry = false } = options;
    const url = `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }
    const token = this.getAuthorizationHeader?.();
    if (token) {
      requestHeaders.Authorization = token;
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
      // rejection (offline, DNS failure, CORS, etc.) lands here.
      throw new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: cause instanceof Error ? cause.message : 'Network request failed',
      });
    }

    if (response.status === 401 && !_isRetry && this.onUnauthorized) {
      const refreshed = await this.refreshOnce();
      if (refreshed) {
        return this.request<T>(path, { ...options, _isRetry: true });
      }
    }

    if (response.status === 403) {
      this.onForbidden?.();
    }

    if (!response.ok) {
      const { code, message, details } = await parseErrorBody(response);
      throw new ApiError({ status: response.status, code, message, details });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private refreshOnce(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (this.onUnauthorized?.() ?? Promise.resolve(false)).finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'GET', headers });
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, headers });
  }
}
