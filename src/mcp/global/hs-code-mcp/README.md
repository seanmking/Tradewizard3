# HS Code Classification Service

## Overview

This module provides comprehensive HS (Harmonized System) code classification services for product descriptions, integrating with the World Integrated Trade Solution (WITS) API and utilizing AI-powered classification techniques to provide accurate recommendations.

## Features

- **Multi-source Classification**: Combines keyword-based, embedding-based, and API-based classification methods
- **Confidence Scoring**: Provides confidence scores for classification results
- **Hierarchical Navigation**: Full support for the HS code hierarchy (chapters, headings, subheadings)
- **Caching**: Extensive caching mechanisms to improve performance and handle API limitations
- **Error Handling**: Robust error handling with fallback mechanisms
- **Rate Limiting**: Client-side rate limiting to comply with API usage limits
- **Product Examples**: Retrieval of product examples for each HS code

## Architecture

### Services

#### WITSAPIClient

The `WITSAPIClient` provides direct integration with the WITS API for querying HS code data:

```typescript
import { WITSAPIClient } from './wits-api-client';

const witsClient = new WITSAPIClient();

// Search for HS codes matching a description
const results = await witsClient.searchHSCodes('smartphone with touchscreen');

// Get product examples for a specific HS code
const examples = await witsClient.getProductExamples('851712');

// Get all HS chapters (2-digit level)
const chapters = await witsClient.getChapters();

// Get headings for a chapter (4-digit level)
const headings = await witsClient.getHeadings('85');

// Get subheadings for a heading (6-digit level)
const subheadings = await witsClient.getSubheadings('8517');
```

#### HsCodeMCPService

The `HsCodeMCPService` is the main entry point for classification services:

```typescript
import { HsCodeMCPService } from './hs-code-mcp.service';
import { HsClassificationRequest } from './hs-code.types';

const hsCodeService = new HsCodeMCPService();

// Classify a product
const request: HsClassificationRequest = {
  productDescription: 'smartphone with touchscreen and 5G capability',
  confidenceThreshold: 0.6, // Optional: minimum confidence threshold (0-1)
  maxResults: 5, // Optional: maximum number of results to return
  useCache: true // Optional: whether to use cached results
};

const classification = await hsCodeService.classifyProduct(request);

// Get classification options for UI
const options = await hsCodeService.getClassificationOptions(
  'laptop computer',
  'chapter' // or 'heading' or 'subheading'
);

// Get HS code hierarchy
const hierarchy = await hsCodeService.getHSCodeHierarchy();
```

## WITS API Integration

The WITS API integration is handled by the `WITSAPIClient` class, which includes:

### Authentication

The client uses API key authentication with the WITS API:

```typescript
this.apiKey = process.env.WITS_API_KEY || 'demo-api-key';
```

For production use, you must set the `WITS_API_KEY` environment variable to your actual API key.

### Rate Limiting

Client-side rate limiting is implemented to comply with API usage limits:

```typescript
this.requestLimit = Number(process.env.WITS_API_REQUEST_LIMIT) || 100; // Requests per window
this.requestWindowMs = Number(process.env.WITS_API_REQUEST_WINDOW_MS) || 60000; // 1 minute window
```

This prevents too many requests being sent in a short time period by delaying requests when the limit is reached.

### Error Handling & Retries

The client implements exponential backoff with jitter for retrying failed requests:

```typescript
// Retry failed requests with exponential backoff
const delay = Math.min(
  1000 * Math.pow(2, nextRetryCount) + Math.random() * 1000,
  30000 // Max 30 seconds
);
```

### Fallback Mechanisms

The service includes comprehensive fallback data for common HS codes in case the API is unavailable:

```typescript
// If API fails, use fallback data
return this.getFallbackChapters();
```

## Type Definitions

The service uses comprehensive type definitions for all aspects of the classification system:

```typescript
// Classification result
export interface HsClassificationResult {
  classifications: ClassificationMatch[];
  query: string;
  timestamp: string;
}

// Individual classification match
export interface ClassificationMatch {
  hsCode: string;
  description: string;
  confidence: number;
  source?: string;
  metadata?: {
    chapter: { code: string; name: string; description: string };
    heading: { code: string; name: string; description: string };
    subheading: { code: string; name: string; description: string };
    examples?: ProductExample[];
  };
}
```

## Integration with UI Components

The service is designed to integrate with the `EnhancedHSCodeClassification` React component:

```typescript
import { EnhancedHSCodeClassification } from '@/components/classification/EnhancedHSCodeClassification';
import { hsCodeMCPService } from '@/mcp/global/hs-code-mcp';

// In your React component
const MyComponent = () => {
  const handleClassificationComplete = (result: ClassificationMatch) => {
    console.log('Selected classification:', result);
  };

  return (
    <EnhancedHSCodeClassification
      productName="Smartphone"
      productDescription="Modern touchscreen mobile phone with 5G capability"
      onClassificationComplete={handleClassificationComplete}
    />
  );
};
```

## Testing

### Unit Tests

Unit tests for the service are located in the `__tests__` directory:

```bash
# Run all tests
npm test

# Run specific tests
npm test -- -t "HS Code MCP Service"
```

### Mock Implementation

A mock implementation is provided for testing in the `__mocks__` directory:

```typescript
import { WITSAPIClient } from '../__mocks__/wits-api-client';

// This will use the mock implementation during tests
```

### Integration Tests

Integration tests validate the end-to-end classification flow:

```typescript
test('should classify a product using multiple sources', async () => {
  // Setup
  const service = new HsCodeMCPService();
  
  // Execute
  const result = await service.classifyProduct({
    productDescription: 'smartphone with touchscreen',
  });
  
  // Verify
  expect(result.classifications.length).toBeGreaterThan(0);
  expect(result.classifications[0].hsCode).toBe('851712');
});
```

## Performance Considerations

### Caching

The service uses a sophisticated caching system to minimize API calls:

```typescript
// 24-hour TTL for cache entries
this.cache = new Cache<string, any>({
  ttl: 24 * 60 * 60 * 1000,
  maxSize: 1000
});
```

### Parallel Requests

For enhanced performance, the service batches and parallelizes requests where possible:

```typescript
// Process all enhancement steps in parallel
const [chapters, headings, subheadings, examples] = await Promise.all([
  this.getChapters(),
  this.getHeadings(chapterCode),
  this.getSubheadings(headingCode),
  this.getProductExamples(hsCode)
]);
```

## Dependencies

- `axios`: HTTP client for API calls
- `@/utils/cache`: Caching utility
- `@/services/classification/embeddingService`: Embedding-based classification
- `@/services/classification/productMapper`: Keyword-based classification

## Environment Variables

The following environment variables can be used to configure the service:

- `WITS_API_BASE_URL`: Base URL for the WITS API
- `WITS_API_KEY`: API key for authentication
- `WITS_API_MAX_RETRIES`: Maximum number of retry attempts
- `WITS_API_REQUEST_LIMIT`: Number of requests allowed in the rate limit window
- `WITS_API_REQUEST_WINDOW_MS`: Rate limit window duration in milliseconds

## HS Code Structure

HS codes follow a hierarchical structure:

- **Chapters** (2 digits): Broad product categories (e.g., 85 for electrical machinery)
- **Headings** (4 digits): More specific product groups (e.g., 8517 for telephones)
- **Subheadings** (6 digits): Specific product types (e.g., 851712 for smartphones)

## Error Handling Strategy

The service implements a comprehensive error handling strategy:

1. **First Level**: Try classification from multiple sources (keyword, vector, API)
2. **Second Level**: If one source fails, try others
3. **Third Level**: If all sources fail, return fallback classifications
4. **Logging**: Detailed error logging for debugging and monitoring

## API Rate Limiting

The service implements client-side rate limiting to comply with API usage limits:

```typescript
private async enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - this.lastRequestTimestamp;
  
  // Reset counter if outside window
  if (elapsed > this.requestWindowMs) {
    this.requestCounter = 0;
    this.lastRequestTimestamp = now;
  }
  
  // Check if we've reached the limit
  if (this.requestCounter >= this.requestLimit) {
    // Calculate time to wait before next request
    const timeToWait = this.requestWindowMs - elapsed;
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
      
      // Reset after waiting
      this.requestCounter = 0;
      this.lastRequestTimestamp = Date.now();
    }
  }
  
  // Increment counter
  this.requestCounter++;
}
```

## Future Enhancements

- **AI Training**: Periodically train the embedding model on new product data
- **Advanced Caching**: Distributed cache for high-availability environments
- **Analytics**: Track classification patterns for continuous improvement
- **Feedback Loop**: Incorporate user feedback to improve classification accuracy 