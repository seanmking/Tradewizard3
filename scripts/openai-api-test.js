/**
 * Test script to verify OpenAI API call works with configured credentials
 */
require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');

async function testOpenAICall() {
  console.log('===== OpenAI API Call Test =====');
  console.log('Creating OpenAI client with configured credentials...');
  
  try {
    // Configure the client
    let config = { apiKey: process.env.OPENAI_API_KEY };
    
    if (process.env.OPENAI_API_KEY?.startsWith('sk-proj-') && process.env.OPENAI_PROJECT_ID) {
      console.log('Using Project API key with Project ID');
      config.projectId = process.env.OPENAI_PROJECT_ID;
    } else {
      console.log('Using standard API key');
    }
    
    const openai = new OpenAI(config);
    
    // Make a simple API call
    console.log('\nSending test API request...');
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ API Call Successful! (${duration}s)`);
    console.log('Response:');
    console.log(response.choices[0].message);
    
    console.log('\nFull API response metadata:');
    const { id, model, usage, created } = response;
    console.log({ id, model, usage, created });
    
    return true;
  } catch (error) {
    console.error('\n❌ API Call Failed:');
    console.error(`Error: ${error.message}`);
    
    if (error.response) {
      console.error('\nAPI Error Details:');
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers:`, error.response.headers);
      console.error(`Body:`, error.response.data);
    }
    
    console.error('\nTroubleshooting tips:');
    console.error('1. Check that your OPENAI_API_KEY is valid and not expired');
    console.error('2. If using Project API key, verify OPENAI_PROJECT_ID is correct');
    console.error('3. Ensure the model you\'re using is accessible with your account');
    
    return false;
  }
}

// Run the test
testOpenAICall().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 