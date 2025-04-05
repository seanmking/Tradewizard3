/**
 * Test script to examine and potentially fix API key format issues
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get API key and Project ID
const rawApiKey = process.env.OPENAI_API_KEY || '';
const rawProjectId = process.env.OPENAI_PROJECT_ID || '';

console.log('===== OpenAI API Key Format Test =====');

// Analyze and try to fix possible issues with the API key
function analyzeKey(key) {
  console.log(`Original key length: ${key.length} characters`);
  
  // Check for whitespace
  const trimmedKey = key.trim();
  if (trimmedKey.length !== key.length) {
    console.log(`Found whitespace! Trimmed key length: ${trimmedKey.length} characters`);
    return trimmedKey;
  }
  
  // If key is unusually long, try extracting just the key portion
  if (trimmedKey.length > 51 && trimmedKey.includes('sk-proj-')) {
    const startIndex = trimmedKey.indexOf('sk-proj-');
    if (startIndex > 0) {
      // There's text before the key
      const extractedKey = trimmedKey.substring(startIndex);
      console.log(`Found text before key! Extracted: ${extractedKey.substring(0, 10)}...`);
      console.log(`Extracted key length: ${extractedKey.length} characters`);
      return extractedKey;
    }
  }
  
  return trimmedKey;
}

// Process the API key
const processedKey = analyzeKey(rawApiKey);
const keyPrefix = processedKey.substring(0, 10);
const keySuffix = processedKey.substring(processedKey.length - 4);

console.log(`\nProcessed key: ${keyPrefix}...${keySuffix}`);
console.log(`Final key length: ${processedKey.length} characters`);

// Process the Project ID
const trimmedProjectId = rawProjectId.trim();
console.log(`\nProject ID: ${trimmedProjectId.substring(0, 8)}...${trimmedProjectId.substring(trimmedProjectId.length - 4)}`);
console.log(`Project ID length: ${trimmedProjectId.length} characters`);

// Set up headers for the request
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${processedKey}`
};

// Add Project ID header
if (trimmedProjectId) {
  headers['OpenAI-Project'] = trimmedProjectId;
}

// Prepare request data
const data = {
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Say hello' }],
  max_tokens: 5
};

console.log('\nSending request with processed key...');

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
      
      // Try to provide more helpful error information
      if (error.response.status === 401) {
        console.error('Authentication failed. Possible issues:');
        console.error('1. The API key may be invalid or revoked');
        console.error('2. The Project ID may be incorrect or not associated with this key');
        console.error('3. The account may have billing issues or usage restrictions');
      }
      
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }); 