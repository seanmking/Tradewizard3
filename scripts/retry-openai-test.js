/**
 * Simple retest script to check for updated OpenAI API key
 */
require('dotenv').config({ path: '.env.local', override: true });
const axios = require('axios');

console.log('===== OpenAI API Key Recheck =====');

// Get the API key and project ID from environment 
const apiKey = process.env.OPENAI_API_KEY;
const projectId = process.env.OPENAI_PROJECT_ID;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY is not set in .env.local');
  process.exit(1);
}

// Display key information (safely)
const keyPrefix = apiKey.substring(0, 10);
const keySuffix = apiKey.substring(apiKey.length - 4);
console.log(`API Key: ${keyPrefix}...${keySuffix} (${apiKey.length} chars)`);

// Check if it's a project key
const isProjectKey = apiKey.startsWith('sk-proj-');
console.log(`Is Project API Key: ${isProjectKey ? 'Yes' : 'No'}`);

// Check project ID if it's a project key
if (isProjectKey) {
  if (projectId) {
    console.log(`Project ID: ${projectId.substring(0, 8)}...${projectId.substring(projectId.length - 4)} (${projectId.length} chars)`);
  } else {
    console.error('❌ WARNING: Using Project API key without Project ID');
  }
}

// Create headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`
};

// Add project ID header if available
if (isProjectKey && projectId) {
  headers['OpenAI-Project'] = projectId;
  console.log('✅ Added OpenAI-Project header');
}

// Simple request payload
const data = {
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello, this is a test' }],
  max_tokens: 10
};

console.log('\nSending test request...');

// Make the request
axios.post('https://api.openai.com/v1/chat/completions', data, { headers })
  .then(response => {
    console.log('\n✅ SUCCESS! API call worked!');
    console.log('Response:', response.data.choices[0].message);
  })
  .catch(error => {
    console.error('\n❌ API call failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Error details:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }); 