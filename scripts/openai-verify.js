/**
 * Simple utility to verify OpenAI API configuration
 */
require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');

function getProjectApiHeaders(apiKey, projectId) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  
  if (projectId) {
    headers['OpenAI-Project'] = projectId;
  }
  
  return headers;
}

function checkKeyType(key) {
  if (!key) return '❌ Missing';
  if (key.startsWith('sk-proj-')) return '✅ Project Key';
  if (key.startsWith('sk-')) return '✅ Standard Key';
  if (key.startsWith('eyJhbGci')) return '❓ JWT Format (unusual)';
  return '❓ Unknown format';
}

console.log('===== OpenAI API Key Verification Tool =====');
console.log('Environment variables:');
console.log(`OPENAI_API_KEY: ${checkKeyType(process.env.OPENAI_API_KEY)}`);
console.log(`OPENAI_PROJECT_ID: ${process.env.OPENAI_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_OPENAI_API_KEY: ${checkKeyType(process.env.NEXT_PUBLIC_OPENAI_API_KEY)}`);
console.log(`NEXT_PUBLIC_OPENAI_PROJECT_ID: ${process.env.NEXT_PUBLIC_OPENAI_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
console.log('\nChecking OpenAI client configuration...');

// Create OpenAI client
try {
  let config = { apiKey: process.env.OPENAI_API_KEY };
  
  if (process.env.OPENAI_API_KEY?.startsWith('sk-proj-') && process.env.OPENAI_PROJECT_ID) {
    console.log('Adding project ID to configuration');
    config.projectId = process.env.OPENAI_PROJECT_ID;
  }
  
  const openai = new OpenAI(config);
  console.log('✅ OpenAI client created successfully');
  
  // Print full configuration for debugging (redacting sensitive info)
  console.log('\nConfiguration:');
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.apiKey) {
    safeConfig.apiKey = '[REDACTED]';
  }
  console.log(safeConfig);
  
  // Print authentication headers
  console.log('\nAuthentication headers that will be used:');
  const headers = getProjectApiHeaders(
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_PROJECT_ID
  );
  console.log(JSON.stringify(headers, null, 2).replace(/(Bearer\s+)[\w\-\.]+/g, '$1[REDACTED]'));
  
  console.log('\n✅ Configuration verification complete');
} catch (error) {
  console.error('\n❌ Error creating OpenAI client:', error.message);
} 