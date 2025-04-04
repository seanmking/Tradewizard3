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
    // Initialize OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (openaiKey) {
      const isProjectKey = openaiKey.startsWith('sk-proj-');
      const projectId = process.env.OPENAI_PROJECT_ID || '';
      
      this.keys.set('openai', {
        keyValue: openaiKey,
        isProjectKey,
        projectId,
        baseUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'
      });
      
      console.info(`Initialized OpenAI API key (${isProjectKey ? 'Project' : 'Standard'} key)`);
    } else {
      console.warn('OpenAI API key not configured');
    }
    
    // Initialize WITS API key
    const witsKey = process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY || '';
    if (witsKey) {
      this.keys.set('wits', {
        keyValue: witsKey,
        baseUrl: process.env.WITS_API_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data'
      });
      console.info('Initialized WITS API key');
    } else {
      console.warn('WITS API key not configured');
    }
    
    // Initialize HS-Code API key (same as WITS key in your case)
    const hsCodeKey = process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY || '';
    if (hsCodeKey) {
      this.keys.set('hs-code', {
        keyValue: hsCodeKey,
        baseUrl: process.env.HS_CODE_API_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data'
      });
      console.info('Initialized HS Code API key');
    } else {
      console.warn('HS Code API key not configured');
    }
    
    // Initialize Perplexity API key
    const perplexityKey = process.env.PERPLEXITY_API_KEY || '';
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
}

/**
 * Utility function to get API key manager
 */
export function getApiKeyManager(): ApiKeyManager {
  return ApiKeyManager.getInstance();
} 