# HS Code Hierarchy Service

The HS Code Hierarchy Service is a component of TradeWizard 3.0 that provides hierarchical navigation and intelligent suggestions for Harmonized System (HS) codes based on product categories and descriptions.

## Purpose

The service addresses several key requirements:

1. **Hierarchical HS Code Navigation**: Implements the standard 2-digit → 4-digit → 6-digit HS code hierarchy
2. **Category Mapping**: Maps our five main product categories to appropriate HS code chapters
3. **Intelligent Suggestions**: Provides relevant HS code suggestions with confidence scores
4. **Integration with Product Categorization**: Works with the CategoryBasedConsolidationService for end-to-end product categorization and HS code assignment

## Implementation

### Core Components

1. **HS Code Hierarchy Structure**
   - Chapters (2-digit): The highest level, representing broad categories of goods
   - Headings (4-digit): Mid-level classifications within chapters
   - Subheadings (6-digit): Detailed product classifications within headings

2. **WITS API Integration**
   - Leverages the World Integrated Trade Solution (WITS) API for comprehensive HS code data
   - Maintains the international standard 6-digit HS codes
   - Fallback mechanisms for when the API is unavailable

3. **Category to HS Code Mapping**
   - Maps our five main product categories to relevant HS code chapters:
     - Food Products: Chapters 02, 03, 04, 07, 08, 16, 19, 20, 21
     - Beverages: Chapter 22
     - Ready-to-Wear: Chapters 61, 62, 64, 65
     - Home Goods: Chapters 39, 44, 69, 70, 94
     - Non-Prescription Health: Chapters 30, 33, 34

4. **Confidence Scoring Mechanism**
   - Base confidence from semantic matching
   - Boosted confidence for chapter matches based on product category
   - Hierarchical confidence inheritance from parent to child codes

### Interfaces and Types

```typescript
/**
 * Represents a node in the HS code hierarchy
 */
interface HSCodeNode {
  code: string;
  description: string;
  level: HSCodeLevel;
  parent?: string;
  children?: string[];
  notes?: string[];
  examples?: string[];
  confidence?: number;
}

/**
 * Levels in the HS code hierarchy
 */
type HSCodeLevel = 'chapter' | 'heading' | 'subheading';

/**
 * HS code suggestion with confidence score
 */
interface HSCodeSuggestion {
  code: string;
  description: string;
  level: HSCodeLevel;
  confidence: number;
  notes?: string[];
  examples?: string[];
  children?: HSCodeSuggestion[];
}

/**
 * Request for HS code suggestions
 */
interface HSCodeRequest {
  productCategory: string;
  productName?: string;
  productDescription?: string;
  attributes?: Record<string, any>;
  countryCode?: string;
}

/**
 * Configuration for the HS Code Hierarchy Service
 */
interface HSCodeHierarchyConfig {
  confidenceThreshold: number;    // Threshold for accepting suggestions (default: 0.6)
  useCaching: boolean;            // Whether to use caching (default: true)
  cacheExpiryMinutes: number;     // Cache expiry in minutes (default: 43200 = 30 days)
  maxConcurrentRequests: number;  // Max concurrent API requests (default: 5)
  maxSuggestions: number;         // Maximum number of suggestions to return (default: 5)
  preloadDepth?: 'none' | 'headings' | 'subheadings'; // How deeply to preload hierarchy
}
```

### Public Methods

```typescript
/**
 * HSCodeHierarchyService class provides hierarchical navigation of HS codes
 * and intelligent suggestions based on product categories
 */
class HSCodeHierarchyService {
  /**
   * Constructor for HSCodeHierarchyService
   * 
   * @param hsCodeService The underlying HS code tariff MCP service
   * @param cacheService Cache service for storing hierarchy and suggestions
   * @param config Optional configuration settings
   */
  constructor(
    hsCodeService: HSCodeTariffMCPService,
    cacheService: CacheService<any>,
    config?: Partial<HSCodeHierarchyConfig>
  );

  /**
   * Initialize the HS code hierarchy
   * Loads the base chapters and prepares the service for use
   * 
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void>;

  /**
   * Get suggested HS codes for a product
   * 
   * @param request The request containing product details and category
   * @returns Array of HS code suggestions with confidence scores
   */
  public async getSuggestedHSCodes(request: HSCodeRequest): Promise<HSCodeSuggestion[]>;

  /**
   * Get children of an HS code (e.g., headings for a chapter, subheadings for a heading)
   * 
   * @param hsCode The parent HS code
   * @returns Array of child HS code nodes
   */
  public async getHSCodeChildren(hsCode: string): Promise<HSCodeNode[]>;

  /**
   * Get detailed information about a specific HS code
   * 
   * @param hsCode The HS code to get details for
   * @returns The HS code node with full details or undefined if not found
   */
  public async getHSCodeDetails(hsCode: string): Promise<HSCodeNode | undefined>;

  /**
   * Invalidate all or specific parts of the cache
   * 
   * @param type The type of cache to invalidate ('hierarchy', 'search', or 'all')
   */
  public invalidateCache(type: 'hierarchy' | 'search' | 'all' = 'all'): void;

  /**
   * Get the preferred HS code chapters for a product category
   * 
   * @param category The product category
   * @returns Array of chapter codes (2-digit) appropriate for the category
   */
  public getCategoryChapters(category: string): string[];
}
```

## Usage

### Basic Usage

```typescript
// Initialize the service
const hsCodeHierarchyService = new HSCodeHierarchyService(
  hsCodeService,
  cacheService,
  {
    confidenceThreshold: 0.6,
    useCaching: true,
    maxSuggestions: 5
  }
);

// Get HS code suggestions for a product
const request: HSCodeRequest = {
  productCategory: 'beverages',
  productName: 'Red Wine',
  productDescription: 'Premium Cabernet Sauvignon from South Africa'
};

// Get suggestions
const suggestions = await hsCodeHierarchyService.getSuggestedHSCodes(request);

// Process suggestions
for (const suggestion of suggestions) {
  console.log(`HS Code ${suggestion.code}: ${suggestion.description}`);
  console.log(`Confidence: ${suggestion.confidence}`);
  
  if (suggestion.children?.length > 0) {
    console.log('Child codes:');
    for (const child of suggestion.children) {
      console.log(`- ${child.code}: ${child.description}`);
    }
  }
}

// Navigate down the hierarchy
if (suggestions.length > 0) {
  const children = await hsCodeHierarchyService.getHSCodeChildren(suggestions[0].code);
  // Process children...
}
```

### Configuration Options

The service accepts the following configuration options:

```typescript
interface HSCodeHierarchyConfig {
  confidenceThreshold: number;    // Threshold for accepting suggestions (default: 0.6)
  useCaching: boolean;            // Whether to use caching (default: true)
  cacheExpiryMinutes: number;     // Cache expiry in minutes (default: 43200 = 30 days)
  maxConcurrentRequests: number;  // Max concurrent API requests (default: 5)
  maxSuggestions: number;         // Maximum number of suggestions to return (default: 5)
  preloadDepth: 'none' | 'headings' | 'subheadings'; // How deeply to preload (default: 'none')
}
```

## Integration with Category-Based Consolidation

The HSCodeHierarchyService is designed to work seamlessly with the CategoryBasedConsolidationService:

```typescript
// Example integration flow
async function categorizeAndAssignHSCodes(products) {
  // Step 1: Categorize products
  const categoryResults = await consolidationService.consolidateProducts(products);
  
  // Step 2: Get HS code suggestions for each category
  const hsCodeSuggestions = [];
  
  for (const categoryResult of categoryResults) {
    const category = categoryResult.category;
    const variants = categoryResult.variants;
    
    // Create a combined product description from variants
    const combinedDescription = variants
      .map(v => `${v.name}${v.description ? ': ' + v.description : ''}`)
      .join('. ');
    
    // Request HS code suggestions
    const request: HSCodeRequest = {
      productCategory: category.id,
      productDescription: combinedDescription,
      attributes: categoryResult.attributes
    };
    
    const suggestions = await hsCodeHierarchyService.getSuggestedHSCodes(request);
    
    hsCodeSuggestions.push({
      category,
      variants,
      hsCodes: suggestions
    });
  }
  
  return hsCodeSuggestions;
}
```

## Integration with Country-Specific MCPs

The HSCodeHierarchyService supports country-specific HS code extensions through a flexible integration model:

### Country Code Parameter

The `HSCodeRequest` interface includes an optional `countryCode` parameter that specifies which country's HS code extensions to use:

```typescript
const request: HSCodeRequest = {
  productCategory: 'beverages',
  productName: 'Red Wine',
  productDescription: 'Premium Cabernet Sauvignon from South Africa',
  countryCode: 'za' // South Africa
};
```

### Country-Specific MCP Resolution

When a country code is provided, the service follows a multi-step resolution process:

1. **Standard Code Resolution**: First retrieves the standard 6-digit international HS code
2. **Country Extension Resolution**: Then queries the country-specific MCP for extensions (8-10 digits depending on country)
3. **Data Merge**: Combines international and country-specific data to provide comprehensive information
4. **Country-Specific Rules**: Applies any country-specific rules or restrictions to the suggestions

### Implementation in Phase 3

In Phase 3, we will implement country-specific MCPs with the following approach:

1. **Directory Structure**:
   - Country-specific MCPs will be implemented in `src/mcp/[country-code]/hscode-mcp/`
   - Each country MCP will extend or implement the same interface as `HSCodeTariffMCPService`

2. **Dynamic Resolution**:
   - The `HSCodeHierarchyService` will use a MCP resolver pattern to dynamically select the appropriate MCP:
   ```typescript
   private getCountrySpecificMCP(countryCode: string): HSCodeMCPInterface {
     // If country code is provided and a specific MCP exists, use it
     if (countryCode && this.countryMCPs.has(countryCode)) {
       return this.countryMCPs.get(countryCode)!;
     }
     
     // Otherwise use the default international MCP
     return this.hsCodeService;
   }
   ```

3. **UI Integration**:
   - The `CascadingHSCodeSelector` UI will allow filtering by country
   - When a country is selected, the UI will dynamically load relevant extensions
   - Country-specific restrictions will be highlighted visually

4. **Fallback Mechanism**:
   - If a country-specific MCP is unavailable or returns an error, the service will fallback to international codes
   - This ensures robustness and continuous operation even during API outages

### Supported Countries (Planned)

The initial implementation will support:
- South Africa (ZA)
- United States (US)
- European Union (EU)
- China (CN)
- Brazil (BR)

Additional countries will be added based on user requirements and trading partner prioritization.

## Confidence Scoring

The service uses a sophisticated approach to confidence scoring:

1. **Base Confidence**: Derived from semantic matching between product descriptions and HS code descriptions.

2. **Category Boost**: When a suggested HS code chapter matches the expected chapters for a product category, the confidence is boosted by up to 20%.

3. **Hierarchical Confidence**: Child codes inherit confidence from their parent codes, with a slight reduction to reflect increased specificity.

4. **Threshold Filtering**: Only suggestions with confidence above the configurable threshold are returned.

## Performance Considerations

- **Caching**: Multi-level caching of hierarchy data and suggestions for optimal performance
- **Lazy Loading**: The hierarchy is loaded on demand to minimize memory usage and startup time
- **Concurrent Processing**: API requests are processed concurrently with a configurable limit
- **Fallback Mechanisms**: Built-in fallbacks for when the API is unavailable or returns errors

## Testing

The service includes comprehensive unit tests covering:

1. HS code suggestion functionality
2. Confidence score calculation
3. Handling of ambiguous products
4. Category mapping accuracy
5. Integration with product categorization

To run the tests:

```
npm test -- --testPathPattern=hsCodeHierarchy
```

## Example Demonstration

A demonstration script is available at `src/scripts/test-hs-code-hierarchy.ts` that showcases:

- Getting HS code suggestions for specific products
- Navigating the HS code hierarchy
- Mapping from product categories to HS codes
- Handling ambiguous products

To run the demonstration:

```
npx ts-node src/scripts/test-hs-code-hierarchy.ts
```

## Future Enhancements

1. **Country-Specific HS Codes**: Support for country-specific extensions beyond the standard 6-digit codes
2. **Image Recognition**: Integration with image analysis for product identification and classification
3. **Historical Trade Data**: Incorporation of trade flow data to suggest HS codes based on common trade patterns
4. **User Feedback Loop**: Mechanism to collect and incorporate user corrections to improve future suggestions 