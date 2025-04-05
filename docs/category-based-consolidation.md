# Category-Based Consolidation Service

The CategoryBasedConsolidationService is a new service that provides intelligent product categorization using semantic similarity and LLM capabilities. This document covers the design, implementation, and usage of this service.

## Purpose

The service replaces the previous regex pattern-based product consolidation system with a more flexible, category-driven approach that:

1. Uses semantic similarity rather than hardcoded regex patterns
2. Groups products into specific required categories (Food Products, Beverages, Ready-to-Wear, Home Goods, Non-Prescription Health)
3. Leverages LLM capabilities for intelligent categorization
4. Extracts and normalizes product attributes

## Implementation

### Core Components

The implementation consists of several key components:

1. **Hierarchical Agglomerative Clustering**
   - Clusters similar products using cosine similarity between embeddings
   - Uses Ward's method to minimize intra-cluster variance
   - Automatically determines optimal clusters based on similarity thresholds

2. **LLM-Based Categorization**
   - Analyses product clusters to determine the best category match
   - Extracts product attributes like ingredients, preparation methods, and storage requirements
   - Assigns dynamic confidence scores based on semantic similarity

3. **Predefined Category Structure**
   - Five main product categories aligned with business requirements:
     - Food Products
     - Beverages
     - Ready-to-Wear
     - Home Goods
     - Non-Prescription Health
   - Comprehensive attribute definitions for each category
   - Category-specific keywords and examples

4. **Performance Optimization**
   - Multi-level caching (memory, Redis, database)
   - Batch processing of embeddings and LLM requests
   - Fallback mechanisms for service interruptions

### Interfaces

Key interfaces and types:

```typescript
// Product category definition
interface ProductCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  attributes: AttributeDefinition[];
  parentCategory?: string;
  keywords: string[];
  hsCodeHints: string[];
  alternateNames: string[];
  priority: number;
  metadata: Record<string, any>;
}

// Consolidation result
interface CategoryResult {
  category: ProductCategory;
  variants: ProductVariant[];
  confidence: number;
  attributes: ProductAttributes;
}
```

## Usage

### Basic Usage

```typescript
// Initialize the service
const consolidationService = new CategoryBasedConsolidationService(
  embeddingService,
  llmService,
  cacheService
);

// Consolidate products
const products: ProductVariant[] = [
  // Array of product variants
];

const result = await consolidationService.consolidateProducts(products);

// Process results
result.forEach(categoryResult => {
  console.log(`Category: ${categoryResult.category.name}`);
  console.log(`Products: ${categoryResult.variants.length}`);
  console.log(`Confidence: ${categoryResult.confidence}`);
});
```

### Configuration Options

The service accepts the following configuration options:

```typescript
interface CategoryConsolidationConfig {
  similarityThreshold: number;       // Threshold for considering products similar (default: 0.75)
  confidenceThreshold: number;       // Threshold for accepting categorizations (default: 0.75)
  enableLLM: boolean;                // Whether to use LLM for categorization (default: true)
  maxLLMRetries: number;             // Maximum retries for LLM calls (default: 3)
  useCaching: boolean;               // Whether to use caching (default: true)
  cacheExpiryMinutes: number;        // Cache expiry in minutes (default: 43200 = 30 days)
  categories?: ProductCategory[];    // Custom categories (optional)
  batchSize: number;                 // Batch size for processing (default: 10)
  maxConcurrentRequests: number;     // Max concurrent LLM requests (default: 5)
}
```

### Example: Categorizing Various Products

```typescript
const products = [
  {
    id: '1',
    name: 'Premium Canned Tuna in Olive Oil',
    description: 'Dolphin-safe tuna preserved in extra virgin olive oil',
    category: 'Canned Foods'
  },
  {
    id: '2',
    name: 'Cotton Safari Jacket',
    description: 'Lightweight khaki jacket with multiple pockets',
    category: 'Outerwear'
  }
];

const result = await consolidationService.consolidateProducts(products);

// Expected output: Two category results
// 1. Food Products category for the canned tuna
// 2. Ready-to-Wear category for the safari jacket
```

## Confidence Scoring

The service implements a sophisticated confidence scoring mechanism:

1. **Semantic Similarity Calculation**
   - Text-based similarity between product descriptions and category definitions
   - Uses TF-IDF weighted scoring to prioritize important keywords
   - Considers product attributes and category metadata

2. **Group Consistency Scoring**
   - Higher confidence for larger groups of similar products
   - Adjusts confidence based on internal consistency of the group
   - Applies size-based bonuses for clustering validation

3. **Dynamic Thresholds**
   - Adjustable confidence thresholds through configuration
   - Different thresholds for different operations
   - Fallback mechanisms when confidence is too low

## Integration with Other Services

### HS Code Classification

The category-based consolidation service integrates with the HS code classification system through the `hsCodeHints` in each category. These hints provide suggested HS code chapters that will be used in Phase 2 (HSCodeHierarchyService).

### Website Analyzer

The service integrates with the existing website analyzer to provide more accurate product categorization during website analysis:

```typescript
// In WebsiteAnalyzerService
async analyzeWebsite(url: string): Promise<AnalysisResult> {
  // Extract products from website
  const extractedProducts = await this.extractProducts(url);
  
  // Categorize products
  const categorizedProducts = await this.consolidationService.consolidateProducts(extractedProducts);
  
  // Continue with analysis
  return {
    url,
    productCategories: categorizedProducts,
    // Other analysis results
  };
}
```

## Performance Considerations

- **Memory Usage**: The embedding calculations can be memory-intensive for large product sets
- **API Costs**: LLM API calls incur costs, so caching is essential
- **Processing Time**: Typical processing time is <2s per product with LLM, <50ms with cache

## Testing

The service includes comprehensive unit tests covering:

1. Core clustering algorithm 
2. Category matching logic
3. Attribute extraction
4. End-to-end categorization flow
5. Confidence scoring accuracy

To run the tests:

```
npm test -- --testPathPattern=categoryBasedConsolidation
```

## Future Enhancements

1. **Dynamic Category Learning**: Ability to learn new categories from product data
2. **Multilingual Support**: Handle products in multiple languages
3. **Image Recognition Integration**: Use product images to improve categorization
4. **User Feedback Loop**: Incorporate user corrections to improve future categorization 