export type ApiKeyType = 'openai' | 'wits' | 'perplexity' | 'hs-code';

interface ApiKeyConfig {
  keyValue: string;
  baseUrl: string;
  isProjectKey?: boolean;
  projectId?: string;
}

/**
 * Centralized API Key Manager for TradeWizard 3.0
 * Handles all API key validations, formatting, and endpoint determination
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private keys: Map<ApiKeyType, ApiKeyConfig> = new Map();
  
  private constructor() {
    this.initializeFromEnvironment();
  }
  
  /**
   * Get singleton instance of ApiKeyManager
   */
  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }
  
  /**
   * Initialize API keys from environment variables
   */
  private initializeFromEnvironment(): void {
    // Determine if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    
    // Initialize OpenAI API key - try NEXT_PUBLIC_ version for client-side
    const openaiKey = isBrowser 
      ? (process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '')
      : (process.env.OPENAI_API_KEY || '');
      
    if (openaiKey) {
      const isProjectKey = openaiKey.startsWith('sk-proj-');
      
      // Get project ID - important for Project API key authentication
      const projectId = isBrowser
        ? (process.env.NEXT_PUBLIC_OPENAI_PROJECT_ID || process.env.OPENAI_PROJECT_ID || '')
        : (process.env.OPENAI_PROJECT_ID || '');
      
      this.keys.set('openai', {
        keyValue: openaiKey,
        isProjectKey,
        projectId,
        baseUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'
      });
      
      console.info(`Initialized OpenAI API key (${isProjectKey ? 'Project' : 'Standard'} key)`);
      
      // Log a warning if using Project key without Project ID
      if (isProjectKey && !projectId) {
        console.warn('WARNING: Using OpenAI Project API key without a Project ID. API calls may fail. Set OPENAI_PROJECT_ID environment variable.');
      }
    } else {
      console.warn('OpenAI API key not configured');
    }
    
    // Initialize WITS API key - try NEXT_PUBLIC_ version for client-side
    const witsKey = isBrowser
      ? (process.env.NEXT_PUBLIC_WITS_API_KEY || process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY || '')
      : (process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY || '');
      
    if (witsKey) {
      this.keys.set('wits', {
        keyValue: witsKey,
        baseUrl: process.env.WITS_API_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data'
      });
      console.info('Initialized WITS API key');
    } else {
      console.warn('WITS API key not configured');
    }
    
    // Initialize HS-Code API key - same as WITS key in your case, with NEXT_PUBLIC_ for client-side
    const hsCodeKey = isBrowser
      ? (process.env.NEXT_PUBLIC_HS_CODE_API_KEY || process.env.NEXT_PUBLIC_WITS_API_KEY || process.env.HS_CODE_API_KEY || process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY || '')
      : (process.env.HS_CODE_API_KEY || process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY || '');
      
    if (hsCodeKey) {
      this.keys.set('hs-code', {
        keyValue: hsCodeKey,
        baseUrl: process.env.HS_CODE_API_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data'
      });
      console.info('Initialized HS Code API key');
    } else {
      console.warn('HS Code API key not configured');
    }
    
    // Initialize Perplexity API key - try NEXT_PUBLIC_ version for client-side
    const perplexityKey = isBrowser
      ? (process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY || '')
      : (process.env.PERPLEXITY_API_KEY || '');
      
    if (perplexityKey) {
      this.keys.set('perplexity', {
        keyValue: perplexityKey,
        baseUrl: process.env.PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions'
      });
      console.info('Initialized Perplexity API key');
    } else {
      console.warn('Perplexity API key not configured');
    }
  }
  
  /**
   * Get API key configuration
   */
  public getKey(keyType: ApiKeyType): ApiKeyConfig | undefined {
    return this.keys.get(keyType);
  }
  
  /**
   * Get API key value
   */
  public getKeyValue(keyType: ApiKeyType): string | null {
    return this.keys.get(keyType)?.keyValue || null;
  }
  
  /**
   * Get authorization headers for API calls
   */
  public getAuthHeaders(keyType: ApiKeyType): Record<string, string> {
    const keyConfig = this.keys.get(keyType);
    if (!keyConfig) {
      return {};
    }
    
    switch (keyType) {
      case 'openai':
        if (keyConfig.isProjectKey) {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyConfig.keyValue}`
          };
          
          // Add OpenAI-Project header if projectId is available
          if (keyConfig.projectId) {
            headers['OpenAI-Project'] = keyConfig.projectId;
            
            // For debugging in development
            if (process.env.NODE_ENV === 'development') {
              console.info('Using OpenAI Project authentication with OpenAI-Project header');
            }
          } else if (process.env.OPENAI_ORGANIZATION_ID) {
            // Fallback to organization ID if project ID is not available
            headers['OpenAI-Organization'] = process.env.OPENAI_ORGANIZATION_ID;
            
            // For debugging in development
            if (process.env.NODE_ENV === 'development') {
              console.info('Using OpenAI Project authentication with OpenAI-Organization fallback');
            }
          } else {
            // Log warning but continue with basic authentication
            console.warn('Using OpenAI Project key without Project ID or Organization ID. Authentication may fail.');
          }
          
          return headers;
        } else {
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyConfig.keyValue}`
          };
        }
        
      case 'perplexity':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyConfig.keyValue}`
        };
        
      case 'wits':
      case 'hs-code':
        return {
          'Content-Type': 'application/json',
          'Subscription-Key': keyConfig.keyValue
        };
        
      default:
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyConfig.keyValue}`
        };
    }
  }
  
  /**
   * Get API URL for a specific service
   */
  public getApiUrl(keyType: ApiKeyType): string {
    const keyConfig = this.keys.get(keyType);
    return keyConfig?.baseUrl || '';
  }

  /**
   * Get API key with fallback value if key is missing
   */
  public getKeyWithFallback(keyType: ApiKeyType, fallback: string = ''): string {
    const keyConfig = this.keys.get(keyType);
    return keyConfig?.keyValue || fallback;
  }

  /**
   * Check if API key exists without throwing an error
   */
  public hasKey(keyType: ApiKeyType): boolean {
    const keyConfig = this.keys.get(keyType);
    return !!keyConfig?.keyValue;
  }
  
  /**
   * Get Project ID for OpenAI Project API key
   */
  public getProjectId(keyType: ApiKeyType = 'openai'): string | null {
    const keyConfig = this.keys.get(keyType);
    return keyConfig?.projectId || null;
  }
  
  /**
   * Check if using Project API key
   */
  public isProjectKey(keyType: ApiKeyType = 'openai'): boolean {
    const keyConfig = this.keys.get(keyType);
    return !!keyConfig?.isProjectKey;
  }
  
  /**
   * Validate authentication configuration for a key type
   * Returns diagnostic information about any issues
   */
  public validateAuthConfig(keyType: ApiKeyType): { 
    valid: boolean; 
    errors: string[]; 
    warnings: string[] 
  } {
    const result = { valid: true, errors: [] as string[], warnings: [] as string[] };
    const keyConfig = this.keys.get(keyType);
    
    if (!keyConfig) {
      result.valid = false;
      result.errors.push(`No API key configured for ${keyType}`);
      return result;
    }
    
    if (!keyConfig.keyValue) {
      result.valid = false;
      result.errors.push(`Empty API key for ${keyType}`);
    }
    
    // OpenAI-specific validation
    if (keyType === 'openai') {
      if (keyConfig.isProjectKey && !keyConfig.projectId) {
        result.warnings.push('OpenAI Project key is missing a Project ID. API calls may fail.');
      }
      
      if (!keyConfig.isProjectKey && keyConfig.keyValue?.startsWith('sk-proj-')) {
        result.warnings.push('Key appears to be a Project key but is not marked as such. Check initialization.');
      }
    }
    
    return result;
  }
}

/**
 * Utility function to get API key manager
 */
export function getApiKeyManager(): ApiKeyManager {
  return ApiKeyManager.getInstance();
} 