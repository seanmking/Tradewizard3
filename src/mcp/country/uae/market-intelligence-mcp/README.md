# UAE Market Intelligence MCP

This Model Context Protocol (MCP) delivers UAE-specific market intelligence data for businesses looking to export to or operate in the United Arab Emirates market.

## Features

- UAE-specific market statistics and insights
- GCC trade information
- UAE regulations and standards
- Free Zone analysis for different industry sectors
- Integration with global market intelligence data

## Components

- `UaeMarketIntelligenceMCPService`: Implementation of the UAE-specific market intelligence service
- `UaeMarketIntelligenceMCP`: Interface defining the contract for UAE market intelligence
- `UaeMarketIntelligenceRequest`: Request object structure for UAE market inquiries
- `UaeMarketInsight`: UAE-specific market insight data structure
- `UaeMarketStatistic`: Structure for UAE-specific market statistics
- `UaeRegulation`: Structure for UAE regulatory information

## Usage

```typescript
import uaeMarketIntelligenceMCP from '@/mcp/country/uae/market-intelligence-mcp';

// Create a request with UAE-specific options
const request = {
  productCategories: ['furniture', 'home décor'],
  targetMarkets: ['UAE', 'GCC'],
  businessProfile: {
    // Business profile information
  },
  includeFreeZoneAnalysis: true,
  includeRegulations: true
};

// Get UAE market insights
const uaeInsights = await uaeMarketIntelligenceMCP.getUaeMarketInsights(request);
```

## UAE-Specific Data

This MCP enhances global market intelligence with UAE-specific information:

1. **UAE Market Statistics**: Import/export values, market growth rates, and market trends specific to the UAE.

2. **UAE Regulations**: Information about UAE-specific regulations, conformity requirements, and standards.

3. **GCC Trade Information**: Details about intra-GCC trade benefits, tariff exemptions, and market access.

4. **Free Zone Analysis**: Recommendations for relevant UAE free zones based on product categories and industry sectors.

## Integration

This MCP extends the global Market Intelligence MCP and enhances its data with UAE-specific information, leveraging:

- UAE Federal Competitiveness and Statistics Centre data
- Dubai Chamber of Commerce information
- UAE Ministry of Economy market reports
- Free Zone authority information

## Dependencies

- Global Market Intelligence MCP
- Cache Service for optimized performance
- Logger utility for operational monitoring 