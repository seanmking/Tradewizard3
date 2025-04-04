/**
 * Environment variable standardization utility for TradeWizard 3.0
 * Ensures consistent application behavior across environments
 */

/**
 * Initialize and standardize environment variables for consistent application behavior
 */
export function initializeEnvironment(): void {
  // Default values
  const defaults = {
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    PERPLEXITY_API_URL: 'https://api.perplexity.ai/chat/completions',
    WITS_API_URL: 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data',
    LOG_LEVEL: 'info',
    APP_VERSION: '3.0.0',
    ENABLE_MOCK_DATA: 'false',
  };
  
  // Apply default values if not already set
  Object.entries(defaults).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
  
  // Normalize the WITS API key - allow UN_COMTRADE_API_KEY as an alternative
  if (!process.env.WITS_API_KEY && process.env.UN_COMTRADE_API_KEY) {
    process.env.WITS_API_KEY = process.env.UN_COMTRADE_API_KEY;
  }
  
  console.info('Environment variables initialized and standardized');
}

export default initializeEnvironment; 