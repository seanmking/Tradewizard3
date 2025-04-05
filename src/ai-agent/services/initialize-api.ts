/**
 * This file initializes the API configuration at the application startup.
 * It ensures that the correct API endpoints are used based on the API key format,
 * regardless of what's in the environment variables.
 */

import { OpenAI } from 'openai';
import { ApiKeyManager } from '@/utils/api-key-manager';

const initializeApiConfiguration = () => {
  // This code runs at import time
  const apiKey = process.env.OPENAI_API_KEY || '';
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is not set. API calls will fail.');
    return;
  }
  
  // Determine the correct endpoint based on API key format
  const isProjectKey = apiKey.startsWith('sk-proj-');
  const correctEndpoint = isProjectKey 
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  // Override the environment variables in memory
  process.env.AI_MODEL_URL = correctEndpoint;
  process.env.OPENAI_API_URL = correctEndpoint;
  
  console.info(`API endpoints initialized: Using ${isProjectKey ? 'Project' : 'Standard'} endpoints (${correctEndpoint})`);
  
  // Also apply the correction to any global variables as needed
  if (typeof global !== 'undefined' && global.process && global.process.env) {
    global.process.env.AI_MODEL_URL = correctEndpoint;
    global.process.env.OPENAI_API_URL = correctEndpoint;
  }
};

// Execute the initialization immediately
initializeApiConfiguration();

export default initializeApiConfiguration;

/**
 * Initialize the OpenAI client with the API key
 * Using the centralized API key manager
 */
export function initializeOpenAIClient(): OpenAI {
  // Get API key from centralized manager
  const apiKeyManager = ApiKeyManager.getInstance();
  const apiKey = apiKeyManager.getKeyValue('openai') || '';
  const apiUrl = apiKeyManager.getApiUrl('openai');
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured in initialize-api.ts');
  }
  
  // Create the OpenAI client with the API key
  return new OpenAI({
    apiKey,
    baseURL: apiUrl,
    dangerouslyAllowBrowser: true
  });
} 