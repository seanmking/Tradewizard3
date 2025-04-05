/**
 * Utility functions for API key verification and management
 * Handles startup checks and logging for missing or invalid API keys
 */

interface APIKeyStatus {
  isConfigured: boolean;
  isValid: boolean;
  message: string;
}

interface APIKeyVerificationResult {
  allKeysValid: boolean;
  hsCodeApi: APIKeyStatus;
  witsApi: APIKeyStatus;
  openAiApi: APIKeyStatus;
  useMockData: boolean;
}

/**
 * Verifies the presence and basic format validity of API keys
 * @returns Detailed verification result with status for each API
 */
export function verifyApiKeys(): APIKeyVerificationResult {
  const timestamp = new Date().toISOString();
  const debugApiKeys = process.env.DEBUG_API_KEYS === 'true';
  const isClient = typeof window !== 'undefined';
  
  console.log(`[${timestamp}] 🔑 Verifying API key configuration... (${isClient ? 'CLIENT' : 'SERVER'})`);
  
  if (debugApiKeys) {
    console.log(`[${timestamp}] 🔧 Environment variables loaded:`, 
      Object.keys(process.env)
        .filter(key => !key.includes('API_KEY')) // Don't log actual API keys
        .map(key => `${key}=${process.env[key] ? 'set' : 'not set'}`)
    );
  }
  
  // Check HS Code API key
  const hsCodeApiKey = process.env.HS_CODE_API_KEY || process.env.NEXT_PUBLIC_HS_CODE_API_KEY;
  if (debugApiKeys) {
    console.log(`[${timestamp}] 🔍 HS_CODE_API_KEY: ${hsCodeApiKey ? `${hsCodeApiKey.substring(0, 5)}...` : 'undefined'}`);
    console.log(`[${timestamp}] 🔍 NEXT_PUBLIC_HS_CODE_API_KEY: ${process.env.NEXT_PUBLIC_HS_CODE_API_KEY ? 'set' : 'not set'}`);
  }
  
  const hsCodeStatus: APIKeyStatus = {
    isConfigured: !!hsCodeApiKey,
    isValid: !!hsCodeApiKey && hsCodeApiKey.length > 10,
    message: ''
  };
  
  if (!hsCodeStatus.isConfigured) {
    hsCodeStatus.message = 'HS Code API key not configured. Mock data will be used.';
    console.warn(`[${timestamp}] ⚠️ ${hsCodeStatus.message}`);
  } else if (!hsCodeStatus.isValid) {
    hsCodeStatus.message = 'HS Code API key appears to be invalid (too short).';
    console.warn(`[${timestamp}] ⚠️ ${hsCodeStatus.message}`);
  } else {
    hsCodeStatus.message = 'HS Code API key configured correctly.';
    console.log(`[${timestamp}] ✅ ${hsCodeStatus.message}`);
  }
  
  // Check WITS API key
  const witsApiKey = process.env.WITS_API_KEY || process.env.NEXT_PUBLIC_WITS_API_KEY;
  if (debugApiKeys) {
    console.log(`[${timestamp}] 🔍 WITS_API_KEY: ${witsApiKey ? `${witsApiKey.substring(0, 5)}...` : 'undefined'}`);
    console.log(`[${timestamp}] 🔍 NEXT_PUBLIC_WITS_API_KEY: ${process.env.NEXT_PUBLIC_WITS_API_KEY ? 'set' : 'not set'}`);
  }
  
  const witsStatus: APIKeyStatus = {
    isConfigured: !!witsApiKey,
    isValid: !!witsApiKey && witsApiKey.length > 10,
    message: ''
  };
  
  if (!witsStatus.isConfigured) {
    witsStatus.message = 'WITS API key not configured. Mock data will be used.';
    console.warn(`[${timestamp}] ⚠️ ${witsStatus.message}`);
  } else if (!witsStatus.isValid) {
    witsStatus.message = 'WITS API key appears to be invalid (too short).';
    console.warn(`[${timestamp}] ⚠️ ${witsStatus.message}`);
  } else {
    witsStatus.message = 'WITS API key configured correctly.';
    console.log(`[${timestamp}] ✅ ${witsStatus.message}`);
  }
  
  // Check OpenAI API key
  const openAiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (debugApiKeys) {
    console.log(`[${timestamp}] 🔍 OPENAI_API_KEY: ${openAiApiKey ? `${openAiApiKey.substring(0, 5)}...` : 'undefined'}`);
    console.log(`[${timestamp}] 🔍 NEXT_PUBLIC_OPENAI_API_KEY: ${process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'set' : 'not set'}`);
  }
  
  // Validate OpenAI API key - handle both standard and project formats
  const isValidOpenAIKey = (key: string): boolean => {
    // Project API key format: sk-proj-{proj-id}
    const isProjectKey = key.startsWith('sk-proj-');
    // Standard API key format: sk-{key}
    const isStandardKey = key.startsWith('sk-') && !isProjectKey;
    
    // Different length requirements for different key types
    if (isProjectKey) {
      return key.length >= 40; // Project keys are typically longer
    } else if (isStandardKey) {
      return key.length >= 30; // Standard keys have a minimum length
    }
    return false;
  };
  
  const openAiStatus: APIKeyStatus = {
    isConfigured: !!openAiApiKey,
    isValid: !!openAiApiKey && isValidOpenAIKey(openAiApiKey),
    message: ''
  };
  
  if (!openAiStatus.isConfigured) {
    openAiStatus.message = 'OpenAI API key not configured. AI features will be limited.';
    console.warn(`[${timestamp}] ⚠️ ${openAiStatus.message}`);
  } else if (!openAiStatus.isValid) {
    openAiStatus.message = 'OpenAI API key appears to be invalid (wrong format).';
    console.warn(`[${timestamp}] ⚠️ ${openAiStatus.message}`);
  } else {
    openAiStatus.message = 'OpenAI API key configured correctly.';
    console.log(`[${timestamp}] ✅ ${openAiStatus.message}`);
  }
  
  // Determine if we should use mock data
  const useMockData = 
    !hsCodeStatus.isValid || 
    !witsStatus.isValid || 
    process.env.USE_MOCK_DATA === 'true' ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  
  if (useMockData) {
    console.warn(`[${timestamp}] 🔄 Using mock data for some services. See banner in UI for details.`);
  } else {
    console.log(`[${timestamp}] ✅ Using real API data for all services.`);
  }
  
  // All keys valid only if all individual keys are valid
  const allKeysValid = hsCodeStatus.isValid && witsStatus.isValid && openAiStatus.isValid;
  
  return {
    allKeysValid,
    hsCodeApi: hsCodeStatus,
    witsApi: witsStatus,
    openAiApi: openAiStatus,
    useMockData
  };
}

/**
 * Get instructions for obtaining API keys
 * @returns Object with instructions for each API
 */
export function getApiKeyInstructions(): Record<string, string> {
  return {
    hsCodeApi: 
      'To obtain an HS Code API key, visit https://developer.trade.gov/hs-code-api.html and register for an account. ' +
      'The approval process typically takes 1-2 business days.',
    
    witsApi:
      'For WITS API access, go to https://wits.worldbank.org/API/Registration.html and register for developer credentials. ' +
      'For testing purposes, use "demo-api-key" as a temporary key with limited functionality.',
    
    openAiApi:
      'Create an OpenAI account at https://platform.openai.com and generate an API key from your account dashboard. ' +
      'Note that OpenAI API usage incurs charges based on token consumption.'
  };
} 