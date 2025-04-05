# TradeWizard 3.0 MCP Implementation Instructions

## Current State Analysis

### Existing Features in Tradewizard3

1. **Core Next.js Architecture** with TypeScript  
2. **MCP Framework** with:
   - Intelligence MCP (Perplexity AI integration)
   - Compliance MCP (basic structure)
   - Market Intelligence MCP  
3. **Website Analysis Services** with tiered scraping approach  
4. **AI Agent** infrastructure for data enrichment  

### HS Classification Implementation (`feature/hs-classification` branch)

The repository already contains a hybrid HS classification solution:

1. **EmbeddingService** (`src/services/classification/embeddingService.ts`)
   - Vector-based semantic matching engine  
   - Integration with embedding API and vector database  
   - Fallback mechanisms for low-confidence matches  

2. **ProductMapper** (`src/services/classification/productMapper.ts`)
   - Keyword-based mapping for common products  
   - Predefined mappings for frequently exported items  
   - Result combination and enrichment logic  

3. **Technical Brief** (`technical-brief.md`)
   - Problem definition and solution overview  
   - Technical specifications and validation strategy  

---

## Implementation Priorities

### Priority 1: Integrate HS Classification into MCP Structure

1. **Create Global HS Code MCP**
   - Path: `src/mcp/global/hs-code-mcp/`
   - Integrate existing `EmbeddingService` and `ProductMapper`
   - Implement interfaces consistent with existing MCPs
   - Create API for global 6-digit HS classifications

```ts
// src/mcp/global/hs-code-mcp/hs-code-mcp.service.ts
import embeddingService from '@/services/classification/embeddingService';
import productMapper from '@/services/classification/productMapper';
import { CacheService } from '@/services/cache-service';

export class HsCodeMCPService {
  private readonly cacheService: CacheService;
  
  constructor() {
    this.cacheService = new CacheService('hs-codes');
  }
  
  async classifyProduct(productDescription: string): Promise<HsClassificationResult> {
    const cacheKey = `classification:${productDescription.toLowerCase().trim()}`;
    const cachedResult = await this.cacheService.get(cacheKey);
    
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    
    const keywordResults = productMapper.getSuggestedHsCodes(productDescription);
    let vectorResults = [];
    if (keywordResults.length === 0 || keywordResults[0].confidence < 0.8) {
      vectorResults = await embeddingService.classifyProduct(productDescription);
    }
    
    const results = productMapper.combineClassificationResults(keywordResults, vectorResults);
    await this.cacheService.set(cacheKey, JSON.stringify(results), 60 * 60 * 24); // 24 hours
    
    return {
      classifications: results,
      query: productDescription,
      timestamp: new Date().toISOString()
    };
  }
}
```

2. **Implement UI for Product Classification**
   - Path: `src/components/classification/`
   - Cascading dropdown UI
   - Integrate with Global HS Code MCP
   - User refinement interface

---

### Priority 2: Implement Country-Specific MCPs

#### UAE MCPs

- **UAE HS & Tariff MCP**
  - Extend global HS codes with UAE-specific data  
  - Leverage classification service  
  - API client for UAE tariff data  

- **UAE Market Insights MCP**
  - UAE-specific insights  
  - Extend global market data  

- **UAE Compliance MCP**
  - UAE regulations  
  - Required certifications  

#### UK MCPs

- **UK HS & Tariff MCP**
  - Extend global HS codes  
  - Connect to UK Trade Tariff API  

- **UK Market Insights MCP**
  - UK-specific data and market trends  

- **UK Compliance MCP**
  - UK regulations and certifications  

---

### Priority 3: Enhance Global MCPs for Aggregation

- **Enhanced Compliance MCP**
  - Add aggregation functions for country requirements  
  - Integrate with HS classification  

- **Global Market Insights MCP**
  - Aggregate country insights  
  - Market opportunity analysis by HS code  

---

### Priority 4: Implement Assessment Flow

1. **Phased Assessment Implementation**
   - Phase controllers in `src/ai-agent/phases/`
   - Global and country-specific phases
   - Final report generation phase

2. **AI Agent Orchestration**
   - Guide users through assessment phases  
   - Decision logic for transitions  

---

## Technical Integration

### UK HS Tariff MCP Example

```ts
// src/mcp/country/uk/hs-tariff-mcp/uk-hs-tariff-mcp.service.ts
import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp/hs-code-mcp.service';
import { CacheService } from '@/services/cache-service';

export class UkHsTariffMCPService {
  private readonly globalHsCodeMCP: GlobalHsCodeMCPService;
  private readonly cacheService: CacheService;
  private readonly ukApiBaseUrl: string;
  
  constructor() {
    this.globalHsCodeMCP = new GlobalHsCodeMCPService();
    this.cacheService = new CacheService('uk-hs-tariff');
    this.ukApiBaseUrl = process.env.UK_TARIFF_API_URL || 'https://api.trade-tariff.service.gov.uk/api/v2';
  }
  
  async getExtendedHsCode(productDescription: string): Promise<UkHsCodeResult> {
    const globalClassification = await this.globalHsCodeMCP.classifyProduct(productDescription);
    
    const ukClassification = await this.getUkSpecificHsCode(
      globalClassification.classifications[0].hsCode,
      productDescription
    );
    
    return {
      ...ukClassification,
      globalClassification
    };
  }
}
```

---

### Assessment Flow Integration

```ts
// src/ai-agent/phases/global-assessment-phase.ts
import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp/hs-code-mcp.service';
import { GlobalMarketInsightsMCPService } from '@/mcp/global/market-insights-mcp/market-insights-mcp.service';

export class GlobalAssessmentPhase {
  private readonly hsCodeMCP: GlobalHsCodeMCPService;
  private readonly marketInsightsMCP: GlobalMarketInsightsMCPService;
  
  constructor() {
    this.hsCodeMCP = new GlobalHsCodeMCPService();
    this.marketInsightsMCP = new GlobalMarketInsightsMCPService();
  }
  
  async executePhase(assessment: AssessmentData): Promise<AssessmentData> {
    const classification = await this.hsCodeMCP.classifyProduct(assessment.productDescription);
    
    const marketInsights = await this.marketInsightsMCP.getGlobalMarketInsights(
      classification.classifications[0].hsCode
    );
    
    return {
      ...assessment,
      globalClassification: classification,
      globalMarketInsights: marketInsights,
      currentPhase: 'global-assessment-complete'
    };
  }
}
```

---

## Testing Strategy

1. **HS Classification Testing**
   - Test common South African exports
   - Verify integration into MCP structure
   - UI testing with cascading inputs

2. **Country-Specific MCP Testing**
   - Test Global-to-Country MCP communication  
   - Verify correct API responses and fallbacks  

3. **Assessment Flow Testing**
   - Full journey test from input to report  
   - Validate transitions, persistence, and edge cases  

---

## Next Steps

1. Merge `feature/hs-classification` into `main`  
2. Create Global HS Code MCP wrapper  
3. Implement UAE and UK country-specific MCPs  
4. Build assessment phases in AI Agent  
5. Create cascading UI for product classification 