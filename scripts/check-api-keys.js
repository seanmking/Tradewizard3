// scripts/check-api-keys.js
require('dotenv').config({ path: '.env.local' });

console.log('API Key Checker for TradeWizard 3.0');
console.log('==================================\n');

function checkApiKey(name, envVarName) {
  const key = process.env[envVarName];
  console.log(`${name} API Key (${envVarName}):`);
  
  if (!key) {
    console.log('❌ NOT FOUND');
    console.log(`   Please set the ${envVarName} environment variable.`);
    return false;
  }
  
  console.log('✅ FOUND');
  
  if (name === 'OpenAI') {
    if (key.startsWith('sk-proj-')) {
      console.log('🔑 Project API Key Format (sk-proj-*) detected');
      
      const projectId = process.env.OPENAI_PROJECT_ID;
      if (!projectId) {
        console.log('⚠️ WARNING: OPENAI_PROJECT_ID not set. This may be required for project keys.');
      } else {
        console.log(`✅ Project ID: ${projectId}`);
      }
    } else if (key.startsWith('sk-')) {
      console.log('🔑 Standard API Key Format (sk-*) detected');
    } else {
      console.log('⚠️ WARNING: Unusual API key format. OpenAI keys should start with "sk-"');
    }
  }
  
  console.log('');
  return true;
}

const results = {
  openai: checkApiKey('OpenAI', 'OPENAI_API_KEY'),
  perplexity: checkApiKey('Perplexity', 'PERPLEXITY_API_KEY'),
  wits: checkApiKey('WITS', 'WITS_API_KEY') || checkApiKey('UN Comtrade', 'UN_COMTRADE_API_KEY')
};

console.log('Summary:');
console.log('========');
for (const [key, value] of Object.entries(results)) {
  console.log(`${key}: ${value ? '✅ OK' : '❌ MISSING/INVALID'}`);
}

if (!results.openai || !results.perplexity || !results.wits) {
  console.log('\n⚠️ Some API keys are missing or invalid. Please check your environment variables.');
} else {
  console.log('\n✅ All required API keys are present.');
} 