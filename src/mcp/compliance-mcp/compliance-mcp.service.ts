import { 
  ComplianceMCP, 
  ComplianceRequest, 
  ComplianceMCPResponse, 
  ComplianceRequirement 
} from './compliance-mcp.interface';
import axios from 'axios';
import { logger } from '@/utils/logger';

export class ComplianceMCPService implements ComplianceMCP {
  private tariffApiBaseUrl: string;
  private tradeStatsApiBaseUrl: string;
  
  constructor() {
    this.tariffApiBaseUrl = process.env.WITS_TARIFF_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/';
    this.tradeStatsApiBaseUrl = process.env.WITS_TRADESTATS_URL || 'https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/';
    
    logger.info('ComplianceMCPService initialized');
  }
  
  async getRequirements(request: ComplianceRequest): Promise<ComplianceMCPResponse> {
    try {
      logger.info(`Getting compliance requirements for ${request.productCategories.join(', ')} in markets ${request.targetMarkets.join(', ')}`);
      
      // Fetch data from multiple sources
      const requirements: ComplianceRequirement[] = [];
      
      // Process each target market
      for (const marketCode of request.targetMarkets) {
        const marketRequirements = await this.fetchMarketRequirements(
          marketCode,
          request.productCategories
        );
        
        requirements.push(...marketRequirements);
      }
      
      // Calculate totals
      const totalEstimatedCost = this.calculateTotalCost(requirements);
      const totalEstimatedTimelineInDays = this.calculateTotalTimeline(requirements);
      
      return {
        requirements,
        totalEstimatedCost,
        totalEstimatedTimelineInDays
      };
      
    } catch (error) {
      logger.error(`Error in ComplianceMCPService.getRequirements: ${error}`);
      throw new Error('Failed to get compliance requirements');
    }
  }
  
  private async fetchMarketRequirements(
    marketCode: string, 
    productCategories: string[]
  ): Promise<ComplianceRequirement[]> {
    try {
      // Try to fetch real data from WITS API
      try {
        logger.info(`Fetching real compliance data from WITS for ${marketCode}`);
        
        // Get HS code for the first product category (simplified)
        const hsCode = this.getHSCodeForProductCategory(productCategories[0]);
        
        // Format for WITS API according to documentation
        // URL: /datasource/TRN/reporter/{Reporter Code}/partner/{Partner Code}/product/{Product Code}/year/{Year}/datatype/reported
        const url = `${this.tariffApiBaseUrl}${marketCode}/partner/000/product/${hsCode}/year/${new Date().getFullYear() - 1}/datatype/reported?format=JSON`;
        
        logger.info(`Calling WITS API: ${url}`);
        const response = await axios.get(url);
        
        // Process real data from WITS if available
        const responseData = response.data as any;
        if (responseData && responseData.dataset && responseData.dataset.series) {
          logger.info('Successfully fetched data from WITS API');
          
          // Also get trade stats data
          // Format: /datasource/tradestats-tariff/reporter/{Reporter Code}/year/{Year}/partner/{Partner Code}/product/{Product Code}/indicator/{Indicator}
          const tradeStatsUrl = `${this.tradeStatsApiBaseUrl}${marketCode}/year/${new Date().getFullYear() - 1}/partner/wld/product/all/indicator/TRF-NMBR-AGGRMNT?format=JSON`;
          const tradeStatsResponse = await axios.get(tradeStatsUrl);
          
          logger.info('Successfully fetched trade stats data from WITS API');
          
          // This is where you would extract requirements based on real data
          // For now, implementation would depend on specific data structure
        }
      } catch (apiError) {
        logger.error(`Error accessing WITS API: ${apiError}`);
        // Fall back to mock data
      }
      
      // Fall back to mock data
      const requirements: ComplianceRequirement[] = [];
      
      // Common requirements across different product categories
      const commonRequirements = [
        {
          id: `cr-${marketCode}-001`,
          name: 'Registration as Exporter',
          description: 'Business must be registered as an exporter with the local export authority.',
          isRequired: true,
          estimatedCost: {
            min: 200,
            max: 500,
            currency: 'USD'
          },
          estimatedTimelineInDays: 30,
          countryCode: marketCode,
          regulatoryBody: 'Department of Trade and Industry',
          productCategories: ['all'],
          documentationNeeded: ['Business registration', 'Tax clearance certificate']
        },
        {
          id: `cr-${marketCode}-002`,
          name: 'Export Permit',
          description: 'An export permit specific to the product category.',
          isRequired: true,
          estimatedCost: {
            min: 100,
            max: 300,
            currency: 'USD'
          },
          estimatedTimelineInDays: 14,
          countryCode: marketCode,
          regulatoryBody: 'Customs Authority',
          productCategories: ['all'],
          documentationNeeded: ['Product specification sheets', 'Origin certificate']
        }
      ];
      
      requirements.push(...commonRequirements);
      
      // Product-specific requirements
      for (const category of productCategories) {
        const categoryRequirements = this.getCategorySpecificRequirements(category, marketCode);
        requirements.push(...categoryRequirements);
      }
      
      return requirements;
      
    } catch (error) {
      logger.error(`Error fetching market requirements for ${marketCode}: ${error}`);
      return [];
    }
  }
  
  private getHSCodeForProductCategory(category: string): string {
    // Map product categories to HS codes (Harmonized System codes)
    const hsCodeMap: Record<string, string> = {
      'food': '16',
      'beverage': '22',
      'agricultural': '10',
      'electronics': '85',
      'electrical': '85',
      'textile': '52',
      'apparel': '61',
      'clothing': '62',
      'furniture': '94',
      'automotive': '87',
      'chemicals': '28',
      'pharmaceuticals': '30',
      'cosmetics': '33',
      'toys': '95',
      'jewelry': '71'
    };
    
    // Find a matching HS code for the category
    for (const [key, code] of Object.entries(hsCodeMap)) {
      if (category.toLowerCase().includes(key)) {
        return code;
      }
    }
    
    // Default HS code for other categories
    return 'TOTAL'; // TOTAL will get all HS codes
  }
  
  private getFoodProductRequirements(marketCode: string): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [
      {
        id: 'food-export-base',
        name: 'Food Export Base Requirements',
        description: 'Base requirements for food product exports from South Africa',
        isRequired: true,
        estimatedCost: {
          min: 175,
          max: 500,
          currency: 'ZAR'
        },
        estimatedTimelineInDays: 7,
        countryCode: 'ZA',
        regulatoryBody: 'Multiple SA Authorities',
        productCategories: ['Food Products - Frozen/Canned Goods', 'Food Products - Processed Foods'],
        exporterRegistration: {
          sarsRegistrationRequired: true,
          itacPermitRequired: false,
          facilityCertificationRequired: true,
          haccp: {
            required: true,
            level: 'Full HACCP Implementation'
          },
          halal: {
            required: false,
            acceptedCertifiers: ['SANHA', 'MJC']
          }
        },
        marketSpecificCompliance: [
          {
            countryCode: 'AE',
            labeling: {
              nutritionLabelMandatory: false,
              requiredLanguages: ['Arabic', 'English'],
              specializedLabels: [
                {
                  type: 'Halal',
                  required: true,
                  details: 'Must display Halal certification mark'
                }
              ],
              shelfLifeMonths: 24,
              ingredientRestrictions: {
                hasBannedIngredients: true,
                bannedList: ['Pork', 'Pork derivatives', 'Alcohol']
              }
            },
            marketRequirements: {
              halalCertificationMandatory: true,
              organicCertificationRequired: false,
              productTestingRequired: false,
              foodSafetyCertifications: ['HACCP']
            },
            tariffAndTrade: {
              tariffRatePercentage: 5,
              hasQuotaRestrictions: false,
              hasProductBans: false
            },
            customs: {
              exportHealthCertificateRequired: true,
              phytosanitaryCertificateRequired: false,
              preShipmentInspectionRequired: true,
              electronicFilingMandatory: true
            }
          },
          {
            countryCode: 'US',
            labeling: {
              nutritionLabelMandatory: true,
              requiredLanguages: ['English'],
              specializedLabels: [
                {
                  type: 'FDA',
                  required: true,
                  details: 'FDA compliant nutrition facts panel'
                }
              ],
              ingredientRestrictions: {
                hasBannedIngredients: true,
                bannedList: ['Unapproved additives', 'Non-FDA compliant ingredients']
              }
            },
            marketRequirements: {
              halalCertificationMandatory: false,
              organicCertificationRequired: false,
              productTestingRequired: true,
              testingTypes: ['FDA compliance testing', 'Microbiological analysis'],
              foodSafetyCertifications: ['HACCP', 'FSMA compliance']
            },
            tariffAndTrade: {
              tariffRatePercentage: 2.5,
              hasQuotaRestrictions: false,
              hasProductBans: false
            },
            customs: {
              exportHealthCertificateRequired: true,
              phytosanitaryCertificateRequired: true,
              preShipmentInspectionRequired: false,
              electronicFilingMandatory: true,
              additionalDocuments: ['Prior Notice of Imported Foods']
            }
          },
          {
            countryCode: 'GB',
            labeling: {
              nutritionLabelMandatory: true,
              requiredLanguages: ['English'],
              specializedLabels: [
                {
                  type: 'HFSS',
                  required: true,
                  details: 'High in Fat, Salt or Sugar labeling if applicable'
                }
              ],
              ingredientRestrictions: {
                hasBannedIngredients: true,
                bannedList: ['Unapproved additives', 'Non-UK/EU compliant ingredients']
              }
            },
            marketRequirements: {
              halalCertificationMandatory: false,
              organicCertificationRequired: false,
              productTestingRequired: true,
              testingTypes: ['UK compliance testing', 'Nutritional analysis'],
              foodSafetyCertifications: ['HACCP', 'BRC optional but recommended']
            },
            tariffAndTrade: {
              tariffRatePercentage: 0,
              hasQuotaRestrictions: false,
              hasProductBans: false
            },
            customs: {
              exportHealthCertificateRequired: true,
              phytosanitaryCertificateRequired: true,
              preShipmentInspectionRequired: false,
              electronicFilingMandatory: true
            }
          }
        ]
      }
    ];

    // Add existing specific certification requirements
    requirements.push(...this.getBaseCertificationRequirements());
    
    return requirements;
  }
  
  private getBaseCertificationRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 'haccp-cert',
        name: 'HACCP Certification',
        description: 'Hazard Analysis Critical Control Points certification for food safety',
        isRequired: true,
        estimatedCost: {
          min: 45000,
          max: 75000,
          currency: 'ZAR'
        },
        estimatedTimelineInDays: 180,
        countryCode: 'ZA',
        regulatoryBody: 'Department of Agriculture, Land Reform and Rural Development (DALRRD)',
        productCategories: ['Food Products - Frozen/Canned Goods', 'Food Products - Processed Foods'],
        documentationNeeded: ['Food safety manual', 'Process flow diagrams', 'Hazard analysis documentation'],
        referenceUrl: 'https://www.dalrrd.gov.za/'
      },
      {
        id: 'fda-compliance',
        name: 'FDA/EFSA Compliance',
        description: 'Compliance with U.S. FDA and European Food Safety Authority requirements',
        isRequired: true,
        estimatedCost: {
          min: 8000,
          max: 25000,
          currency: 'USD' // Using USD as base currency
        },
        estimatedTimelineInDays: 240,
        countryCode: 'INTL',
        regulatoryBody: 'U.S. FDA / European Food Safety Authority',
        productCategories: ['Food Products - Frozen/Canned Goods', 'Food Products - Processed Foods'],
        documentationNeeded: ['Product formulation', 'Lab test results', 'Manufacturing process documentation'],
        referenceUrl: 'https://www.fda.gov/food/exporting-food-products-united-states/export-certification'
      },
      {
        id: 'facility-hygiene',
        name: 'Facility Hygiene Certification',
        description: 'Certification of facility hygiene standards',
        isRequired: true,
        estimatedCost: {
          min: 15000,
          max: 25000,
          currency: 'ZAR'
        },
        estimatedTimelineInDays: 90,
        countryCode: 'ZA',
        regulatoryBody: 'National Regulator for Compulsory Specifications (NRCS)',
        productCategories: ['Food Products - Frozen/Canned Goods', 'Food Products - Processed Foods'],
        documentationNeeded: ['Facility layout', 'Cleaning procedures', 'Staff training records'],
        referenceUrl: 'https://www.nrcs.org.za/services/food-safety/'
      },
      {
        id: 'product-specs',
        name: 'Product Specification Sheets',
        description: 'Detailed product specifications and testing',
        isRequired: true,
        estimatedCost: {
          min: 5000,
          max: 10000,
          currency: 'ZAR'
        },
        estimatedTimelineInDays: 30,
        countryCode: 'ZA',
        regulatoryBody: 'South African Bureau of Standards (SABS)',
        productCategories: ['Food Products - Frozen/Canned Goods', 'Food Products - Processed Foods'],
        documentationNeeded: ['Product composition', 'Nutritional information', 'Packaging specifications'],
        referenceUrl: 'https://www.sabs.co.za'
      },
      {
        id: 'vat-registration',
        name: 'VAT Registration',
        description: 'Value Added Tax registration for businesses',
        isRequired: false, // Only required if turnover exceeds R1 million
        estimatedCost: {
          min: 0,
          max: 0,
          currency: 'ZAR'
        },
        estimatedTimelineInDays: 21,
        countryCode: 'ZA',
        regulatoryBody: 'South African Revenue Service (SARS)',
        productCategories: ['Food Products - Frozen/Canned Goods', 'Food Products - Processed Foods'],
        documentationNeeded: ['Business registration', 'Financial projections', 'Bank account details'],
        referenceUrl: 'https://www.sars.gov.za/types-of-tax/value-added-tax/register-for-vat/'
      }
    ];
  }
  
  private getCategorySpecificRequirements(category: string, marketCode: string): ComplianceRequirement[] {
    // For food products, use our detailed requirements
    if (category.includes('Food Products')) {
      return this.getFoodProductRequirements(marketCode);
    }
    
    // For other categories, use existing logic
    const requirements: ComplianceRequirement[] = [];
    
    // Food products
    if (category.includes('food') || category.includes('beverage') || category.includes('agricultural')) {
      requirements.push({
        id: `cr-${marketCode}-food-001`,
        name: 'Food Safety Certification',
        description: 'Products must meet food safety standards and have appropriate certification.',
        isRequired: true,
        estimatedCost: {
          min: 1000,
          max: 5000,
          currency: 'USD'
        },
        estimatedTimelineInDays: 90,
        countryCode: marketCode,
        regulatoryBody: 'Food Safety Authority',
        productCategories: [category],
        documentationNeeded: ['Lab test results', 'Production facility inspection report']
      });
      
      requirements.push({
        id: `cr-${marketCode}-food-002`,
        name: 'Packaging and Labeling Requirements',
        description: 'Food products must meet specific labeling requirements including ingredients, nutritional information, and allergen warnings.',
        isRequired: true,
        estimatedCost: {
          min: 500,
          max: 2000,
          currency: 'USD'
        },
        estimatedTimelineInDays: 45,
        countryCode: marketCode,
        regulatoryBody: 'Food and Drug Administration',
        productCategories: [category],
        documentationNeeded: ['Label designs', 'Packaging specifications']
      });
    }
    
    // Electronics
    if (category.includes('electronics') || category.includes('electrical')) {
      requirements.push({
        id: `cr-${marketCode}-elec-001`,
        name: 'Electrical Safety Certification',
        description: 'Electronic products must meet safety standards and have appropriate certification.',
        isRequired: true,
        estimatedCost: {
          min: 2000,
          max: 7000,
          currency: 'USD'
        },
        estimatedTimelineInDays: 60,
        countryCode: marketCode,
        regulatoryBody: 'Electrical Safety Authority',
        productCategories: [category],
        documentationNeeded: ['Technical specifications', 'Safety test results']
      });
    }
    
    // Textiles
    if (category.includes('textile') || category.includes('apparel') || category.includes('clothing')) {
      requirements.push({
        id: `cr-${marketCode}-text-001`,
        name: 'Textile Labeling Requirements',
        description: 'Textile products must meet specific labeling requirements including fiber content and care instructions.',
        isRequired: true,
        estimatedCost: {
          min: 300,
          max: 1000,
          currency: 'USD'
        },
        estimatedTimelineInDays: 30,
        countryCode: marketCode,
        regulatoryBody: 'Consumer Protection Agency',
        productCategories: [category],
        documentationNeeded: ['Fiber content analysis', 'Label samples']
      });
    }
    
    return requirements;
  }
  
  private calculateTotalCost(requirements: ComplianceRequirement[]): { min: number; max: number; currency: string } {
    let totalMin = 0;
    let totalMax = 0;
    
    for (const req of requirements) {
      if (req.estimatedCost) {
        totalMin += req.estimatedCost.min;
        totalMax += req.estimatedCost.max;
      }
    }
    
    return {
      min: totalMin,
      max: totalMax,
      currency: 'USD'
    };
  }
  
  private calculateTotalTimeline(requirements: ComplianceRequirement[]): number {
    // For timeline, we need to consider which requirements can be done in parallel
    // For simplicity, we'll assume 25% overlap in timelines
    
    let totalDays = 0;
    const timelines: number[] = [];
    
    for (const req of requirements) {
      if (req.estimatedTimelineInDays) {
        timelines.push(req.estimatedTimelineInDays);
      }
    }
    
    // Sort timelines in descending order
    timelines.sort((a, b) => b - a);
    
    if (timelines.length > 0) {
      // Take the longest timeline as base
      totalDays = timelines[0];
      
      // Add additional time for other requirements, assuming some overlap
      for (let i = 1; i < timelines.length; i++) {
        totalDays += timelines[i] * 0.25; // Assuming 75% overlap
      }
    }
    
    return Math.round(totalDays);
  }
} 