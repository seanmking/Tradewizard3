# UK HS Code MCP for South African Exporters

This document provides detailed information about using the UK HS Code MCP for South African exporters to the United Kingdom market.

## Overview

The UK HS Code MCP has been enhanced with specialized features for South African exporters, allowing businesses to access country-specific tariff information, preferential duty rates under the UK-SACU+M Economic Partnership Agreement, and applicable measures and documentation requirements.

## Key Features for South African Exporters

### Preferential Tariff Information

South African exports benefit from preferential tariff rates under the UK-SACU+M Economic Partnership Agreement:

- Zero-rated duties on many products
- Reduced tariff rates compared to standard third-country rates
- Quota information for specific product categories (e.g., wine, agricultural products)

### Country-Specific Measures

The service provides information on measures that specifically apply to South Africa:

- Import requirements for South African goods
- Surveillance measures
- Documentary requirements specific to South African origins
- Exclusions or inclusions in geographical area groups

### Documentation Requirements

Identify all required documentation for South African exports to the UK, including:

- Certificates of origin for claiming preferential tariff treatment
- Phytosanitary certificates for agricultural products
- Product-specific certification and licensing requirements

### Comparative Analysis

Compare tariff rates for products from South Africa versus other countries to identify:

- Competitive advantages for South African exports
- Products with the most favorable preferential treatment
- Products subject to quotas or additional requirements

## Usage

### Initializing the Service

```typescript
import { UkHsCodeMcpService } from '../mcp/uk-hs-code-mcp/uk-hs-code-mcp.service';

// Initialize the service
const ukHsCodeService = new UkHsCodeMcpService();
```

### Searching for HS Codes with South African Origin

```typescript
// Search for HS codes by description, specifying South Africa as origin
const searchResult = await ukHsCodeService.getHsCode({ 
  description: 'macadamia nuts', 
  originCountry: 'ZA'  // ISO code for South Africa
});
```

### Getting Detailed Information for a Specific Commodity Code

```typescript
// Get details for a specific commodity code for South African exports
const detailsResult = await ukHsCodeService.getCommodityDetails({ 
  commodityCode: '0802620000',  // Macadamia nuts, shelled
  originCountry: 'ZA'  // ISO code for South Africa
});
```

### Comparing Tariffs Across Origin Countries

```typescript
// Function to compare tariffs for the same product from different countries
async function compareTariffs(commodityCode) {
  const countries = [
    { code: 'ZA', name: 'South Africa' },
    { code: 'CN', name: 'China' },
    { code: 'US', name: 'United States' }
  ];
  
  const results = {};
  
  for (const country of countries) {
    const response = await ukHsCodeService.getCommodityDetails({
      commodityCode,
      originCountry: country.code
    });
    
    if (response.success && response.data && response.data.length > 0) {
      results[country.name] = response.data[0];
    }
  }
  
  return results;
}

// Example usage
const comparisonResults = await compareTariffs('0802620000'); // Macadamia nuts
```

## Response Format

A successful search response for South African exports will include:

```json
{
  "success": true,
  "data": [
    {
      "commodityCode": "0802620000",
      "description": "Macadamia nuts, shelled",
      "duty_calculations": [
        {
          "measure_type": "UK Global Tariff",
          "duty_rate": "2.00%",
          "is_preferential": false
        },
        {
          "measure_type": "Preferential Tariff",
          "duty_rate": "0.00%",
          "is_preferential": true
        }
      ],
      "vat_rate": {
        "rate": "0%",
        "type": "zero"
      },
      "applicable_measures": [
        {
          "measure_type": "Phytosanitary Certificate",
          "is_prohibition": false,
          "is_restriction": true,
          "conditions": [
            {
              "document_code": "C640",
              "requirement": "Phytosanitary Certificate required"
            }
          ],
          "geographical_area": {
            "id": "1011",
            "description": "All countries"
          }
        }
      ],
      "footnotes": [
        {
          "code": "CD500",
          "description": "Products under this commodity code benefit from the UK-SACU+M Economic Partnership Agreement when imported from South Africa."
        }
      ]
    }
  ],
  "message": "HS codes found successfully"
}
```

## UK-SACU+M Economic Partnership Agreement

The UK-SACU+M (Southern African Customs Union plus Mozambique) Economic Partnership Agreement provides preferential treatment for goods originating from:

- South Africa
- Botswana
- Eswatini
- Lesotho
- Namibia
- Mozambique

South African exporters must ensure that their products meet the origin requirements specified in the agreement to benefit from preferential tariff rates.

## Implementation Details

The UK HS Code MCP for South African exporters includes:

1. Integration with the UK Trade Tariff API
2. Country-specific filtering of applicable measures
3. Support for preferential duty rate identification
4. Mock mode for testing and development

### Mock Mode

The service includes a mock mode that can be enabled by setting the `USE_MOCK` flag to `true`. The mock data includes representative examples of South African exports to the UK with their applicable preferential rates and requirements.

## Testing

Test the UK HS Code service for South African exports using:

```bash
npm run test:uk-hs
```

The test script includes examples of:
- Searching for various products from South Africa
- Getting detailed information for specific commodity codes
- Comparing tariff rates across different origin countries 