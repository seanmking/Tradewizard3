/**
 * This utility manages API endpoints for OpenAI and ensures that the correct endpoint
 * is used for project API keys.
 */

/**
 * Determines the correct API endpoint to use based on the API key type.
 * Project API keys should use 'api.chatgpt.com' endpoints.
 * Standard API keys should use 'api.openai.com' endpoints.
 * 
 * @param apiKey The OpenAI API key
 * @returns The correct API endpoint URL
 */
export function getCorrectApiEndpoint(apiKey: string): string {
  if (!apiKey) {
    console.warn('API key is empty, using default OpenAI endpoint');
    return 'https://api.openai.com/v1/chat/completions';
  }

  const isProjectKey = apiKey.startsWith('sk-proj-');
  
  if (isProjectKey) {
    console.info('Using OpenAI API endpoint for project API key');
    return 'https://api.openai.com/v1/chat/completions';
  } else {
    console.info('Using OpenAI API endpoint for standard API key');
    return 'https://api.openai.com/v1/chat/completions';
  }
}

/**
 * Validates that the API endpoint matches the API key type and returns the corrected endpoint if needed.
 * 
 * @param apiKey The OpenAI API key
 * @param configuredEndpoint The currently configured API endpoint
 * @returns The correct API endpoint URL
 */
export function validateAndCorrectApiEndpoint(apiKey: string, configuredEndpoint: string): string {
  if (!apiKey || !configuredEndpoint) {
    return configuredEndpoint || 'https://api.openai.com/v1/chat/completions';
  }

  const isProjectKey = apiKey.startsWith('sk-proj-');
  const isProjectEndpoint = configuredEndpoint.includes('api.chatgpt.com');
  
  // Mismatch between key type and endpoint
  if (isProjectKey && !isProjectEndpoint) {
    console.warn(`WARNING: Using project API key with non-project URL (${configuredEndpoint}). Correcting to OpenAI API endpoint.`);
    return 'https://api.openai.com/v1/chat/completions';
  } else if (!isProjectKey && isProjectEndpoint) {
    console.warn(`WARNING: Using standard API key with project URL (${configuredEndpoint}). Correcting to OpenAI API endpoint.`);
    return 'https://api.openai.com/v1/chat/completions';
  }
  
  // Endpoint matches key type
  return configuredEndpoint;
} 