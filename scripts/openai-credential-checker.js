/**
 * OpenAI Credential Format Checker
 * 
 * This utility performs a detailed validation of OpenAI API credentials
 * without making any actual API calls. It checks format, length, and other
 * properties of the credentials to help diagnose issues.
 */
require('dotenv').config({ path: '.env.local' });

// Helper to mask parts of sensitive values
function maskValue(value, revealStart = 4, revealEnd = 4) {
  if (!value) return '(not set)';
  if (value.length <= revealStart + revealEnd) return value;
  
  const start = value.substring(0, revealStart);
  const end = value.substring(value.length - revealEnd);
  const maskedLength = value.length - revealStart - revealEnd;
  const masked = '*'.repeat(Math.min(maskedLength, 20));
  
  return `${start}${masked}${end} (${value.length} chars)`;
}

// Check if a string is valid base64
function isValidBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

console.log('===== OpenAI Credential Format Checker =====\n');

// Get credentials from environment
const standardApiKey = process.env.OPENAI_API_KEY;
const projectId = process.env.OPENAI_PROJECT_ID;
const publicApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const publicProjectId = process.env.NEXT_PUBLIC_OPENAI_PROJECT_ID;

// Check Standard API Key
console.log('OPENAI_API_KEY:');
if (!standardApiKey) {
  console.log('❌ Not set');
} else {
  console.log(`Value: ${maskValue(standardApiKey)}`);
  
  // Check format
  if (standardApiKey.startsWith('sk-')) {
    if (standardApiKey.startsWith('sk-proj-')) {
      console.log('✅ Format: Project API Key (starts with sk-proj-)');
      
      // Project keys should be 51 characters
      if (standardApiKey.length === 51) {
        console.log('✅ Length: 51 characters (correct)');
      } else {
        console.log(`❌ Length: ${standardApiKey.length} characters (expected 51)`);
      }
    } else {
      console.log('✅ Format: Standard API Key (starts with sk-)');
      
      // Standard keys are usually 51 characters
      if (standardApiKey.length === 51) {
        console.log('✅ Length: 51 characters (correct)');
      } else {
        console.log(`❓ Length: ${standardApiKey.length} characters (expected 51)`);
      }
    }
  } else {
    console.log(`❓ Unknown format: ${standardApiKey.substring(0, 3)}...`);
  }
}

// Check Project ID
console.log('\nOPENAI_PROJECT_ID:');
if (!projectId) {
  console.log('❌ Not set');
} else {
  console.log(`Value: ${maskValue(projectId, 8, 8)}`);
  
  // Check format (project IDs usually start with "proj_")
  if (projectId.startsWith('proj_')) {
    console.log('✅ Format: Starts with "proj_" (correct)');
  } else {
    console.log(`❓ Format: Does not start with "proj_" (unusual)`);
  }
  
  // Project IDs are usually 27 characters
  if (projectId.length === 27) {
    console.log('✅ Length: 27 characters (correct)');
  } else {
    console.log(`❓ Length: ${projectId.length} characters (expected 27)`);
  }
}

// Check public variants
console.log('\nNEXT_PUBLIC_OPENAI_API_KEY:');
console.log(publicApiKey ? `Value: ${maskValue(publicApiKey)}` : '❌ Not set');

console.log('\nNEXT_PUBLIC_OPENAI_PROJECT_ID:');
console.log(publicProjectId ? `Value: ${maskValue(publicProjectId)}` : '❌ Not set');

// Final assessment
console.log('\n===== Analysis =====');

if (standardApiKey && standardApiKey.startsWith('sk-proj-') && projectId) {
  console.log('✅ You have both a Project API Key and Project ID configured');
  console.log('   This is the correct configuration for using OpenAI projects');
} else if (standardApiKey && !standardApiKey.startsWith('sk-proj-')) {
  console.log('ℹ️ You have a Standard API Key configured (not a Project key)');
  console.log('   This should work, but won\'t use project features');
} else if (standardApiKey && standardApiKey.startsWith('sk-proj-') && !projectId) {
  console.log('❌ You have a Project API Key but NO Project ID configured');
  console.log('   This will cause authentication failures!');
  console.log('   Please set the OPENAI_PROJECT_ID environment variable');
} else if (!standardApiKey) {
  console.log('❌ No API key configured!');
  console.log('   Please set the OPENAI_API_KEY environment variable');
} 