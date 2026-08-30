import type { HttpClient } from './httpClient';

export interface HealthResponse {
  status: string;
  database?: string;
}

export function healthCheck(client: HttpClient): Promise<HealthResponse> {
  return client.get<HealthResponse>('/health');
}
