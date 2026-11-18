
import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  apiPrefix: string;
  backendReady: boolean;
}

export const API_CONFIG = new InjectionToken<ApiConfig>(
  'TRAVIXA_API_CONFIG',
);

export const defaultApiConfig: ApiConfig = {
  baseUrl: 'http://localhost:8081',
  apiPrefix: '/api',
  backendReady: true,
};
