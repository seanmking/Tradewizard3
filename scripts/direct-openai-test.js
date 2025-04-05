/**
 * Minimal OpenAI API key verification test
 * This script makes a direct API call without using any application code
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get and verify the API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;
const projectId = process.env.OPENAI_PROJECT_ID;

console.log('===== Direct OpenAI API Key Test =====');

// Check if key exists
if (!apiKey) {
  console.error('❌ ERROR: OPENAI_API_KEY is not set in .env.local');
  process.exit(1);
}

// Analyze key format and length
const trimmedKey = apiKey.trim();
const keyPrefix = trimmedKey.substring(0, 10);
const keySuffix = trimmedKey.substring(trimmedKey.length - 4);
console.log(`API Key format: ${keyPrefix}...${keySuffix}`);
console.log(`API Key length: ${trimmedKey.length} characters`);
console.log(`Using environment variable: OPENAI_API_KEY`);

// Check if key format matches expected pattern for Project API keys
if (!trimmedKey.startsWith('sk-proj-')) {
  console.error('❌ ERROR: API key does not start with "sk-proj-" (Project API key format)');
}

// Verify Project ID
if (!projectId) {
  console.error('❌ ERROR: OPENAI_PROJECT_ID is not set in .env.local');
} else {
  const trimmedProjectId = projectId.trim();
  console.log(`Project ID format: ${trimmedProjectId.substring(0, 8)}...${trimmedProjectId.substring(trimmedProjectId.length - 4)}`);
  console.log(`Project ID length: ${trimmedProjectId.length} characters`);
}

// Prepare request headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${trimmedKey}`
};

// Add Project ID header
if (projectId) {
  headers['OpenAI-Project'] = projectId.trim();
  console.log('Added OpenAI-Project header with Project ID');
}

console.log('\nHeaders being sent (partial):');
console.log(JSON.stringify({
  ...headers,
  'Authorization': 'Bearer sk-proj-****'
}, null, 2));

// Make the simplest possible request
const data = {
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Say hello' }],
  max_tokens: 5
};

console.log('\nSending test request to OpenAI API...');

// Make the request
axios.post('https://api.openai.com/v1/chat/completions', data, { headers })
  .then(response => {
    console.log('\n✅ API Call Successful!');
    console.log('Response:', response.data.choices[0].message);
  })
  .catch(error => {
    console.error('\n❌ API Call Failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }); 