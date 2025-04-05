import { AssessmentData } from '@/types/assessment';
import { logger } from '@/utils/logger';
import { UkHsTariffMCPService } from '@/mcp/country/uk/hs-tariff-mcp';
import { UkMarketMCPService } from '@/mcp/country/uk/market-mcp';
import { UkComplianceMCPService } from '@/mcp/country/uk/compliance-mcp';
import { UaeHsTariffMCPService } from '@/mcp/country/uae/hs-tariff-mcp';

/**
 * Country-Specific Assessment Phase
 * 
 * Second phase of the assessment process that:
 * 1. Gets country-specific HS codes and tariff information
 * 2. Gathers country-specific market insights
 * 3. Collects country-specific compliance requirements
 */
export class CountryAssessmentPhase {
  private readonly ukHsTariffMCP: UkHsTariffMCPService;
  private readonly ukMarketMCP: UkMarketMCPService;
  private readonly ukComplianceMCP: UkComplianceMCPService;
  private readonly uaeHsTariffMCP: UaeHsTariffMCPService;
  
  constructor() {
    this.ukHsTariffMCP = new UkHsTariffMCPService();
    this.ukMarketMCP = new UkMarketMCPService();
    this.ukComplianceMCP = new UkComplianceMCPService();
    this.uaeHsTariffMCP = new UaeHsTariffMCPService();
  }
  
  /**
   * Execute the country assessment phase
   */
  async executePhase(assessment: AssessmentData): Promise<AssessmentData> {
    try {
      logger.info('Executing Country Assessment Phase');
      
      if (!assessment.globalClassification) {
        throw new Error('Global classification must be completed before country assessment');
      }
      
      // Copy the assessment to avoid mutation
      let updatedAssessment = { ...assessment };
      
      // Get country-specific data based on the selected target market
      switch (assessment.targetMarket) {
        case 'uk':
          updatedAssessment = await this.processUkAssessment(updatedAssessment);
          break;
        case 'uae':
          updatedAssessment = await this.processUaeAssessment(updatedAssessment);
          break;
        default:
          throw new Error(`Unsupported target market: ${assessment.targetMarket}`);
      }
      
      // Update the phase
      updatedAssessment.currentPhase = 'country-assessment-complete';
      updatedAssessment.lastUpdated = new Date().toISOString();
      
      // Log success
      logger.info('Country Assessment Phase completed successfully');
      
      return updatedAssessment;
    } catch (error) {
      // Log failure
      logger.error('Error in Country Assessment Phase:', error);
      
      // Return assessment with error state
      return {
        ...assessment,
        errors: [...(assessment.errors || []), {
          phase: 'country-assessment',
          message: `Error during country assessment: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        }],
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  /**
   * Process UK-specific assessment
   */
  private async processUkAssessment(assessment: AssessmentData): Promise<AssessmentData> {
    // Get UK HS code and tariff information
    const ukHsCodeResult = await this.ukHsTariffMCP.getExtendedHsCode(
      assessment.productDescription
    );
    
    // Get UK market insights
    const ukMarketInsights = await this.ukMarketMCP.getMarketInsights(
      assessment.productDescription
    );
    
    // Get UK compliance requirements
    const ukComplianceRequirements = await this.ukComplianceMCP.getComplianceRequirements(
      assessment.productDescription
    );
    
    // Update the assessment with UK-specific data
    return {
      ...assessment,
      countrySpecificData: {
        ...assessment.countrySpecificData,
        uk: {
          hsCodeResult: ukHsCodeResult,
          marketInsights: ukMarketInsights,
          complianceRequirements: ukComplianceRequirements
        }
      }
    };
  }
  
  /**
   * Process UAE-specific assessment
   */
  private async processUaeAssessment(assessment: AssessmentData): Promise<AssessmentData> {
    // Get UAE HS code and tariff information
    const uaeHsCodeResult = await this.uaeHsTariffMCP.getExtendedHsCode(
      assessment.productDescription
    );
    
    // Update the assessment with UAE-specific data
    return {
      ...assessment,
      countrySpecificData: {
        ...assessment.countrySpecificData,
        uae: {
          hsCodeResult: uaeHsCodeResult,
          // Add market and compliance when implemented
        }
      }
    };
  }
} 