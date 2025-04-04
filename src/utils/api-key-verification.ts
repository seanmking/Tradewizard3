/**
 * Client-side API key verification utility
 * Performs basic verification of API keys for client-side components
 */

// Utility function to format timestamps
const formatTimestamp = () => {
  return new Date().toISOString();
};

// Log with timestamp
const log = (message: string) => {
  console.log(`[${formatTimestamp()}] ${message}`);
};

/**
 * Verify if an API key is present and valid
 * @param key The environment variable name for the API key
 * @param pattern Optional regex pattern to validate the key format
 * @returns boolean indicating if the key is valid
 */
export const verifyApiKey = (key: string, pattern?: RegExp): boolean => {
  const value = process.env[key];
  
  if (!value) {
    return false;
  }
  
  if (pattern && !pattern.test(value)) {
    return false;
  }
  
  return true;
};

/**
 * Verify all required API keys for the application
 * @returns Object with verification results
 */
export const verifyApiKeysConfiguration = () => {
  log('🔑 Verifying API key configuration... (CLIENT)');
  
  // Results object
  const results = {
    openaiValid: false,
    witsValid: false,
    hsCodeValid: false,
    perplexityValid: false,
    allValid: false
  };
  
  // Check HS Code API key
  // This is the same as WITS API key in most configurations
  const hsCodeApiKey = process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY;
  results.hsCodeValid = !!hsCodeApiKey;
  
  if (results.hsCodeValid) {
    log('✅ HS Code API key configured correctly.');
  } else {
    log('❌ HS Code API key not configured.');
  }
  
  // Check WITS API key
  const witsApiKey = process.env.WITS_API_KEY || process.env.UN_COMTRADE_API_KEY;
  results.witsValid = !!witsApiKey;
  
  if (results.witsValid) {
    log('✅ WITS API key configured correctly.');
  } else {
    log('❌ WITS API key not configured.');
  }
  
  // Check OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiKeyPattern = /^sk-(proj-)?[a-zA-Z0-9]{24,}$/;
  results.openaiValid = !!openaiApiKey && openaiKeyPattern.test(openaiApiKey);
  
  if (results.openaiValid) {
    log('✅ OpenAI API key configured correctly.');
  } else if (openaiApiKey) {
    log('⚠️ OpenAI API key present but format may be incorrect.');
  } else {
    log('❌ OpenAI API key not configured.');
  }
  
  // Check Perplexity API key (optional)
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  const perplexityKeyPattern = /^pplx-[a-zA-Z0-9]{24,}$/;
  results.perplexityValid = !perplexityApiKey || perplexityKeyPattern.test(perplexityApiKey);
  
  // Set overall result
  results.allValid = results.openaiValid && results.witsValid && results.hsCodeValid;
  
  // Log summary
  if (results.allValid) {
    log('✅ Using real API data for all services.');
  } else {
    log('⚠️ Some API keys are missing - using mock data for affected services.');
  }
  
  return results;
};

export default verifyApiKeysConfiguration; 