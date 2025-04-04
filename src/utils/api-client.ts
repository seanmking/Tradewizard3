import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiKeyManager, ApiKeyType } from './api-key-manager';

/**
 * API Client Configuration Options
 */
export interface ApiClientOptions {
  keyType: ApiKeyType;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Factory for creating API clients with consistent configuration and retry logic
 */
export class ApiClientFactory {
  /**
   * Create a new API client with retry logic
   */
  public static createClient(options: ApiClientOptions): AxiosInstance {
    const keyManager = ApiKeyManager.getInstance();
    const headers = keyManager.getAuthHeaders(options.keyType);
    const baseURL = options.baseURL || keyManager.getApiUrl(options.keyType);
    
    const client = axios.create({
      baseURL,
      timeout: options.timeout || 30000,
      headers
    });
    
    // Add request interceptor
    client.interceptors.request.use(
      (config) => {
        // Any request modifications can go here
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor with retry logic
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };
        
        // Initialize retry count if not present
        if (config._retryCount === undefined) {
          config._retryCount = 0;
        }
        
        // Check if we should retry the request
        const shouldRetry = 
          config._retryCount < (options.maxRetries || 3) && 
          error.response?.status && 
          [429, 500, 502, 503, 504].includes(error.response.status);
        
        if (shouldRetry) {
          config._retryCount += 1;
          
          // Calculate delay with exponential backoff
          const delay = (options.retryDelay || 1000) * Math.pow(2, config._retryCount - 1);
          
          // Wait for the specified delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the request
          return client(config);
        }
        
        return Promise.reject(error);
      }
    );
    
    return client;
  }
}

/**
 * Utility function to create a new API client
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  return ApiClientFactory.createClient(options);
} 