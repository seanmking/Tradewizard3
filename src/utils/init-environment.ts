/**
 * Initializes and harmonizes environment variables at startup
 */
function initializeEnvironment() {
  // Standardize OpenAI API key
  if (process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  } else if (!process.env.OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  }
  
  // Determine correct OpenAI API URL based on key format
  if (process.env.OPENAI_API_KEY) {
    const isProjectKey = process.env.OPENAI_API_KEY.startsWith('sk-proj-');
    const isNewProjectKey = process.env.OPENAI_API_KEY.startsWith('pt-');
    
    if (isProjectKey || isNewProjectKey) {
      process.env.AI_MODEL_URL = 'https://api.openai.com/v1/chat/completions';
    } else {
      process.env.AI_MODEL_URL = 'https://api.openai.com/v1/chat/completions';
    }
  }
  
  // Standardize WITS/HS Code API keys
  if (process.env.UN_COMTRADE_API_KEY) {
    if (!process.env.WITS_API_KEY) {
      process.env.WITS_API_KEY = process.env.UN_COMTRADE_API_KEY;
    }
    if (!process.env.HS_CODE_API_KEY) {
      process.env.HS_CODE_API_KEY = process.env.UN_COMTRADE_API_KEY;
    }
  }
  
  // Standardize API URLs
  if (!process.env.WITS_API_URL) {
    process.env.WITS_API_URL = 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data';
  }
  if (!process.env.HS_CODE_API_URL) {
    process.env.HS_CODE_API_URL = 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data';
  }
  
  console.info('Environment variables initialized and standardized');
}

// Run initialization
initializeEnvironment();

export default initializeEnvironment; 