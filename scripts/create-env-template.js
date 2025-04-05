/**
 * Generate a template for .env.local that can be manually filled in with new keys
 */
const fs = require('fs');
const path = require('path');

// Get current env file if it exists
let currentEnv = {};
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  console.log('Reading current .env.local file...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse existing values
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...values] = line.split('=');
      const value = values.join('='); // Handle values that might contain = characters
      currentEnv[key.trim()] = value.trim();
    }
  });
}

// Create a template
const template = `# API Keys - Generated on ${new Date().toISOString()}
# OpenAI
OPENAI_API_KEY=${currentEnv.OPENAI_API_KEY || 'REPLACE_WITH_NEW_PROJECT_API_KEY'}
NEXT_PUBLIC_OPENAI_API_KEY=${currentEnv.NEXT_PUBLIC_OPENAI_API_KEY || 'REPLACE_WITH_NEW_PROJECT_API_KEY'}
OPENAI_PROJECT_ID=${currentEnv.OPENAI_PROJECT_ID || 'REPLACE_WITH_NEW_PROJECT_ID'}
NEXT_PUBLIC_OPENAI_PROJECT_ID=${currentEnv.NEXT_PUBLIC_OPENAI_PROJECT_ID || 'REPLACE_WITH_NEW_PROJECT_ID'}
AI_MODEL_URL=${currentEnv.AI_MODEL_URL || 'https://api.openai.com/v1/chat/completions'}
AI_MODEL_NAME=${currentEnv.AI_MODEL_NAME || 'gpt-3.5-turbo'}

# Perplexity
PERPLEXITY_API_KEY=${currentEnv.PERPLEXITY_API_KEY || 'YOUR_PERPLEXITY_KEY'}
NEXT_PUBLIC_PERPLEXITY_API_KEY=${currentEnv.NEXT_PUBLIC_PERPLEXITY_API_KEY || 'YOUR_PERPLEXITY_KEY'}
PERPLEXITY_API_URL=${currentEnv.PERPLEXITY_API_URL || 'https://api.perplexity.ai'}
NEXT_PUBLIC_PERPLEXITY_API_URL=${currentEnv.NEXT_PUBLIC_PERPLEXITY_API_URL || 'https://api.perplexity.ai'}

# UN COMTRADE & WITS
UN_COMTRADE_API_KEY=${currentEnv.UN_COMTRADE_API_KEY || 'YOUR_UN_COMTRADE_KEY'}
HS_CODE_API_KEY=${currentEnv.HS_CODE_API_KEY || 'YOUR_HS_CODE_KEY'}
WITS_API_KEY=${currentEnv.WITS_API_KEY || 'YOUR_WITS_KEY'}
NEXT_PUBLIC_HS_CODE_API_KEY=${currentEnv.NEXT_PUBLIC_HS_CODE_API_KEY || 'YOUR_HS_CODE_KEY'}
NEXT_PUBLIC_WITS_API_KEY=${currentEnv.NEXT_PUBLIC_WITS_API_KEY || 'YOUR_WITS_KEY'}

# API URLs
HS_CODE_API_URL=${currentEnv.HS_CODE_API_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data'}
WITS_API_URL=${currentEnv.WITS_API_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data'}
WITS_API_BASE_URL=${currentEnv.WITS_API_BASE_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest/data/'}
WITS_TARIFF_URL=${currentEnv.WITS_TARIFF_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/'}
WITS_TRADESTATS_URL=${currentEnv.WITS_TRADESTATS_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/'}

# Other settings
NODE_ENV=${currentEnv.NODE_ENV || 'development'}
DEBUG_API_KEYS=${currentEnv.DEBUG_API_KEYS || 'true'}
NEXT_PUBLIC_DEBUG_API_KEYS=${currentEnv.NEXT_PUBLIC_DEBUG_API_KEYS || 'true'}
USE_MOCK_DATA=${currentEnv.USE_MOCK_DATA || 'false'}
NEXT_PUBLIC_USE_MOCK_DATA=${currentEnv.NEXT_PUBLIC_USE_MOCK_DATA || 'false'}`;

// Save new template
const templatePath = path.join(process.cwd(), '.env.local.template');
fs.writeFileSync(templatePath, template);

console.log(`Template saved to ${templatePath}`);
console.log('Please edit this file with your new API keys, then rename it to .env.local');
console.log('\nInstructions:');
console.log('1. Open the template file');
console.log('2. Replace REPLACE_WITH_NEW_PROJECT_API_KEY with your new OpenAI Project API key');
console.log('3. Replace REPLACE_WITH_NEW_PROJECT_ID with your OpenAI Project ID');
console.log('4. Save the file and rename it to .env.local');
console.log('5. Run node scripts/retry-openai-test.js to test your new key'); 