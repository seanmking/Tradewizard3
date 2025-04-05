# HSCode Tariff MCP

The HSCode Tariff Model Context Protocol (MCP) provides a standardized interface for HS code classification, product details retrieval, and tariff rate information across global trade data.

## Overview

This global MCP serves as the foundation for country-specific HS code and tariff implementations, ensuring consistent data structures and interfaces throughout the application. It provides 6-digit HS code classifications (the international standard) that can be extended by country-specific MCPs with more detailed national tariff lines.

## Features

- HS code search and classification based on product descriptions
- Detailed product information for HS codes (sections, chapters, restrictions)
- Global tariff rate information with preferential trade agreement data
- Standardized interface aligned with country-specific tariff MCPs

## Components

### Interfaces

- `HSCodeLookupRequest`: Request structure for HS code lookups
- `HSCodeSearchResult`: Result structure for HS code search operations
- `HSCodeTariffInfo`: Comprehensive information about an HS code classification
- `HSCodeResult`: Complete result of an HS classification operation
- `TariffRate`: Detailed tariff rate information with preferences and special provisions

### Service

The `HSCodeTariffMCPService` implements the `HSCodeTariffMCP` interface, providing:

- HS code search functionality
- Product information retrieval
- Tariff rate data with country-specific details
- Data caching for improved performance

## Integration with WITS API

The MCP integrates with the World Integrated Trade Solution (WITS) API from the World Bank, providing:

- Global HS code classification data
- Detailed product information including sections, chapters, and notes
- Tariff rates across countries with special preferences
- Historical tariff data

## Usage Examples

### Searching for HS Codes

```typescript
const hsTariffMCP = new HSCodeTariffMCPService();

// Search for HS codes based on product description
const request = {
  searchQuery: "smartphone",
  exactMatch: false
};

const results = await hsTariffMCP.searchHSCodes(request);
console.log(results);
```

### Getting Product Information

```typescript
const hsTariffMCP = new HSCodeTariffMCPService();

// Get HS code information based on product description
const result = await hsTariffMCP.getHsCodeInfo("laptop computer");
console.log(result.classifications);
```

### Getting Tariff Rates

```typescript
const hsTariffMCP = new HSCodeTariffMCPService();

// Get tariff rates for a specific HS code and countries
const rates = await hsTariffMCP.getTariffRates("851712", "US", "CN");
console.log(rates);
```

## Alignment with Country-Specific MCPs

This global HSCode Tariff MCP is designed to align seamlessly with country-specific implementations:

- The `HSCodeTariffInfo` interface maps to `UkHsCodeTariffInfo` and `UaeHsCodeTariffInfo`
- The `HSCodeResult` structure follows the same pattern as `UkHsCodeResult` and `UaeHsCodeResult`
- Method signatures are compatible with country extensions

Country-specific MCPs can extend this global implementation to add:
- National tariff line details beyond 6 digits
- Country-specific duty and tax information
- Special import requirements and documentation
- Local regulatory information

## Fallback and Caching

The MCP includes:

- Comprehensive fallback data when the WITS API is unavailable
- Intelligent caching system to improve performance and reduce API calls
- Detailed logging of all operations and API interactions

## Dependencies

- HTTP client for API communication
- Caching service for improved performance
- Logging utility for monitoring and debugging

## Data Sources

This MCP can utilize various data sources:

1. **International HS Code Databases**: Connects to standard HS code lookup APIs
2. **Mock Data**: Provides sensible mock data when API connections aren't available

## Customization

The global MCP serves as a foundation for country-specific HSCode tariff MCPs that enhance the data with local tariff information:

- `UK HSCode Tariff MCP`: Adds UK-specific tariff information including post-Brexit tariffs
- `UAE HSCode Tariff MCP`: Adds UAE and GCC-specific tariff information

## Dependencies

- External API services for HS code lookup
- Logger utility for operational monitoring 