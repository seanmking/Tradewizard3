# Technical Brief: HS Classification Improvement for TradeWizard

## Context and Problem Definition

We've encountered a fundamental gap between user search terminology and formal HS classification in the UK Trade Tariff API, as demonstrated in our testing. Here are the key technical findings:

### Evidence from UK Trade Tariff API Testing:

Refer to `src/scripts/testUkHsApiLive.ts` where we tested direct API searches:

```typescript
// Extract from src/scripts/testUkHsApiLive.ts
const searchTerms = ['avocado', 'macadamia', 'wine']; // Simple terms work
// But when we attempted "chicken corndog" - no results returned
```

Our tests show simple commodity searches return results, but specific commercial product descriptions fail:

1. "Chicken corndog" returns zero results despite being a common imported product
2. Users must know to search for technical terms like "prepared poultry meat, containing cereals"
3. The API expects precise HS terminology, not consumer-facing product descriptions

## Proposed Solution: Vector-Based Classification Layer

We recommend implementing a vector embedding service that maps commercial product descriptions to appropriate HS codes:

### 1. Core Architecture Components

**Files to create:**
- `src/services/classification/embeddingService.ts` - Core vector similarity engine
- `src/services/classification/productMapper.ts` - Product-to-HS code mapping logic
- `src/services/classification/trainingPipeline.ts` - Model training and improvement logic

**Key implementation details needed:**
- Vector database selection (Pinecone, Weaviate, or self-hosted)
- Embedding model choice (sentence-transformers vs custom fine-tuned model)
- Training data source for HS classification (WCO dataset availability)

### 2. Integration Points

Make these changes to `src/api/hsCodeSearch.ts`:

```typescript
// Before API call to any tariff service
async function enhancedHsSearch(userQuery: string, market: string) {
  // 1. Try direct search first (for experts who know correct terminology)
  let results = await directHsApiSearch(userQuery, market);
  
  // 2. If no results, use embedding classification
  if (!results.length) {
    const suggestedHsCodes = await classificationService.getSuggestedCodes(userQuery);
    results = await getDetailsForSuggestedCodes(suggestedHsCodes, market);
  }
  
  return results;
}
```

### 3. Training Data Requirements

We need to create a training dataset with these characteristics:
- 10,000+ commercial product descriptions mapped to correct HS codes
- Coverage across all major HS chapters (prioritizing Chapters 1-24, 84-85)
- Multiple variations of descriptions for each product type

## Technical Specifications

1. **Embedding Model**: 
   - Base model: MPNet or BERT-based sentence transformer
   - Dimension: 768 or 1024
   - Fine-tuning approach: Contrastive learning on HS pairs

2. **Performance Requirements**:
   - Query latency: <200ms for classification suggestions
   - Accuracy threshold: >85% correct chapter, >70% correct heading
   - Fallback strategy: Always return results from broader classification if specific fails

3. **Deployment Model**:
   - Centralized service with API endpoints
   - Optimization for multi-region deployment
   - Caching layer for common queries

## Validation Strategy

Create a test harness in `src/tests/classification/accuracyTests.ts` with:
- Accuracy metrics across different product categories
- A/B testing capability for different embedding approaches
- Confusion matrix to identify problematic categories

## Next Steps

1. Secure 5,000 initial product samples with known HS classifications
2. Benchmark 3 embedding approaches on this dataset
3. Build MVP with highest-performing approach
4. Implement feedback loop for continuous improvement 