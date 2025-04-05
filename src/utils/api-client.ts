import axios from 'axios';
import { ApiKeyManager, ApiKeyType } from './api-key-manager';

interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  keyType: ApiKeyType;
  retries?: number;
}

/**
 * Create a pre-configured API client with proper authentication
 */
export function createApiClient(options: ApiClientOptions) {
  const keyManager = ApiKeyManager.getInstance();
  const keyConfig = keyManager.getKey(options.keyType);
  
  if (!keyConfig) {
    throw new Error(`API key for ${options.keyType} not configured`);
  }
  
  // Use provided baseURL or the one from key config
  const baseURL = options.baseURL || keyConfig.baseUrl;
  
  // Get auth headers
  const headers = keyManager.getAuthHeaders(options.keyType);
  
  // Create axios instance
  const client = axios.create({
    baseURL,
    timeout: options.timeout || 30000,
    headers
  });
  
  // Add retry logic
  const maxRetries = options.retries || 3;
  client.interceptors.response.use(
    response => response,
    async (error) => {
      const config = error.config;
      
      // If there's no config or we've reached max retries, reject
      if (!config || !config.retry) {
        config.retry = 0;
      }
      
      if (config.retry >= maxRetries) {
        return Promise.reject(error);
      }
      
      // Increment retry count
      config.retry += 1;
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, config.retry), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry request
      return client(config);
    }
  );
  
  return client;
} 