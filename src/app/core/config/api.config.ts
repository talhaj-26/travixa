
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
  baseUrl:
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8081'
      : 'https://travixa-backend.onrender.com',
  apiPrefix: '/api',
  backendReady: true,
};
