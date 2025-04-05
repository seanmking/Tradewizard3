# API Key Manager Implementation

This document summarizes the implementation of the centralized API key management system in TradeWizard 3.0.

## Overview

We've implemented a centralized API key management system to:

1. Securely manage API keys for various services (OpenAI, Perplexity, WITS, etc.)
2. Support both server-side and client-side contexts
3. Provide a consistent interface for accessing API keys and URLs across the application
4. Improve error handling for missing API keys

## Key Components

### 1. API Key Manager Class

**File:** `src/utils/api-key-manager.ts`

The API Key Manager follows a singleton pattern to ensure consistent key management across the application. It supports:

- Loading API keys from environment variables
- Supporting both server and client contexts with appropriate `NEXT_PUBLIC_` prefixes
- Providing getters for API keys and URLs
- Validating API keys

### 2. Environment Initialization

**File:** `src/utils/environment.ts`

This utility initializes environment variables and ensures they're properly loaded in both development and production environments.

### 3. Application Initialization

We've updated the application initialization process to properly set up the API key manager:

- **Server-side initialization:** `src/app/layout.tsx`
- **Client-side initialization:** `src/app/providers.tsx`

### 4. Service Updates

The following services have been updated to use the API Key Manager:

- `HSCodeTariffMCPService` (`src/mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.service.ts`)
- `IntelligenceMCPService` (already implemented)
- `LLMWebsiteExtractor` (`src/ai-agent/extractors/llm-website-extractor.ts`)

### 5. API Key Validation

**File:** `scripts/check-api-keys.js`

A utility script for checking the presence and validity of required API keys.

## Environment Template

**File:** `.env.local.template`

A template for the required environment variables, which includes:

```
# Core API Keys
OPENAI_API_KEY=sk-proj-your-key-here
PERPLEXITY_API_KEY=your-key-here
WITS_API_KEY=your-key-here
HS_CODE_API_KEY=your-key-here

# API Configuration URLs
OPENAI_API_URL=https://api.openai.com/v1
PERPLEXITY_API_URL=https://api.perplexity.ai
WITS_API_URL=https://wits.worldbank.org/API/V1/SDMX/V21/rest

# Application Settings
AI_MODEL_NAME=gpt-4-turbo-preview
AI_MODEL_MAX_TOKENS=16000
PERPLEXITY_MODEL=sonar-medium-online
ENABLE_CROSS_REFERENCING=true
```

## Usage Examples

### Accessing API Keys

```typescript
import { ApiKeyManager } from '@/utils/api-key-manager';

// Get the instance
const apiKeyManager = ApiKeyManager.getInstance();

// Get API keys
const openAiKey = apiKeyManager.getKeyValue('openai');
const witsKey = apiKeyManager.getKeyValue('wits');

// Get API URLs
const openAiUrl = apiKeyManager.getApiUrl('openai');
```

### API Key Validation

```typescript
// Validate API key presence
if (!apiKeyManager.getKeyValue('openai')) {
  console.warn('OpenAI API key not configured');
  // Handle missing key scenario
}
```

## Error Handling

The API Key Manager implementation improves error handling by:

1. Providing early warnings when API keys are missing
2. Supporting graceful fallbacks when possible
3. Giving clear error messages when keys are required but not available

## Next Steps

1. Continue updating any remaining services to use the API Key Manager
2. Consider implementing secure key rotation mechanisms
3. Add monitoring for API key usage and rate limits 