/**
 * Test script to compare standard and project API keys
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Configurable test variables - edit these based on what you want to test
const TEST_CONFIG = {
  // Set to true to test a standard API key, false to test the project key
  useStandardKey: true,
  
  // Optional: Provide a standard API key for testing (overrides env variable)
  standardApiKey: 'sk-...',  // Replace with a valid standard OpenAI API key if available
  
  // Optional: Provide a project ID for testing (overrides env variable)
  projectId: '',
  
  // Optional: Provide a project API key for testing (overrides env variable)
  projectApiKey: ''
};

async function testOpenAIKey() {
  console.log('===== OpenAI API Key Comparison Test =====');
  
  // Determine which key to use
  let apiKey;
  let projectId = TEST_CONFIG.projectId || process.env.OPENAI_PROJECT_ID;
  let isProjectKey = false;
  
  if (TEST_CONFIG.useStandardKey) {
    console.log('TESTING STANDARD API KEY');
    apiKey = TEST_CONFIG.standardApiKey || process.env.OPENAI_API_KEY;
    isProjectKey = false; // Force it to be treated as a standard key
  } else {
    console.log('TESTING PROJECT API KEY');
    apiKey = TEST_CONFIG.projectApiKey || process.env.OPENAI_API_KEY;
    isProjectKey = apiKey?.startsWith('sk-proj-');
  }
  
  if (!apiKey) {
    console.error('❌ Error: No API key available');
    return false;
  }
  
  // Mask key for display
  const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
  
  // Log config info
  console.log(`API Key: ${maskedKey}`);
  console.log(`API Key Type: ${isProjectKey ? 'Project Key' : 'Standard Key'}`);
  console.log(`Project ID: ${projectId ? 'Set' : 'Not Set'}`);
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  // Add project ID header if using project API key
  if (isProjectKey && projectId) {
    console.log('Adding OpenAI-Project header with ID:', projectId);
    headers['OpenAI-Project'] = projectId;
  }
  
  // Prepare request payload
  const data = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 10
  };
  
  console.log('\nSending test request to OpenAI API...');
  
  try {
    const startTime = Date.now();
    const response = await axios.post('https://api.openai.com/v1/chat/completions', data, { headers });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ API Call Successful! (${duration}s)`);
    console.log('Response:');
    console.log(response.data.choices[0].message);
    
    return true;
  } catch (error) {
    console.error('\n❌ API Call Failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return false;
  }
}

// Run the test
testOpenAIKey().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 