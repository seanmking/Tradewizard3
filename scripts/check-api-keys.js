#!/usr/bin/env node

/**
 * API Key Checker Script
 * Validates that all required API keys are present and properly formatted
 */

// Import dotenv to load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Count of valid and invalid keys
let validCount = 0;
let invalidCount = 0;

/**
 * Check if an API key exists and is properly formatted
 * @param {string} key - Environment variable name
 * @param {string} [format] - Regular expression pattern for validation
 * @param {string} [formatDesc] - Description of the expected format
 * @returns {boolean} - Whether the key is valid
 */
function checkApiKey(key, format, formatDesc) {
  const value = process.env[key];
  
  console.log(`\nChecking ${key}...`);
  
  if (!value) {
    console.log(`❌ ${key} is not set.`);
    invalidCount++;
    return false;
  }
  
  if (format && !new RegExp(format).test(value)) {
    console.log(`⚠️ ${key} is set but does not match the expected format.`);
    console.log(`   Expected format: ${formatDesc}`);
    invalidCount++;
    return false;
  }
  
  console.log(`✅ ${key} is set and valid.`);
  validCount++;
  return true;
}

// Check OpenAI API key
// Format: sk-... (for standard keys) or sk-proj-... (for project keys)
const openaiKeyValid = checkApiKey(
  'OPENAI_API_KEY',
  '^sk-(proj-)?[a-zA-Z0-9]{24,}$',
  'sk-... (standard key) or sk-proj-... (project key)'
);

if (openaiKeyValid) {
  // Check if it's a project key, and if so, if project ID is present
  if (process.env.OPENAI_API_KEY.startsWith('sk-proj-') && !process.env.OPENAI_PROJECT_ID) {
    console.log('⚠️ Using a project key but OPENAI_PROJECT_ID is not set.');
    console.log('   Project keys work best with a project ID for proper request routing.');
  }
}

// Check Perplexity API key
// Format: pplx-...
checkApiKey(
  'PERPLEXITY_API_KEY',
  '^pplx-[a-zA-Z0-9]{24,}$',
  'pplx-...'
);

// Check WITS API key
// Either WITS_API_KEY or UN_COMTRADE_API_KEY should be present
let witsKeyValid = checkApiKey('WITS_API_KEY');

// If WITS_API_KEY is not valid, check for UN_COMTRADE_API_KEY as fallback
if (!witsKeyValid) {
  witsKeyValid = checkApiKey('UN_COMTRADE_API_KEY');
  
  if (witsKeyValid) {
    console.log('ℹ️ Using UN_COMTRADE_API_KEY as a fallback for WITS API access.');
  }
}

// Summary
console.log('\n=== API Key Check Summary ===');
console.log(`✅ Valid keys: ${validCount}`);
console.log(`❌ Missing/invalid keys: ${invalidCount}`);

if (invalidCount > 0) {
  console.log('\n⚠️ Some API keys are missing or invalid. Check your .env.local file.');
  console.log('   Copy values from .env.local.template and replace with your actual API keys.');
  process.exit(1);
} else {
  console.log('\n✅ All required API keys are present and valid!');
  process.exit(0);
} 