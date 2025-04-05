# TradeWizard 3.0

## Project Overview

TradeWizard is an intelligent business analysis tool that combines advanced web scraping with AI-powered insights to help businesses assess their export readiness and opportunities in global markets.

### Key Features

- **AI-Powered Website Analysis**: Extracts business and product information from websites
- **Export Readiness Assessment**: Evaluates business preparedness for international markets
- **HS Code Classification**: Automatically categorizes products using Harmonized System codes
- **Regulatory Compliance Checks**: Identifies export requirements and restrictions
- **Market Intelligence**: Provides insights on target markets, competitors, and opportunities

## Architecture

TradeWizard 3.0 is built on a modular architecture with the following key components:

### Model Context Protocols (MCPs)

The system implements Model Context Protocols to integrate various data sources and services:

- **Global MCPs**: Core services that provide data applicable across markets
  - `HSCodeTariffMCPService`: Maps products to HS codes and tariff information
  - `ComplianceMCPService`: Provides regulatory compliance information
  - `MarketIntelligenceMCPService`: Delivers market insights and opportunities

- **Country-Specific MCPs**: Specialized services for specific target markets
  - UAE MCPs: Compliance and market intelligence for UAE exports
  - UK MCPs: Compliance and market intelligence for UK exports

### AI Agent Layer

Leverages multiple AI models to analyze and enrich data:

- `LLMWebsiteExtractor`: Uses OpenAI and Perplexity AI to extract business/product data from websites
- `PerplexityVerificationService`: Validates extracted information
- `IntelligenceService`: Enhances data with contextual insights

### Core Services

- `HSCodeHierarchyService`: Manages HS code navigation and selection
- `ProductConsolidationService`: Groups and normalizes similar products
- `OrchestrationService`: Coordinates the assessment workflow
- `ReportGeneratorService`: Creates export readiness reports

### Frontend Components

Built with Next.js, React, and Material-UI:

- Assessment workflow with multi-step interface
- Product selection and classification tools
- HS code navigator with hierarchical selection
- Export readiness reports and recommendations

## Current Implementation Status

**Overall Status: Beta - Major Features Implemented with Known Issues**

### Implemented Features

- ✅ Basic assessment workflow
- ✅ Website data extraction
- ✅ Product categorization and consolidation
- ✅ HS code classification
- ✅ UI components and navigation

### Known Issues

- ⚠️ API key configuration problems (see CRITICAL-ISSUES.md)
- ⚠️ Product extraction reliability issues
- ⚠️ Incomplete fallback mechanisms for MCP services
- ⚠️ UI component rendering inefficiencies
- ⚠️ Authentication errors with OpenAI API

See [CRITICAL-ISSUES.md](./CRITICAL-ISSUES.md) for more details.

## Installation and Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for:
  - OpenAI
  - Perplexity AI
  - HS Code / WITS APIs

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/seanmking/tradewizard-3-review.git
cd tradewizard-3-review
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` to add your API keys and configuration.

4. Run the API key setup checker:
```bash
./fix-api-keys.sh
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Configuration and Mock Data

TradeWizard uses several external APIs to power its features. The application includes a robust mock data system for development and testing when API keys are not available.

### Required API Keys

The following API keys should be configured in your `.env.local` file:

```bash
# OpenAI API (for AI-powered analysis)
OPENAI_API_KEY=your_openai_api_key

# HS Code API (for HS code classification)
HS_CODE_API_KEY=your_hs_code_api_key

# WITS API (World Integrated Trade Solution - for tariff data)
WITS_API_KEY=your_wits_api_key
WITS_API_BASE_URL=https://wits.worldbank.org/API/V1/WITS
```

### Mock Data System

When API keys are not configured, TradeWizard automatically falls back to using mock data. This is indicated with a yellow warning banner in the UI to ensure transparency during development.

#### Mock Data Coverage

| Service | Mock Data Coverage | Limitations |
|---------|-------------------|-------------|
| HS Code Classification | All HS chapters (2-digit) | Limited headings/subheadings |
| WITS API | Common product categories | Limited tariff data |
| Product Examples | Popular products in electronics, textiles, food | Limited examples per category |

#### Configuring Mock Data Behavior

You can control the mock data behavior by setting the following environment variables:

```bash
# Force use of mock data even if API keys are present
USE_MOCK_DATA=true

# Configure mock data detail level (basic, standard, comprehensive)
MOCK_DATA_DETAIL=standard
```

#### Data Quality Comparison

| Feature | Real API Data | Mock Data |
|---------|--------------|-----------|
| HS Code Coverage | Complete HS nomenclature | ~40% coverage of common codes |
| Classification Confidence | Real confidence scores | Fixed confidence distributions |
| Product Examples | Current market examples | Static examples from 2021-2022 |
| Tariff Information | Current global tariff data | Limited to major countries |

#### Developing with Mock Data

For development purposes, mock data provides sufficient functionality to test most application features. However, for production deployments, real API keys are required for accurate data.

The mock data system is implemented in:
- `src/contexts/mock-data-context.tsx` - Global mock data state management
- `src/components/ui/MockDataBanner.tsx` - UI indicator for mock data usage
- Service-specific mock implementations in each MCP

## Development Guidelines

### Code Structure

- `src/mcp/`: Model Context Protocol implementations
- `src/services/`: Core application services
- `src/components/`: React components
- `src/ai-agent/`: AI integration services
- `src/utils/`: Utility functions and helpers
- `src/types/`: TypeScript type definitions
- `src/contexts/`: React contexts for state management
- `src/pages/`: Next.js page components

### Contribution Workflow

1. Create a feature branch from `main`
2. Implement changes following the architecture patterns
3. Test thoroughly, addressing issues in CRITICAL-ISSUES.md
4. Submit PR with detailed description of changes

## Technical Review Focus Areas

1. **Architecture Alignment**: Evaluate MCP implementation against design goals
2. **AI Integration**: Assess the effectiveness of AI agent implementations
3. **Performance**: Identify bottlenecks in extraction and processing
4. **Error Handling**: Review robustness of error recovery mechanisms
5. **Code Quality**: Evaluate adherence to best practices and patterns

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- API keys for various services

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables (see below)
4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

## API Keys Setup

TradeWizard 3.0 uses several external APIs that require API keys:

1. Create a `.env.local` file in the root directory (based on `.env.local.template`)
2. Add your API keys to this file:

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

3. Verify API key configuration by running:

```bash
node scripts/check-api-keys.js
```

## Architecture

### API Key Manager

The application uses a centralized API key manager to handle API keys securely:

- All API keys are loaded from environment variables
- The API key manager works in both client and server contexts
- Services use the API key manager to access keys instead of directly reading environment variables

Example usage:

```javascript
import { ApiKeyManager } from '@/utils/api-key-manager';

// Get API key manager instance
const apiKeyManager = ApiKeyManager.getInstance();

// Get API keys
const openaiKey = apiKeyManager.getKeyValue('openai');
const witsKey = apiKeyManager.getKeyValue('wits');

// Get API URLs
const openaiUrl = apiKeyManager.getApiUrl('openai');
```

## Features

- HS Code lookup and classification
- Tariff information retrieval
- Market intelligence analysis
- Website extraction and analysis

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentation

Additional documentation can be found in the `docs/` directory:

- [API Key Manager Implementation](./docs/api-key-manager-implementation.md)
