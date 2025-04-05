import { ApiKeyManager } from './api-key-manager';
import { OpenAI } from 'openai';

// Define standard client configuration
export type OpenAIClientConfig = {
  apiKey: string;
  projectId?: string;
  dangerouslyAllowBrowser?: boolean;
};

// Define validation result type
export type OpenAIConfigValidationResult = {
  isValid: boolean;
  apiKeyPresent: boolean;
  apiKeyFormat: 'project' | 'unknown' | null;
  projectIdPresent: boolean;
  projectIdFormat: 'valid' | 'invalid' | null;
  diagnostics: string[];
  error?: string;
};

/**
 * Creates a properly configured OpenAI client using the available API key
 * @returns A new OpenAI client instance
 * @throws Error if the API key is not configured
 */
export function createOpenAIClient(): OpenAI {
  const apiKeyManager = ApiKeyManager.getInstance();
  const apiKey = apiKeyManager.getKeyValue('openai');
  const projectId = apiKeyManager.getProjectId('openai');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  // Create client config
  const config: OpenAIClientConfig = { 
    apiKey, 
    dangerouslyAllowBrowser: true 
  };
  
  // For Project API keys, add the Project ID if available
  if (apiKey.startsWith('sk-proj-') && projectId) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Using OpenAI Project ID: ${projectId.substring(0, 8)}...`);
    }
    config.projectId = projectId;
  } else if (apiKey.startsWith('sk-proj-') && !projectId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('WARNING: OpenAI Project API key used without Project ID');
    }
  }
  
  return new OpenAI(config);
}

/**
 * Validates the OpenAI configuration and provides detailed diagnostics
 * about the API key and project ID formats
 */
export function validateOpenAIConfig(): OpenAIConfigValidationResult {
  const apiKeyManager = ApiKeyManager.getInstance();
  const apiKey = apiKeyManager.getKeyValue('openai');
  const projectId = apiKeyManager.getProjectId('openai');
  const diagnostics: string[] = [];
  
  try {
    // Check API key presence
    const apiKeyPresent = !!apiKey;
    let apiKeyFormat: 'project' | 'unknown' | null = null;
    
    if (!apiKeyPresent) {
      diagnostics.push('OpenAI API key is not configured');
    } else {
      // Check API key format and length
      if (apiKey.startsWith('sk-proj-')) {
        apiKeyFormat = 'project';
        diagnostics.push(`Project API key detected (${apiKey.length} chars)`);
        
        // Project API keys can vary in length
        if (apiKey.length < 40) {
          diagnostics.push('WARNING: Project API key appears too short');
        }
      } else {
        apiKeyFormat = 'unknown';
        diagnostics.push(`Unknown API key format: ${apiKey.substring(0, 3)}...`);
      }
    }
    
    // Check Project ID (only matters for project API keys)
    const projectIdPresent = !!projectId;
    let projectIdFormat: 'valid' | 'invalid' | null = null;
    
    if (apiKeyFormat === 'project') {
      if (!projectIdPresent) {
        diagnostics.push('WARNING: Project API key used without Project ID');
        projectIdFormat = 'invalid';
      } else {
        // Check Project ID format
        if (projectId.startsWith('proj_')) {
          diagnostics.push(`Project ID format looks valid (${projectId.length} chars)`);
          projectIdFormat = 'valid';
        } else {
          diagnostics.push(`Project ID format unexpected: ${projectId.substring(0, 5)}...`);
          projectIdFormat = 'invalid';
        }
      }
    }
    
    // Determine overall validity
    const isValid = apiKeyPresent && 
      (apiKeyFormat === 'project' && projectIdPresent && projectIdFormat === 'valid');
    
    return {
      isValid,
      apiKeyPresent,
      apiKeyFormat,
      projectIdPresent,
      projectIdFormat,
      diagnostics
    };
  } catch (error) {
    return {
      isValid: false,
      apiKeyPresent: false,
      apiKeyFormat: null,
      projectIdPresent: false,
      projectIdFormat: null,
      diagnostics: ['Error validating OpenAI configuration'],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Creates a test client configuration for diagnostic purposes
 * Does not expose the actual API key
 */
export function getClientConfigInfo(): Omit<OpenAIClientConfig, 'apiKey'> & { apiKeyPresent: boolean } {
  const apiKeyManager = ApiKeyManager.getInstance();
  const apiKey = apiKeyManager.getKeyValue('openai');
  const projectId = apiKeyManager.getProjectId('openai');
  
  return {
    apiKeyPresent: !!apiKey,
    projectId: projectId || undefined,
    dangerouslyAllowBrowser: true
  };
} 