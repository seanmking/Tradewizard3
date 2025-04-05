/**
 * Test script to verify OpenAI Project API Key Authentication using the official SDK
 */
require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');

async function testOpenAIWithSdk() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const projectId = process.env.OPENAI_PROJECT_ID;
  
  if (!openaiKey) {
    console.error('❌ ERROR: No OpenAI API key found in environment variables');
    process.exit(1);
  }
  
  console.log('====== OpenAI Project API Key Authentication Test (SDK) ======');
  console.log(`Key format check: ${openaiKey.startsWith('sk-proj-') ? '✅ Project key' : '❌ Not a project key'}`);
  console.log(`Project ID: ${projectId ? '✅ Available' : '❌ Missing'}`);
  
  // Create an instance of the OpenAI Client
  console.log('\nInitializing OpenAI client...');
  
  // Create configuration for OpenAI client
  const config = {
    apiKey: openaiKey,
    dangerouslyAllowBrowser: true,
  };
  
  // Add project ID if available (for Project API keys)
  if (projectId) {
    config.projectId = projectId;
    console.log('✅ Added project ID to OpenAI client config');
  }
  
  // Initialize the client with config
  const openai = new OpenAI(config);
  
  try {
    console.log('\nSending test request to OpenAI API...');
    
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }]
    });
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ SUCCESS! Response received in ${duration}ms:`);
    console.log('Content:', response.choices[0].message.content);
    console.log(`Model: ${response.model}`);
    console.log(`Prompt tokens: ${response.usage.prompt_tokens}`);
    console.log(`Completion tokens: ${response.usage.completion_tokens}`);
    
    return {
      success: true,
      duration,
      content: response.choices[0].message.content,
      model: response.model
    };
  } catch (error) {
    console.error('\n❌ ERROR:');
    
    if (error.response) {
      console.error(`Status: ${error.status}`);
      console.error('Error type:', error.type);
      console.error('Error message:', error.message);
      
      if (error.status === 401) {
        console.error('\nAuthentication Error Diagnosis:');
        if (openaiKey.startsWith('sk-proj-') && !projectId) {
          console.error('- You are using a Project API key without a Project ID');
          console.error('- Set OPENAI_PROJECT_ID in your .env.local file');
        } else {
          console.error('- Your API key may be invalid or expired');
          console.error('- Check your API key in the OpenAI dashboard');
        }
      }
    } else {
      console.error('Error:', error.message);
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Run the test and log the result
testOpenAIWithSdk()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ OpenAI Project API key authentication is working correctly with SDK!');
    } else {
      console.error('\n❌ OpenAI Project API key authentication failed with SDK!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 