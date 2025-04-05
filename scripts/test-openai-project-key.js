/**
 * Test script to verify OpenAI Project API Key Authentication
 */
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testOpenAIProjectKey() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const projectId = process.env.OPENAI_PROJECT_ID;
  
  if (!openaiKey) {
    console.error('❌ ERROR: No OpenAI API key found in environment variables');
    process.exit(1);
  }
  
  console.log('====== OpenAI Project API Key Authentication Test ======');
  console.log(`Key format check: ${openaiKey.startsWith('sk-proj-') ? '✅ Project key' : '❌ Not a project key'}`);
  console.log(`Project ID: ${projectId ? '✅ Available' : '❌ Missing'}`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiKey}`,
  };
  
  if (projectId) {
    headers['OpenAI-Project'] = projectId;
    console.log('✅ Added OpenAI-Project header with value: ' + projectId);
  } else if (openaiKey.startsWith('sk-proj-')) {
    console.warn('⚠️ WARNING: Using Project API key without Project ID. Auth may fail.');
  }
  
  try {
    console.log('\nSending test request to OpenAI API...');
    console.log('Request headers:', JSON.stringify(headers, null, 2)
      .replace(new RegExp(openaiKey.substring(0, 10) + '.*?"', 'g'), '[API_KEY_REDACTED]"'));
    
    const startTime = Date.now();
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }]
      },
      { headers }
    );
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ SUCCESS! Response received in ${duration}ms:`);
    console.log('Content:', response.data.choices[0].message.content);
    console.log(`Model: ${response.data.model}`);
    console.log(`Prompt tokens: ${response.data.usage.prompt_tokens}`);
    console.log(`Completion tokens: ${response.data.usage.completion_tokens}`);
    
    return {
      success: true,
      duration,
      content: response.data.choices[0].message.content,
      model: response.data.model
    };
  } catch (error) {
    console.error('\n❌ ERROR:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
      
      // Provide specific guidance based on error type
      if (error.response.status === 401) {
        console.error('\nAuthentication Error Diagnosis:');
        if (openaiKey.startsWith('sk-proj-') && !projectId) {
          console.error('- You are using a Project API key without a Project ID');
          console.error('- Set OPENAI_PROJECT_ID in your .env.local file');
        } else {
          console.error('- Your API key may be invalid or expired');
          console.error('- Check your API key in the OpenAI dashboard');
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error('Network issue or API endpoint unreachable');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// Run the test and log the result
testOpenAIProjectKey()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ OpenAI Project API key authentication is working correctly!');
    } else {
      console.error('\n❌ OpenAI Project API key authentication failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 