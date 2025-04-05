# Architectural Decision Records

This document captures key architectural decisions made during the development of TradeWizard 3.0.

## ADR-001: HSCodeHierarchyService Placement

### Context
The HSCodeHierarchyService provides hierarchical navigation and intelligent suggestions for Harmonized System (HS) codes based on product categories and descriptions. We needed to decide whether to place this in the MCP directory structure (`src/mcp/global/hs-code-mcp/`) or in the services directory (`src/services/product/`).

### Decision
We decided to place the HSCodeHierarchyService in `src/services/product/` rather than `src/mcp/global/hs-code-mcp/`.

### Rationale

1. **Service vs. MCP Distinction**:
   - This component implements business logic (mapping products to HS codes) rather than being a direct API integration
   - It follows our architecture principle where MCPs are API integrations while services implement business logic
   - It consumes the HSCodeTariffMCPService which properly belongs in the MCP directory

2. **Alignment with Related Services**:
   - It's functionally related to CategoryBasedConsolidationService (also in `src/services/product/`)
   - This enables closer integration between product categorization and HS code mapping
   - Maintains cohesion of product-related services

3. **Consumer Relationship**:
   - It consumes the HSCodeTariffMCPService (which is correctly placed in `src/mcp/global/hscode-tariff-mcp/`)
   - This maintains the proper dependency direction: services consume MCPs, not vice versa

### Consequences
- Maintains clean separation of concerns between services and MCPs
- Enables easier integration with product categorization
- Clarifies the relationship between HSCodeHierarchyService (business logic) and HSCodeTariffMCPService (API integration)

## ADR-002: HSCodeHierarchyService Caching Strategy

### Context
The HSCodeHierarchyService needs to efficiently handle a large hierarchical dataset of HS codes while minimizing API calls to external services and maintaining good performance.

### Decision
We implemented a multi-layered caching strategy with multiple invalidation mechanisms.

### Rationale

1. **Time-Based Expiration**:
   - Different TTLs for different types of data based on update frequency
   - Base hierarchy: 30-day TTL (configurable via `cacheExpiryMinutes`)
   - Search results: 7-day TTL
   - Handles gradual updates to HS codes which typically change yearly

2. **Manual Invalidation Hook**:
   - Provides a mechanism to explicitly invalidate cache when needed
   - Supports granular invalidation (hierarchy only, search results only, or all)
   - Essential for handling out-of-band updates or corrections

3. **Version-Based Keys**:
   - Cache keys include a version identifier: `${cacheKeyPrefix}v1:hierarchy:base`
   - When HS codes receive major updates, the version can be incremented
   - Enables clean invalidation of all previous cache entries

### Consequences
- Reduces load on external APIs
- Improves response times for frequent requests
- Provides flexibility for handling both scheduled and unscheduled updates
- Creates a predictable invalidation pattern for maintenance

## ADR-003: Progressive Lazy Loading for HS Code Hierarchy

### Context
The HS code hierarchy is large (thousands of codes) and loading the entire hierarchy at once would consume significant memory and initialization time. However, users need access to the full hierarchy for navigation.

### Decision
We implemented a progressive lazy-loading approach for the hierarchy.

### Rationale

1. **Initial Load**: 
   - Only 2-digit chapters (01-97) are loaded at initialization
   - Minimizes startup time and initial memory footprint
   - Provides immediate access to top-level navigation

2. **On-Demand Loading**:
   - 4-digit headings are loaded when a chapter is accessed
   - 6-digit subheadings are loaded when a heading is accessed
   - Ensures data is available when needed without loading unnecessary data
   - Reduces memory usage for rarely accessed branches

3. **Pre-Loading Optimizations**:
   - The children of top suggestions are pre-loaded proactively
   - Provides better user experience with faster navigation
   - Balances performance and resource usage

4. **Configurability**:
   - `preloadDepth` configuration option allows tuning the balance
   - Can be adjusted based on available resources and performance requirements

### Consequences
- Optimizes memory usage while ensuring data availability
- Improves perceived performance for users
- Scales well with large datasets
- Creates a more responsive user experience

## ADR-004: Confidence Scoring Mechanism

### Context
When suggesting HS codes for products, we need to provide users with a clear indication of the confidence in each suggestion to help guide their decision-making.

### Decision
We implemented a sophisticated confidence scoring mechanism with category boosting and hierarchical inheritance.

### Rationale

1. **Base Confidence**:
   - Derived from semantic matching between product descriptions and HS code descriptions
   - Provides a foundation based on text similarity

2. **Category Boost**:
   - When a suggested HS code chapter matches the expected chapters for a product category, confidence is boosted
   - Increases confidence by up to 20% for category-aligned suggestions
   - Helps handle ambiguous products that could match multiple categories

3. **Hierarchical Confidence Inheritance**:
   - Child codes inherit confidence from their parent codes with a slight reduction
   - Reflects increased specificity at deeper levels of the hierarchy
   - Maintains consistency across the hierarchy

4. **Threshold Filtering**:
   - Only suggestions with confidence above the configurable threshold are returned
   - Prevents low-quality suggestions from being presented to users
   - Default threshold of 0.6 balances precision and recall

### Consequences
- Provides more accurate and reliable suggestions
- Helps users distinguish between high and low confidence matches
- Creates a consistent scoring model across the hierarchy
- Prioritizes category-appropriate suggestions 