/**
 * Test OpenAI API authentication using direct axios calls
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testOpenAIAuthentication() {
  console.log('===== OpenAI API Authentication Test (Using Axios) =====');
  
  // Get credentials from environment
  const apiKey = process.env.OPENAI_API_KEY;
  const projectId = process.env.OPENAI_PROJECT_ID;
  
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY is not set');
    return false;
  }
  
  console.log(`API Key Type: ${apiKey.startsWith('sk-proj-') ? 'Project API Key' : 'Standard API Key'}`);
  console.log(`Project ID: ${projectId ? 'Set' : 'Not Set'}`);
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  // Add project ID header if using project API key
  if (apiKey.startsWith('sk-proj-') && projectId) {
    console.log('Adding OpenAI-Project header with ID:', projectId);
    headers['OpenAI-Project'] = projectId;
  }
  
  // Prepare request payload
  const data = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 10
  };
  
  console.log('\nRequest Headers:');
  console.log(JSON.stringify({
    ...headers,
    'Authorization': headers.Authorization.replace(/(Bearer\s+)[^.]+(.+)/, '$1[REDACTED]$2') 
  }, null, 2));
  
  console.log('\nSending test request to OpenAI API...');
  
  try {
    const startTime = Date.now();
    const response = await axios.post('https://api.openai.com/v1/chat/completions', data, { headers });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ API Call Successful! (${duration}s)`);
    console.log('Response:');
    console.log(response.data.choices[0].message);
    
    console.log('\nResponse Headers:');
    console.log(response.headers);
    
    return true;
  } catch (error) {
    console.error('\n❌ API Call Failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response Headers:');
      console.error(JSON.stringify(error.response.headers, null, 2));
      console.error('Response Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    console.error('\nTroubleshooting Tips:');
    console.error('1. Check that your API key is valid and not expired');
    console.error('2. If using a Project API key, verify your Project ID is correct');
    console.error('3. Ensure your OpenAI account has access to the requested model');
    console.error('4. Check your network connection');
    
    return false;
  }
}

// Run the test
testOpenAIAuthentication().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 