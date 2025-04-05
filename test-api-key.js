// Test script to check the OpenAI API key used in the application

// Import environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Show the key in a partially redacted format for security
const apiKey = process.env.OPENAI_API_KEY || 'not set';
const modelName = process.env.AI_MODEL_NAME || 'not set';
const apiUrl = process.env.AI_MODEL_URL || 'not set';

// Function to partially mask the API key for display
function maskKey(key) {
  if (!key || key === 'not set') return key;
  const firstSix = key.substring(0, 8);
  const lastFour = key.substring(key.length - 4);
  const maskedPortion = '*'.repeat(key.length - 12);
  return `${firstSix}${maskedPortion}${lastFour}`;
}

console.log('\n===== ENVIRONMENT VARIABLES =====');
console.log(`API Key: ${maskKey(apiKey)}`);
console.log(`Model name: ${modelName}`);
console.log(`API URL: ${apiUrl}`);
console.log('================================\n');

// Check if this is a project key or standard key format
if (apiKey.startsWith('sk-proj-')) {
  console.log('This is a PROJECT key format');
  console.log('Expected URL: https://api.chatgpt.com/chat/completions');
  if (apiUrl.includes('api.chatgpt.com')) {
    console.log('✅ URL is correctly configured for project key');
  } else {
    console.log('❌ URL is incorrectly configured for project key');
  }
} else if (apiKey.startsWith('sk-')) {
  console.log('This is a STANDARD key format');
  console.log('Expected URL: https://api.openai.com/v1/chat/completions');
  if (apiUrl.includes('api.openai.com')) {
    console.log('✅ URL is correctly configured for standard key');
  } else {
    console.log('❌ URL is incorrectly configured for standard key');
  }
} else {
  console.log('⚠️ Unknown key format or no key provided');
} 