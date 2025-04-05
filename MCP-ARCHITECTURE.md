# Model Context Protocol (MCP) Architecture

## Overview

Model Context Protocols (MCPs) form the backbone of TradeWizard 3.0's data integration layer. They provide a consistent interface for accessing various data sources and services while maintaining separation of concerns and enabling easy extensibility.

## Core Concepts

### What is an MCP?

An MCP (Model Context Protocol) is an abstraction layer that:

1. Encapsulates the logic for interacting with a specific data source or service
2. Provides a standardized interface for the rest of the application
3. Handles authentication, rate limiting, and error recovery
4. Implements caching strategies for improved performance
5. Offers fallback mechanisms when primary data sources are unavailable

### MCP Types

TradeWizard 3.0 implements two main types of MCPs:

1. **Global MCPs**: Services that provide data applicable across all markets
2. **Country-Specific MCPs**: Services tailored to specific target markets

## Implementation Structure

Each MCP follows a standard structure:

```
src/mcp/
├── global/
│   ├── hscode-tariff-mcp/
│   │   ├── hscode-tariff-mcp.service.ts
│   │   ├── hscode-tariff-mcp.interface.ts
│   │   └── hscode-tariff-mcp.types.ts
│   ├── compliance-mcp/
│   └── market-intelligence-mcp/
├── country/
│   ├── uk/
│   │   ├── uk-hscode-mcp/
│   │   ├── uk-compliance-mcp/
│   │   └── uk-market-mcp/
│   └── uae/
│       ├── uae-hscode-mcp/
│       ├── uae-compliance-mcp/
│       └── uae-market-mcp/
└── mcp.types.ts
```

## Interface Standards

Each MCP implements a standard interface pattern:

```typescript
export interface HSCodeTariffMCPService {
  searchHSCode(query: string): Promise<HSCodeSearchResult[]>;
  getTariffInfo(hsCode: string, originCountry: string, destinationCountry: string): Promise<TariffInfo>;
  getHSCodeDetails(hsCode: string): Promise<HSCodeDetails>;
}
```

## Example Implementation

```typescript
@Injectable()
export class HSCodeTariffMCPServiceImpl implements HSCodeTariffMCPService {
  private readonly cacheService: CacheService;
  private readonly apiKey: string;
  
  constructor(
    cacheService: CacheService,
    configService: ConfigService,
  ) {
    this.cacheService = cacheService;
    this.apiKey = configService.get<string>('HS_CODE_API_KEY');
  }
  
  async searchHSCode(query: string): Promise<HSCodeSearchResult[]> {
    const cacheKey = `hscode_search:${query}`;
    
    // Try to get from cache first
    const cachedResult = await this.cacheService.get<HSCodeSearchResult[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Call external API
      const response = await axios.get(`https://api.example.com/hscode/search`, {
        params: { query, apiKey: this.apiKey }
      });
      
      const results = response.data.results;
      
      // Cache the results
      await this.cacheService.set(cacheKey, results, 3600); // Cache for 1 hour
      
      return results;
    } catch (error) {
      console.error('Error searching HS Code:', error);
      
      // Implement fallback mechanism
      return this.getFallbackHSCodeResults(query);
    }
  }
  
  // Implementation of other methods...
}
```

## Error Handling Strategy

MCPs implement a comprehensive error handling strategy:

1. **Primary API Failure**: Attempt to use cached data
2. **Cache Miss**: Attempt to use fallback data sources
3. **All Sources Fail**: Return a standardized error response

## Caching Strategy

MCPs use a multi-level caching strategy:

1. **In-memory Cache**: For high-frequency requests
2. **Persistent Cache**: For data with longer validity periods
3. **Time-To-Live (TTL)**: Configurable by data type

## Integration with Application Services

MCPs are consumed by application services that transform and combine data for business logic:

```typescript
@Injectable()
export class HSCodeHierarchyService {
  constructor(
    private readonly hscodeTariffMCP: HSCodeTariffMCPService,
  ) {}
  
  async buildHSCodeHierarchy(productDescription: string): Promise<HSCodeHierarchy> {
    // Use the MCP to get data
    const hscodeResults = await this.hscodeTariffMCP.searchHSCode(productDescription);
    
    // Transform the data into a hierarchy
    return this.transformToHierarchy(hscodeResults);
  }
  
  // Other methods...
}
```

## Adding New MCPs

To extend TradeWizard with a new MCP:

1. Define the interface in `[mcp-name].interface.ts`
2. Create a new implementation in `[mcp-name].service.ts`
3. Register the service in the appropriate module
4. Implement fallback mechanisms
5. Add caching strategies

## Best Practices

1. **Separation of Concerns**: MCPs should only handle data retrieval and transformation
2. **Error Resilience**: Always implement fallback mechanisms
3. **Caching**: Implement appropriate caching based on data volatility
4. **Rate Limiting**: Respect API rate limits and implement backoff strategies
5. **Logging**: Log all API interactions for debugging and analytics

## Future Extensions

The MCP architecture is designed to be extensible in several ways:

1. **Additional Countries**: New country-specific MCPs can be added
2. **Alternative Data Sources**: Multiple implementations of the same MCP can be created
3. **Enhanced Capabilities**: MCPs can be extended with new methods and data types 