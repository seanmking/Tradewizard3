'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import { AssessmentProvider } from '@/contexts/assessment-context';
import { MockDataProvider } from '@/contexts/mock-data-context';
// Import our initialization utilities
import initializeEnvironment from '@/utils/init-environment';
import { ApiKeyManager } from '@/utils/api-key-manager';

// Initialize API key manager
ApiKeyManager.getInstance();

// Apply correct API endpoint based on key format - runs at app startup
const configureApiEndpoints = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
  
  if (apiKey) {
    // Determine the correct endpoint based on API key format
    const isProjectKey = apiKey.startsWith('sk-proj-');
    const correctEndpoint = isProjectKey 
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    // Directly set environment variables in runtime memory
    if (typeof window !== 'undefined') {
      // Client-side
      (window as any).AI_MODEL_URL = correctEndpoint;
      (window as any).OPENAI_API_URL = correctEndpoint;
    } else {
      // Server-side
      process.env.AI_MODEL_URL = correctEndpoint;
      process.env.OPENAI_API_URL = correctEndpoint;
    }
    
    console.info(`API configured: Using ${isProjectKey ? 'Project' : 'Standard'} endpoint: ${correctEndpoint}`);
  }
};

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize environment and API key manager on client-side
    initializeEnvironment();
    const apiKeyManager = ApiKeyManager.getInstance();
    
    // Log API key status for debugging
    console.info('API Keys Status (client-side):');
    console.info(`- OpenAI API Key: ${apiKeyManager.hasKey('openai') ? 'Available' : 'Not found'}`);
    console.info(`- Perplexity API Key: ${apiKeyManager.hasKey('perplexity') ? 'Available' : 'Not found'}`);
    console.info(`- WITS API Key: ${apiKeyManager.hasKey('wits') ? 'Available' : 'Not found'}`);
    console.info(`- HS Code API Key: ${apiKeyManager.hasKey('hs-code') ? 'Available' : 'Not found'}`);
    
    // Configure API endpoints if needed
    if (apiKeyManager.hasKey('openai')) {
      const openAiKey = apiKeyManager.getKeyValue('openai') || '';
      const isProjectKey = openAiKey.startsWith('sk-proj-');
      const correctEndpoint = 'https://api.openai.com/v1/chat/completions';
      
      console.info(`Using OpenAI ${isProjectKey ? 'Project' : 'Standard'} key with endpoint: ${correctEndpoint}`);
    }
    
    console.info('Client-side initialization complete');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MockDataProvider>
        <AssessmentProvider>
          {children}
        </AssessmentProvider>
      </MockDataProvider>
    </ThemeProvider>
  );
} 