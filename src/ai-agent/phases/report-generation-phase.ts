import { AssessmentData } from '@/types/assessment';
import { logger } from '@/utils/logger';

/**
 * Report Generation Phase
 * 
 * Final phase of the assessment process that:
 * 1. Compiles data from global and country-specific phases
 * 2. Generates a comprehensive export report
 * 3. Provides recommendations and next steps
 */
export class ReportGenerationPhase {
  constructor() {}
  
  /**
   * Execute the report generation phase
   */
  async executePhase(assessment: AssessmentData): Promise<AssessmentData> {
    try {
      logger.info('Executing Report Generation Phase');
      
      // Validate that previous phases are complete
      if (!assessment.globalClassification) {
        throw new Error('Global classification must be completed before report generation');
      }
      
      if (!assessment.countrySpecificData || !assessment.countrySpecificData[assessment.targetMarket]) {
        throw new Error('Country-specific assessment must be completed before report generation');
      }
      
      // Generate the report
      const report = await this.generateReport(assessment);
      
      // Update the assessment with the report
      const updatedAssessment: AssessmentData = {
        ...assessment,
        report,
        currentPhase: 'report-complete',
        assessmentComplete: true,
        lastUpdated: new Date().toISOString()
      };
      
      // Log success
      logger.info('Report Generation Phase completed successfully');
      
      return updatedAssessment;
    } catch (error) {
      // Log failure
      logger.error('Error in Report Generation Phase:', error);
      
      // Return assessment with error state
      return {
        ...assessment,
        errors: [...(assessment.errors || []), {
          phase: 'report-generation',
          message: `Error during report generation: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        }],
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  /**
   * Generate a comprehensive export report
   */
  private async generateReport(assessment: AssessmentData): Promise<any> {
    // Get country-specific data
    const countryData = assessment.countrySpecificData[assessment.targetMarket];
    
    // Create sections based on country
    let tariffSection;
    let marketSection;
    let complianceSection;
    
    switch (assessment.targetMarket) {
      case 'uk':
        tariffSection = this.generateUkTariffSection(countryData.uk?.hsCodeResult);
        marketSection = this.generateUkMarketSection(countryData.uk?.marketInsights);
        complianceSection = this.generateUkComplianceSection(countryData.uk?.complianceRequirements);
        break;
      case 'uae':
        tariffSection = this.generateUaeTariffSection(countryData.uae?.hsCodeResult);
        // Add other sections when UAE MCPs are fully implemented
        break;
      default:
        throw new Error(`Unsupported target market: ${assessment.targetMarket}`);
    }
    
    // Compile the final report
    return {
      title: `Export Assessment Report for ${assessment.productDescription} to ${assessment.targetMarket.toUpperCase()}`,
      date: new Date().toISOString(),
      product: {
        name: assessment.productDescription,
        hsCode: assessment.globalClassification.classifications[0]?.hsCode || 'Not classified',
        description: assessment.globalClassification.classifications[0]?.description || 'No description available'
      },
      tariff: tariffSection,
      market: marketSection,
      compliance: complianceSection,
      recommendations: this.generateRecommendations(assessment),
      metadata: {
        generatedBy: 'TradeWizard AI Assistant',
        version: '3.0'
      }
    };
  }
  
  /**
   * Generate UK tariff section of the report
   */
  private generateUkTariffSection(hsCodeResult: any): any {
    if (!hsCodeResult || !hsCodeResult.ukClassifications || hsCodeResult.ukClassifications.length === 0) {
      return {
        summary: 'No tariff information available',
        details: []
      };
    }
    
    const ukTariff = hsCodeResult.ukClassifications[0];
    
    return {
      summary: `Tariff rate: ${ukTariff.tariffRate !== null ? `${ukTariff.tariffRate}%` : 'Not available'}`,
      details: [
        { label: 'HS Code', value: ukTariff.hsCode },
        { label: 'Description', value: ukTariff.description },
        { label: 'Tariff Category', value: ukTariff.tariffCategory },
        { label: 'Measure Type', value: ukTariff.measureType },
        { label: 'VAT', value: ukTariff.vat },
        { label: 'License Required', value: ukTariff.requiresLicense ? 'Yes' : 'No' }
      ],
      footnotes: ukTariff.footnotes || []
    };
  }
  
  /**
   * Generate UAE tariff section of the report
   */
  private generateUaeTariffSection(hsCodeResult: any): any {
    if (!hsCodeResult || !hsCodeResult.uaeClassifications || hsCodeResult.uaeClassifications.length === 0) {
      return {
        summary: 'No tariff information available',
        details: []
      };
    }
    
    const uaeTariff = hsCodeResult.uaeClassifications[0];
    
    return {
      summary: `Tariff rate: ${uaeTariff.tariffRate !== null ? `${uaeTariff.tariffRate}%` : 'Not available'}`,
      details: [
        { label: 'HS Code', value: uaeTariff.hsCode },
        { label: 'Description', value: uaeTariff.description },
        { label: 'Tariff Category', value: uaeTariff.tariffCategory },
        { label: 'GCC Common Tariff', value: uaeTariff.gccCommonTariff ? 'Yes' : 'No' },
        { label: 'Duty Exemptions', value: uaeTariff.dutyExemptions?.join(', ') || 'None' }
      ],
      additionalFees: uaeTariff.additionalFees || []
    };
  }
  
  /**
   * Generate UK market section of the report
   */
  private generateUkMarketSection(marketInsights: any): any {
    if (!marketInsights || !marketInsights.insights || marketInsights.insights.length === 0) {
      return {
        summary: 'No market information available',
        details: []
      };
    }
    
    const insight = marketInsights.insights[0];
    
    return {
      summary: `Market size: £${this.formatNumber(insight.totalMarketSize)} with ${insight.yearlyGrowth}% yearly growth`,
      details: [
        { label: 'Market Size', value: `£${this.formatNumber(insight.totalMarketSize)}` },
        { label: 'Annual Growth', value: `${insight.yearlyGrowth}%` },
        { label: 'Top Competitors', value: insight.topCompetitors.map((c: any) => `${c.country} (${c.marketShare}%)`).join(', ') }
      ],
      opportunities: insight.opportunities || [],
      challenges: insight.challenges || [],
      trends: insight.trends || []
    };
  }
  
  /**
   * Generate UK compliance section of the report
   */
  private generateUkComplianceSection(complianceRequirements: any): any {
    if (!complianceRequirements || !complianceRequirements.requirements || complianceRequirements.requirements.length === 0) {
      return {
        summary: 'No compliance information available',
        details: []
      };
    }
    
    const requirement = complianceRequirements.requirements[0];
    
    return {
      summary: `${requirement.regulations.length} regulations and ${requirement.certifications.length} certifications required`,
      regulations: requirement.regulations.map((reg: any) => ({
        title: reg.title,
        description: reg.description,
        requirements: reg.requirements,
        url: reg.url
      })),
      certifications: requirement.certifications.map((cert: any) => ({
        name: cert.name,
        description: cert.description,
        authority: cert.issuingAuthority,
        process: cert.applicationProcess,
        timeframe: cert.estimatedTimeframe,
        cost: cert.estimatedCost
      })),
      restrictions: requirement.restrictions || [],
      notes: requirement.generalNotes || []
    };
  }
  
  /**
   * Generate recommendations based on the assessment
   */
  private generateRecommendations(assessment: AssessmentData): any[] {
    const recommendations = [];
    const countryData = assessment.countrySpecificData[assessment.targetMarket];
    
    // Add HS code recommendation
    recommendations.push({
      type: 'classification',
      title: 'Verify HS Code Classification',
      description: 'Consult with a customs broker to confirm the HS code classification is accurate for your specific product.'
    });
    
    if (assessment.targetMarket === 'uk') {
      // Add UK-specific recommendations
      
      // Check if licenses required
      if (countryData.uk?.hsCodeResult?.ukClassifications?.[0]?.requiresLicense) {
        recommendations.push({
          type: 'compliance',
          title: 'Apply for Required Import License',
          description: 'This product requires an import license. Contact the UK government to start the application process.'
        });
      }
      
      // Add certification recommendations
      const certifications = countryData.uk?.complianceRequirements?.requirements?.[0]?.certifications || [];
      if (certifications.length > 0) {
        recommendations.push({
          type: 'compliance',
          title: `Obtain Required Certifications (${certifications.length})`,
          description: `Apply for the ${certifications.map((c: any) => c.name).join(', ')} to ensure compliant market access.`
        });
      }
      
      // Add market recommendations based on challenges
      const challenges = countryData.uk?.marketInsights?.insights?.[0]?.challenges || [];
      if (challenges.length > 0) {
        recommendations.push({
          type: 'market',
          title: 'Address Market Challenges',
          description: `Develop strategies to overcome: ${challenges.join(', ')}`
        });
      }
    } else if (assessment.targetMarket === 'uae') {
      // Add UAE-specific recommendations
      recommendations.push({
        type: 'tariff',
        title: 'Consider GCC Preferential Tariffs',
        description: 'If exporting through another GCC country, you may benefit from preferential tariff rates.'
      });
    }
    
    // Add general recommendations
    recommendations.push({
      type: 'next-steps',
      title: 'Engage with Trade Promotion Organization',
      description: `Contact your local trade promotion organization for assistance in entering the ${assessment.targetMarket.toUpperCase()} market.`
    });
    
    return recommendations;
  }
  
  /**
   * Format large numbers with commas
   */
  private formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
} 