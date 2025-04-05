# Component Relationships in TradeWizard 3.0

This document provides an overview of how the various components in TradeWizard 3.0 relate to and interact with each other, from the UI layer down to the data services.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Components                         │
├─────────────────────────────────────────────────────────────┤
│                       React Contexts                         │
├─────────────────────────────────────────────────────────────┤
│                   Application Services                       │
├─────────────────────────────────────────────────────────────┤
│                    Model Context Protocols                   │
├─────────────────────────────────────────────────────────────┤
│                    External Data Sources                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Dependencies

### UI Layer

1. **Assessment Workflow**
   - `AssessmentWizard` (container component)
     - Depends on: `AssessmentContext`, `ProductAssessmentSlice`
     - Contains:
       - `BusinessInfoForm`
       - `WebsiteExtractorForm`
       - `ProductSelectionGrid`
       - `ProductEditDialog`
       - `HSCodeSelector`
       - `ExportReadinessReport`

2. **Grid Components**
   - `Grid` (base component)
     - Used by: `ProductSelectionGrid`, `HSCodeResultsGrid`
   - `GridWrapper` (enhances Grid with toolbar and filters)
     - Depends on: `Grid`
     - Used by: higher-level container components

3. **Product Components**
   - `ProductCard`
     - Used by: `ProductSelectionGrid`
   - `ProductEditDialog`
     - Depends on: `ProductAssessmentSlice`, `HSCodeHierarchyService`
   - `ProductDetailsPanel`
     - Depends on: `HSCodeTariffMCPService`

### Context Layer

1. **Assessment Context**
   - Provides:
     - Current assessment state
     - Workflow navigation
     - Form validation state
   - Consumed by:
     - All wizard steps
     - Navigation components

2. **API Context**
   - Provides:
     - API status (loading, error states)
     - API configuration
   - Consumed by:
     - Components making API calls
     - Error boundary components

### Service Layer

1. **Orchestration Service**
   - Depends on:
     - `LLMWebsiteExtractor`
     - `ProductConsolidationService`
     - `HSCodeHierarchyService`
   - Consumes:
     - Website URL
     - Business details
   - Produces:
     - Extracted products
     - Business profile

2. **Product Consolidation Service**
   - Depends on:
     - `ProductCategoriesData`
   - Consumes:
     - Raw product extractions
   - Produces:
     - Normalized product data
     - Product categories
     - Product attributes

3. **HSCode Hierarchy Service**
   - Depends on:
     - `HSCodeTariffMCPService`
     - `CacheService`
   - Consumes:
     - Product descriptions
   - Produces:
     - HS code hierarchical structure
     - Recommended codes

### MCP Layer

1. **HSCode Tariff MCP Service**
   - Depends on:
     - External HS Code API
     - `CacheService`
   - Provides:
     - HS code lookup
     - Tariff information
     - Code details and descriptions

2. **Compliance MCP Service**
   - Depends on:
     - External compliance data sources
     - `CacheService`
   - Provides:
     - Regulatory requirements
     - Documentation needs
     - Import restrictions

3. **Market Intelligence MCP Service**
   - Depends on:
     - External market data sources
     - `CacheService`
   - Provides:
     - Market opportunities
     - Competitor analysis
     - Trends and forecasts

## Data Flow Diagram

```
┌────────────────┐         ┌───────────────────┐
│                │         │                   │
│   User Input   ├────────►│  React Components │
│                │         │                   │
└────────────────┘         └─────────┬─────────┘
                                     │
                                     ▼
                           ┌─────────────────────┐
                           │                     │
                           │   React Contexts    │
                           │                     │
                           └─────────┬───────────┘
                                     │
                                     ▼
                           ┌─────────────────────┐
                           │                     │
                           │ Orchestration Svc   │
                           │                     │
                           └─────────┬───────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
        │                 │ │                 │ │                  │
        │ Website Extrctr │ │ Product Consld  │ │ HSCode Hierarchy │
        │                 │ │                 │ │                  │
        └────────┬────────┘ └────────┬────────┘ └────────┬─────────┘
                 │                   │                   │
                 │                   │                   │
                 ▼                   ▼                   ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
        │                 │ │                 │ │                  │
        │   AI Services   │ │ Category Data   │ │  HSCode MCP Svc  │
        │                 │ │                 │ │                  │
        └─────────────────┘ └─────────────────┘ └──────────────────┘
```

## Key Interactions

### Website Extraction Flow

1. User enters website URL in `WebsiteExtractorForm`
2. `AssessmentContext` updates with URL and triggers extraction
3. `LLMWebsiteExtractor` service processes the URL:
   - Fetches website content using HTTP or Puppeteer
   - Sends content to OpenAI for initial extraction
   - Validates data with Perplexity AI
4. Extracted business and product data is returned
5. `ProductConsolidationService` normalizes and categorizes products
6. Products are stored in `ProductAssessmentSlice`
7. UI is updated to display extracted products in `ProductSelectionGrid`

### HS Code Selection Flow

1. User selects a product in `ProductSelectionGrid`
2. Selection is tracked in `ProductAssessmentSlice`
3. `HSCodeHierarchyService` is called to get relevant codes
4. Service calls `HSCodeTariffMCPService` (an MCP)
5. HS codes are returned as a hierarchical structure
6. User navigates through and selects appropriate code in `HSCodeSelector`
7. Selected code is saved to the product in `ProductAssessmentSlice`

### Export Readiness Assessment Flow

1. `AssessmentWizard` completes all required steps
2. `OrchestrationService` integrates all collected data
3. Service calls relevant MCPs for compliance and market intelligence
4. Assessment score is calculated based on:
   - Business profile completeness
   - Product details accuracy
   - HS code accuracy
   - Documentation readiness
5. Report is generated and displayed in `ExportReadinessReport`

## Communication Patterns

### Props Drilling (Limited Use)

- Used for simple parent-child relationships
- Example: `Grid` receives column definitions and data

### Context API

- Used for cross-cutting concerns
- Examples:
  - Authentication state
  - API status
  - Assessment workflow state

### Redux (ProductAssessmentSlice)

- Used for complex state management
- Examples:
  - Product data
  - Selection state
  - Assessment history

### Service Pattern

- Used for business logic and data access
- Services are injected into components or hooks
- Examples:
  - `useHSCodeHierarchy` hook uses `HSCodeHierarchyService`
  - `ProductEditDialog` uses `ProductConsolidationService`

## Dependency Injection

TradeWizard uses a lightweight DI system to manage service dependencies:

```typescript
// Service registration
const services = {
  hsCodeHierarchyService: new HSCodeHierarchyService(
    new HSCodeTariffMCPServiceImpl(cacheService)
  ),
  productConsolidationService: new ProductConsolidationService()
};

// Service consumption via hook
function useHSCodeHierarchy() {
  const context = useContext(ServiceContext);
  return context.hsCodeHierarchyService;
}
```

## Known Issues in Component Relationships

1. **Tight Coupling**
   - Some UI components directly call services instead of using contexts
   - Refactoring needed to improve separation of concerns

2. **Incomplete Error Propagation**
   - Error handling is inconsistent across component boundaries
   - Need to implement consistent error boundaries

3. **Context Nesting**
   - Multiple contexts can lead to "wrapper hell"
   - Consider consolidating contexts where appropriate

4. **Performance Issues**
   - Context updates may trigger unnecessary rerenders
   - Memoization and selective rerenders should be implemented 