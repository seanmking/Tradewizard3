import axios from 'axios';
import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp/hs-code-mcp.service';
import { CacheService } from '@/services/cache-service';
import { 
  UkComplianceMCP, 
  UkComplianceResult, 
  UkComplianceRequirement,
  UkRegulation,
  UkCertification,
  UkRestriction
} from './uk-compliance-mcp.interface';
import { logger } from '@/utils/logger';

export class UkComplianceMCPService implements UkComplianceMCP {
  private readonly globalHsCodeMCP: GlobalHsCodeMCPService;
  private readonly cacheService: CacheService<UkComplianceResult>;
  private readonly ukComplianceApiUrl: string;
  
  constructor() {
    this.globalHsCodeMCP = new GlobalHsCodeMCPService();
    this.cacheService = new CacheService<UkComplianceResult>({
      ttl: 60 * 60 * 24 * 30 * 1000, // 30 days (compliance changes infrequently)
      maxSize: 1000
    });
    this.ukComplianceApiUrl = process.env.UK_COMPLIANCE_API_URL || 'https://api.tradewizard.app/uk-compliance';
  }
  
  async getComplianceRequirements(productDescription: string): Promise<UkComplianceResult> {
    try {
      const cacheKey = `uk-compliance:${productDescription.toLowerCase().trim()}`;
      
      // Try to get from cache first
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Get global classification first
      const globalClassification = await this.globalHsCodeMCP.classifyProduct(productDescription);
      
      // If no global classifications found, return empty result
      if (globalClassification.classifications.length === 0) {
        const emptyResult: UkComplianceResult = {
          requirements: [],
          query: productDescription,
          timestamp: new Date().toISOString(),
          globalClassification
        };
        return emptyResult;
      }
      
      // Get compliance requirements for the top global result
      const complianceRequirements = await this.getComplianceByHsCode(
        globalClassification.classifications[0].hsCode
      );
      
      const result: UkComplianceResult = {
        requirements: complianceRequirements,
        query: productDescription,
        timestamp: new Date().toISOString(),
        globalClassification
      };
      
      // Cache the result
      this.cacheService.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error(`Error getting UK compliance requirements for "${productDescription}":`, error);
      return {
        requirements: [],
        query: productDescription,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async getComplianceByHsCode(hsCode: string): Promise<UkComplianceRequirement[]> {
    try {
      const cacheKey = `uk-compliance-hs:${hsCode}`;
      
      // Try to get from cache first
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Format HS code (remove spaces and dots)
      const formattedHsCode = hsCode.replace(/[\s.]/g, '');
      
      // Call compliance API
      // In a real implementation, this would call a real API
      // For now, we'll generate mock data
      const requirements = this.generateMockComplianceRequirements(formattedHsCode);
      
      // Cache the result
      this.cacheService.set(cacheKey, requirements);
      
      return requirements;
    } catch (error) {
      logger.error(`Error getting UK compliance for HS code ${hsCode}:`, error);
      return [];
    }
  }
  
  private generateMockComplianceRequirements(hsCode: string): UkComplianceRequirement[] {
    // This is a placeholder for actual API call logic
    // In a real implementation, this would call a UK compliance data API
    
    const foodRelated = ['02', '03', '04', '07', '08', '09', '16', '19', '20'].some(
      prefix => hsCode.startsWith(prefix)
    );
    
    const electronicsRelated = ['85', '84', '90'].some(
      prefix => hsCode.startsWith(prefix)
    );
    
    const textileRelated = ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'].some(
      prefix => hsCode.startsWith(prefix)
    );
    
    const regulations: UkRegulation[] = [];
    const certifications: UkCertification[] = [];
    const restrictions: UkRestriction[] = [];
    
    // Add common UK regulations
    regulations.push({
      id: 'ukca-001',
      title: 'UK Conformity Assessment (UKCA) Marking',
      description: 'The UKCA mark is required for certain products sold in Great Britain (England, Wales, and Scotland).',
      category: 'Product Safety',
      requirements: [
        'Product testing by approved body',
        'Technical documentation',
        'Declaration of conformity',
        'UKCA marking on product'
      ],
      url: 'https://www.gov.uk/guidance/using-the-ukca-marking',
      lastUpdated: '2023-01-15'
    });
    
    // Add food-specific regulations
    if (foodRelated) {
      regulations.push({
        id: 'food-safety-001',
        title: 'UK Food Safety Standards',
        description: 'Food products must comply with UK food safety regulations.',
        category: 'Food Safety',
        requirements: [
          'Registration with Food Standards Agency',
          'Hazard Analysis and Critical Control Points (HACCP)',
          'Proper labeling with ingredients and allergens',
          'Health and nutrition claims compliance'
        ],
        url: 'https://www.food.gov.uk/business-guidance',
        lastUpdated: '2023-03-10'
      });
      
      certifications.push({
        id: 'food-cert-001',
        name: 'UK Food Hygiene Rating',
        description: 'Rating system for food businesses in England, Wales, and Northern Ireland.',
        issuingAuthority: 'Food Standards Agency',
        requirements: [
          'Inspection by local authority',
          'Compliance with food hygiene regulations',
          'Staff training records',
          'Proper food handling procedures'
        ],
        applicationProcess: 'Register with local authority for inspection',
        estimatedTimeframe: '4-6 weeks',
        estimatedCost: 'No direct cost for inspection',
        url: 'https://www.food.gov.uk/business-guidance/food-hygiene-ratings-for-businesses'
      });
    }
    
    // Add electronics-specific regulations
    if (electronicsRelated) {
      regulations.push({
        id: 'rohs-001',
        title: 'UK RoHS (Restriction of Hazardous Substances)',
        description: 'Restricts the use of specific hazardous materials in electronics.',
        category: 'Environmental',
        requirements: [
          'Products must not contain restricted substances above maximum concentration values',
          'Technical documentation',
          'Declaration of conformity',
          'CE or UKCA marking'
        ],
        url: 'https://www.gov.uk/guidance/rohs-compliance-and-guidance',
        lastUpdated: '2022-11-30'
      });
      
      certifications.push({
        id: 'ee-cert-001',
        name: 'UK Electrical Equipment Certification',
        description: 'Certification for electrical equipment safety.',
        issuingAuthority: 'Office for Product Safety and Standards',
        requirements: [
          'Product testing by approved body',
          'Technical documentation',
          'Risk assessment',
          'Quality management system'
        ],
        applicationProcess: 'Submit application to approved body with technical documentation',
        estimatedTimeframe: '6-10 weeks',
        estimatedCost: '£2,000 - £5,000',
        url: 'https://www.gov.uk/government/organisations/office-for-product-safety-and-standards'
      });
    }
    
    // Add textile-specific regulations
    if (textileRelated) {
      regulations.push({
        id: 'textile-001',
        title: 'UK Textile Products (Labelling and Fibre Composition) Regulations',
        description: 'Requirements for labeling textile products with fiber composition.',
        category: 'Consumer Protection',
        requirements: [
          'Accurate labeling of fiber composition',
          'Labels must be durable and legible',
          'Specific information requirements for certain products',
          'Technical documentation'
        ],
        url: 'https://www.gov.uk/government/publications/textile-products-labelling-regulations-2012',
        lastUpdated: '2022-09-15'
      });
    }
    
    // Add general restrictions
    if (foodRelated) {
      restrictions.push({
        type: 'restriction',
        description: 'Food Import Restrictions',
        details: 'Certain food products may require health certificates and must enter through designated Border Control Posts.',
        exceptions: ['Processed foods with shelf-stable properties may have simplified requirements'],
        url: 'https://www.gov.uk/guidance/importing-food-and-drink-from-the-eu-and-northern-ireland-to-great-britain'
      });
    }
    
    if (electronicsRelated) {
      restrictions.push({
        type: 'license',
        description: 'Waste Electrical and Electronic Equipment (WEEE) Registration',
        details: 'Manufacturers, importers and retailers must register with the Environment Agency and take responsibility for collecting and recycling end-of-life products.',
        exceptions: ['Business-to-business electronics may have different requirements'],
        url: 'https://www.gov.uk/guidance/electrical-and-electronic-equipment-eee-producer-responsibility'
      });
    }
    
    return [{
      hsCode,
      regulations,
      certifications,
      restrictions,
      generalNotes: [
        'UK regulations have diverged from EU regulations since Brexit',
        'Northern Ireland follows different rules due to the Northern Ireland Protocol',
        'Check with HMRC for the most up-to-date compliance requirements'
      ],
      lastUpdated: new Date().toISOString()
    }];
  }
} 