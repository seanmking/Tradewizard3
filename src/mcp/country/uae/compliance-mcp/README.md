# UAE Compliance MCP

This Model Context Protocol (MCP) provides regulatory compliance information for products entering the UAE market.

## Features

- UAE-specific regulatory requirements lookup
- Free zone compliance requirements
- Certification and documentation guidance
- Emirates-specific regulations

## Components

- `UaeComplianceMCPService`: Implementation of the UAE compliance service
- `UaeComplianceMCP`: Interface defining the contract for compliance lookup
- `UaeComplianceResult`: Result structure for compliance queries
- `UaeComplianceRequirement`: Detailed compliance requirements for a product
- `UaeRegulation`: UAE-specific regulations structure
- `UaeCertification`: Structure for required certifications
- `UaeRestriction`: Import/export restriction details
- `UaeFreeZoneRequirement`: Free zone specific requirements

## Usage

```typescript
import uaeComplianceMCP from '@/mcp/country/uae/compliance-mcp';

// Get compliance requirements by product description
const complianceByProduct = await uaeComplianceMCP.getComplianceRequirements('smartphone');

// Get compliance requirements by HS Code
const complianceByHSCode = await uaeComplianceMCP.getComplianceByHsCode('8517.12');

// Get Free Zone specific requirements
const freeZoneRequirements = await uaeComplianceMCP.getFreeZoneRequirements('8517.12', 'Dubai Silicon Oasis');
```

## UAE-Specific Features

### Free Zone Compliance
The UAE has numerous free zones, each with unique regulatory frameworks. This MCP provides:
- Free zone specific import requirements
- Documentation needed for free zone operations
- Exemptions available in specific free zones

### Emirates Coverage
Coverage for all seven emirates:
- Abu Dhabi
- Dubai
- Sharjah
- Ajman
- Umm Al Quwain
- Ras Al Khaimah
- Fujairah

## Data Sources

This MCP leverages various UAE regulatory sources:
- Emirates Authority for Standardization & Metrology (ESMA)
- Ministry of Climate Change and Environment (MOCCAE)
- Telecommunications Regulatory Authority (TRA)
- Free Zone authorities
- Federal Customs Authority

## Dependencies

- Global HSCode Tariff MCP for product classification
- Logger utility for operational monitoring 