# TradeWizard 3.0 MCP Cursor Rules

## Architecture Implementation Rules

### 1. MCP Structure Principles

#### 1.1 Global MCPs
- Create a Global HS Code MCP that wraps the existing classification services
- **Move existing Market Intelligence MCP to the global directory structure**
- Enhance current Compliance MCP to serve as an aggregator
- Maintain consistent interfaces across all MCPs

#### 1.2 Country-Specific MCPs
- Create a consistent three-part structure for each country:
  * HS & Tariff MCP
  * Market Intelligence MCP
  * Compliance MCP
- Each country MCP should follow identical patterns for consistency
- Directory structure should be `src/mcp/country/{country}/{type}-mcp/`
- Implement clear communication with global MCPs

### 2. HS Classification Integration

#### 2.1 Leveraging Existing Classification Services
- Use the existing `EmbeddingService` and `ProductMapper` from the feature branch
- Do not modify the core classification logic, only wrap it in MCP interfaces
- Respect the existing API contracts and return types
- Extend functionality without duplicate implementation

#### 2.2 Country-Specific Classification
- Country HS MCPs must extend the global classification results
- Implement country-specific API integrations
- Handle extended HS codes (beyond 6 digits) in country MCPs
- Cache country-specific classification results

### 3. Data Flow Rules

#### 3.1 Assessment Phase Management
- Implement three distinct phases in the assessment flow:
  * Phase 1: Global Assessment
  * Phase 2: Country-Specific Analysis
  * Phase 3: Final Report Generation
- Use the AI Agent to orchestrate phase transitions
- Preserve data between phases
- Implement state management for assessment progress

#### 3.2 MCP Communication Pattern
- Global MCPs should aggregate data from country-specific MCPs
- Use the Orchestration Service for coordinating between MCPs
- Implement proper error handling for failed MCP communication
- Cache results of expensive operations
- Ensure proper typing of all data passed between MCPs

### 4. Code Structure Guidelines

#### 4.1 Directory Structure
Extend the existing structure with new directories:
```
src/
├── mcp/
│   ├── global/                             # NEW: Global MCPs
│   │   ├── hs-code-mcp/                    # NEW: Global HS Classification
│   │   └── market-intelligence-mcp/        # MOVED: From root mcp directory
│   ├── country/                            # NEW: Country-specific MCPs
│   │   ├── uae/                            # NEW: UAE-specific MCPs
│   │   │   ├── hs-tariff-mcp/              # NEW: UAE HS & Tariff MCP
│   │   │   ├── market-intelligence-mcp/    # NEW: UAE Market Intelligence MCP
│   │   │   └── compliance-mcp/             # NEW: UAE Compliance MCP
│   │   └── uk/                             # NEW: UK-specific MCPs
│   │       ├── hs-tariff-mcp/              # NEW: UK HS & Tariff MCP
│   │       ├── market-intelligence-mcp/    # NEW: UK Market Intelligence MCP
│   │       └── compliance-mcp/             # NEW: UK Compliance MCP
│   ├── compliance-mcp/                     # EXISTING: Enhance as aggregator
│   └── intelligence-mcp/                   # EXISTING: Use for validation
├── services/
│   ├── classification/                     # EXISTING: From feature branch
│   │   ├── embeddingService.ts             # EXISTING: Vector-based classification
│   │   └── productMapper.ts                # EXISTING: Keyword mapping
│   ├── report-generator/                   # EXISTING: Enhance for complete reports
│   └── website-analyzer/                   # EXISTING: Product extraction enhancement
├── ai-agent/
│   ├── services/                           # EXISTING: Enhance for MCP orchestration
│   ├── extractors/                         # EXISTING: Product extraction
│   └── phases/                             # NEW: Assessment phase controllers
└── components/
    ├── assessment/                         # EXISTING: Enhance flow
    ├── classification/                     # NEW: Product classification UI
    └── report/                             # EXISTING: Enhance report display
```

#### 4.1.1 Market Intelligence MCP Directory Migration
- Move all files from `src/mcp/market-intelligence-mcp/` to `src/mcp/global/market-intelligence-mcp/`
- Update all import paths in the codebase that reference the old location
- Maintain the same interface and exported functionality to ensure backward compatibility
- Add country-specific implementations in `src/mcp/country/{country}/market-intelligence-mcp/`

#### 4.2 File Naming Conventions
- All MCP service files: `*-mcp.service.ts`
- Interface definitions: `*.interface.ts`
- Type definitions: `*.types.ts`
- UI components: `*.tsx` or `*.jsx` (following existing pattern)
- Test files: `*.test.ts` or `*.spec.ts`

### 5. Integration with Existing Code

#### 5.1 Feature Branch Integration
- First merge the `feature/hs-classification` branch into main
- Do not modify the core classification services
- Create MCP wrappers around existing services
- Maintain backward compatibility

#### 5.2 AI Agent Integration
- Extend the existing AI Agent implementation
- Create new phase controllers in the AI Agent module
- Implement orchestration logic for the assessment flow
- Use Perplexity AI for validation through existing Intelligence MCP

#### 5.3 UI Integration
- Implement the cascading product selection UI
- Integrate with existing assessment flow components
- Follow the established UI patterns and components
- Ensure mobile responsiveness

### 6. Quality Standards

#### 6.1 Type Safety
- Use TypeScript interfaces for all MCP communications
- Ensure proper typing of all API responses
- No use of `any` type except where absolutely necessary
- Create comprehensive type definitions for MCP integration

#### 6.2 Error Handling
- Implement proper error handling for all API calls
- Use the existing retry mechanisms for external services
- Provide fallback options for classification failures
- Log errors appropriately

#### 6.3 Performance Considerations
- Use the existing caching service for expensive operations
- Leverage the optimizations in the classification services
- Implement batch processing where appropriate
- Ensure UI remains responsive during classification operations

### 7. Classification UI Implementation

#### 7.1 Cascading Dropdown Pattern
- Follow the example shown in the technical brief screenshot
- Initial product name entry triggers classification
- Show cascading dropdowns for refinement
- Allow manual overrides for expert users

#### 7.2 Classification Workflow
```
1. User enters product description
2. Global HS Code MCP provides initial classification
3. UI displays cascading dropdown options
4. User refines selection
5. Country-specific MCPs provide extended information
```

#### 7.3 UI Components
- Create reusable dropdown components
- Implement loading states during classification
- Support keyboard navigation
- Provide clear feedback on selection

### 8. Assessment Flow Implementation

#### 8.1 Phase Management
- Create phase controller classes in `src/ai-agent/phases/`
- Implement state transitions between phases
- Preserve user data throughout the assessment
- Allow navigation between completed phases

#### 8.2 Phase-Specific UI
- Create distinct UI views for each assessment phase
- Implement progress indicators
- Provide clear next/back navigation
- Allow saving of in-progress assessments

### 9. Testing Requirements

#### 9.1 Classification Testing
- Test integration with existing classification services
- Verify cascading UI functionality
- Test with common South African exports
- Verify performance meets requirements

#### 9.2 MCP Integration Testing
- Test communication between Global and Country-specific MCPs
- Verify proper aggregation in Compliance MCP
- Test error handling and fallbacks
- Verify caching mechanism functionality

#### 9.3 End-to-End Testing
- Test complete assessment flow
- Verify report generation with all MCPs
- Test with realistic user scenarios
- Validate all required data is included in the final report

### 10. Documentation Requirements

#### 10.1 Code Documentation
- Document all MCP interfaces
- Update existing documentation to reflect new architecture
- Document UI component usage
- Include examples in all interface definitions

#### 10.2 Architecture Documentation
- Update the architecture diagram with new components
- Document the assessment flow phases
- Create sequence diagrams for MCP communication
- Document integration points with existing services 