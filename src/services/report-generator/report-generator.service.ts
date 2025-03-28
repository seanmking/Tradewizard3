import { 
  ReportData, 
  MarketOverviewInsight, 
  CertificationRoadmapItem, 
  ResourceNeed, 
  ActionPlanItem 
} from '@/contexts/report-context';
import { ComplianceMCPService } from '@/mcp/compliance-mcp/compliance-mcp.service';
import { MarketIntelligenceMCPService } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.service';
import { ComplianceRequirement, ComplianceRequest } from '@/mcp/compliance-mcp/compliance-mcp.interface';
import { MarketInsight, MarketIntelligenceRequest } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.interface';
import { BusinessProfile as AssessmentBusinessProfile } from '@/contexts/assessment-context';
import { BusinessProfile as MCPBusinessProfile } from '@/types/business-profile.types';
import { logger } from '@/utils/logger';

// Define interfaces to match those in assessment-context.tsx
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  specifications: Record<string, string>;
  selected?: boolean;
}

interface TargetMarket {
  id: string;
  code: string;
  name: string;
}

interface ProductionCapacity {
  monthlyCapacity: number;
  unit: 'units' | 'kg' | 'tons' | 'pieces';
  leadTime: number;
  minimumOrderQuantity: number;
}

interface MarketInfo {
  targetMarkets: TargetMarket[];
  existingMarkets: string[];
  competitorAnalysis: string;
}

interface Budget {
  amount: number;
  currency: string;
  timeline: number;
  allocation: {
    certifications: number;
    marketing: number;
    logistics: number;
    other: number;
  };
}

interface Certification {
  id: string;
  name: string;
  status: 'planned' | 'in-progress' | 'obtained';
}

// Define AssessmentState interface to match the context
interface AssessmentState {
  currentStep: number;
  isAnalysing: boolean;
  businessInfo: {
    websiteUrl: string;
    extractedInfo: any;
  };
  businessProfile: AssessmentBusinessProfile;
  selectedProducts: Product[];
  productionCapacity: ProductionCapacity;
  marketInfo: MarketInfo;
  certifications: Certification[];
  budget: Budget;
}

export class ReportGeneratorService {
  private complianceService: ComplianceMCPService;
  private marketIntelligenceService: MarketIntelligenceMCPService;
  
  constructor() {
    this.complianceService = new ComplianceMCPService();
    this.marketIntelligenceService = new MarketIntelligenceMCPService();
  }
  
  async generateReport(assessmentState: AssessmentState): Promise<ReportData> {
    try {
      logger.info('Generating export readiness report');
      
      // Get compliance requirements
      const complianceRequest: ComplianceRequest = {
        productCategories: assessmentState.selectedProducts.map((p) => p.category),
        targetMarkets: assessmentState.marketInfo.targetMarkets.map((m) => m.code),
        businessProfile: this.convertBusinessProfileForMCP(assessmentState.businessProfile, assessmentState.selectedProducts)
      };
      
      const complianceData = await this.complianceService.getRequirements(complianceRequest);
      
      // Get market intelligence
      const marketRequest: MarketIntelligenceRequest = {
        productCategories: assessmentState.selectedProducts.map((p) => p.category),
        targetMarkets: assessmentState.marketInfo.targetMarkets.map((m) => m.code),
        businessProfile: this.convertBusinessProfileForMCP(assessmentState.businessProfile, assessmentState.selectedProducts)
      };
      
      const marketData = await this.marketIntelligenceService.getMarketInsights(marketRequest);
      
      // Generate insights for each section
      const marketOverview = this.generateMarketOverview(marketData, assessmentState);
      const certificationRoadmap = this.generateCertificationRoadmap(complianceData);
      const resourceNeeds = this.generateResourceNeeds(assessmentState, complianceData, marketData);
      const actionPlan = this.generateActionPlan(assessmentState, complianceData, marketData);
      
      // Calculate export readiness score
      const exportReadinessScore = this.calculateExportReadinessScore(
        assessmentState,
        complianceData,
        marketData
      );
      
      return {
        businessProfile: assessmentState.businessProfile,
        selectedProducts: assessmentState.selectedProducts,
        productionCapacity: assessmentState.productionCapacity,
        marketInfo: assessmentState.marketInfo,
        certifications: assessmentState.certifications,
        budget: assessmentState.budget,
        insights: {
          marketOverview,
          certificationRoadmap,
          resourceNeeds,
          actionPlan
        },
        generatedAt: new Date(),
        exportReadinessScore
      };
    } catch (error) {
      logger.error(`Error generating report: ${error}`);
      throw new Error(`Failed to generate export readiness report: ${error}`);
    }
  }
  
  /**
   * Convert the AssessmentBusinessProfile to the format expected by MCP services
   */
  private convertBusinessProfileForMCP(
    profile: AssessmentBusinessProfile, 
    selectedProducts: Product[]
  ): MCPBusinessProfile {
    return {
      name: profile.name,
      description: profile.description,
      industry: profile.industry,
      location: {
        country: profile.location,
        city: '',
        address: profile.contactInfo?.address || ''
      },
      contactInfo: {
        email: profile.contactInfo?.email || '',
        phone: profile.contactInfo?.phone || '',
        socialMedia: {}
      },
      websiteUrl: profile.websiteUrl,
      extractedAt: profile.extractedAt || new Date(),
      products: selectedProducts.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        specifications: p.specifications
      }))
    };
  }
  
  private generateMarketOverview(
    marketData: Record<string, MarketInsight>,
    assessmentState: AssessmentState
  ): MarketOverviewInsight[] {
    const marketOverview: MarketOverviewInsight[] = [];
    
    // Process each target market
    for (const targetMarket of assessmentState.marketInfo.targetMarkets) {
      const marketCode = targetMarket.code;
      const marketInsight = marketData[marketCode];
      
      if (marketInsight) {
        // Generate tariff information summary
        const tariffSummary = this.generateTariffSummary(marketInsight.tariffs);
        
        // Create market overview insight
        marketOverview.push({
          marketCode,
          marketName: targetMarket.name,
          marketSize: marketInsight.marketSize.value,
          marketCurrency: marketInsight.marketSize.currency,
          growthRate: marketInsight.marketSize.growthRate || 0,
          keyCompetitors: marketInsight.topCompetitors.map(competitor => ({
            name: competitor.name,
            marketShare: competitor.marketShare || 0
          })),
          entryBarriers: marketInsight.entryBarriers,
          tariffInformation: tariffSummary
        });
      }
    }
    
    return marketOverview;
  }
  
  private generateTariffSummary(tariffs: Record<string, any>): string {
    const tariffRates = Object.entries(tariffs).map(([category, info]) => 
      `${category}: ${info.rate}% (${info.type})`
    );
    
    return tariffRates.join('; ');
  }
  
  private generateCertificationRoadmap(complianceData: any): CertificationRoadmapItem[] {
    const roadmap: CertificationRoadmapItem[] = [];
    
    // Process each compliance requirement
    for (const requirement of complianceData.requirements) {
      // Determine priority based on whether it's required and the timeline
      let priority: 'high' | 'medium' | 'low' = 'medium';
      
      if (requirement.isRequired) {
        priority = requirement.estimatedTimelineInDays < 60 ? 'high' : 'medium';
      } else {
        priority = 'low';
      }
      
      // Generate implementation steps
      const steps = this.generateImplementationSteps(requirement);
      
      // Create roadmap item
      roadmap.push({
        id: requirement.id,
        name: requirement.name,
        description: requirement.description,
        priority,
        timeline: requirement.estimatedTimelineInDays || 90,
        cost: requirement.estimatedCost || { min: 0, max: 0, currency: 'USD' },
        steps
      });
    }
    
    // Sort by priority and then by timeline
    return roadmap.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timeline - b.timeline;
    });
  }
  
  private generateImplementationSteps(requirement: ComplianceRequirement): string[] {
    const steps: string[] = [];
    
    // Add preparation step
    steps.push(`Research ${requirement.name} requirements for ${requirement.countryCode}`);
    
    // Add document preparation steps if available
    if (requirement.documentationNeeded && requirement.documentationNeeded.length > 0) {
      steps.push(`Prepare required documentation: ${requirement.documentationNeeded.join(', ')}`);
    }
    
    // Add application step
    steps.push(`Submit application to ${requirement.regulatoryBody || 'relevant regulatory body'}`);
    
    // Add follow-up step
    steps.push('Follow up on application status');
    
    // Add implementation step
    steps.push(`Implement ${requirement.name} requirements in business operations`);
    
    return steps;
  }
  
  private generateResourceNeeds(
    assessmentState: AssessmentState,
    complianceData: any,
    marketData: Record<string, MarketInsight>
  ): ResourceNeed[] {
    const resourceNeeds: ResourceNeed[] = [];
    
    // Financial resources
    const financialNeeds = this.identifyFinancialNeeds(assessmentState, complianceData);
    resourceNeeds.push(...financialNeeds);
    
    // Human resources
    const humanResourceNeeds = this.identifyHumanResourceNeeds(assessmentState, marketData);
    resourceNeeds.push(...humanResourceNeeds);
    
    // Infrastructure needs
    const infrastructureNeeds = this.identifyInfrastructureNeeds(assessmentState);
    resourceNeeds.push(...infrastructureNeeds);
    
    // Knowledge needs
    const knowledgeNeeds = this.identifyKnowledgeNeeds(assessmentState, marketData);
    resourceNeeds.push(...knowledgeNeeds);
    
    return resourceNeeds;
  }
  
  private identifyFinancialNeeds(
    assessmentState: AssessmentState,
    complianceData: any
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    
    // Add compliance cost needs
    needs.push({
      type: 'financial',
      description: 'Certification and compliance costs',
      estimatedCost: complianceData.totalEstimatedCost,
      timeline: complianceData.totalEstimatedTimelineInDays,
      alternatives: [
        'Explore government export promotion funding',
        'Consider phased implementation to spread costs',
        'Investigate industry association support programs'
      ]
    });
    
    // Add market entry costs
    needs.push({
      type: 'financial',
      description: 'Market entry and marketing costs',
      estimatedCost: {
        min: assessmentState.budget.amount * 0.3,
        max: assessmentState.budget.amount * 0.5,
        currency: assessmentState.budget.currency
      },
      timeline: 12,
      alternatives: [
        'Partner with established distributors to share costs',
        'Utilize digital marketing to reduce traditional marketing costs',
        'Join trade missions and government-sponsored exhibitions'
      ]
    });
    
    // Add logistics costs
    needs.push({
      type: 'financial',
      description: 'Logistics and shipping setup costs',
      estimatedCost: {
        min: assessmentState.budget.amount * 0.1,
        max: assessmentState.budget.amount * 0.2,
        currency: assessmentState.budget.currency
      },
      timeline: 6,
      alternatives: [
        'Use freight forwarders specializing in your target markets',
        'Consider consolidated shipping options',
        'Explore different Incoterms to optimize cost distribution'
      ]
    });
    
    return needs;
  }
  
  private identifyHumanResourceNeeds(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    
    // Export management expertise
    needs.push({
      type: 'human',
      description: 'Export management expertise',
      estimatedCost: {
        min: 2000,
        max: 5000,
        currency: 'USD'
      },
      timeline: 3,
      alternatives: [
        'Hire export consultant on project basis',
        'Train existing staff on export procedures',
        'Join export mentorship programs'
      ]
    });
    
    // Market-specific expertise
    if (Object.keys(marketData).length > 0) {
      needs.push({
        type: 'human',
        description: 'Market-specific expertise for target markets',
        estimatedCost: {
          min: 1500,
          max: 4000,
          currency: 'USD'
        },
        timeline: 2,
        alternatives: [
          'Partner with local market experts in target countries',
          'Engage with trade associations with international expertise',
          'Utilize market research services from trade promotion organizations'
        ]
      });
    }
    
    return needs;
  }
  
  private identifyInfrastructureNeeds(assessmentState: AssessmentState): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    
    // Production capacity adjustments
    const currentCapacity = assessmentState.productionCapacity.monthlyCapacity;
    const productCount = assessmentState.selectedProducts.length;
    const marketCount = assessmentState.marketInfo.targetMarkets.length;
    
    if (currentCapacity < 1000 && productCount > 1 && marketCount > 1) {
      needs.push({
        type: 'infrastructure',
        description: 'Production capacity expansion',
        estimatedCost: {
          min: 10000,
          max: 50000,
          currency: 'USD'
        },
        timeline: 9,
        alternatives: [
          'Optimize current production processes before expanding',
          'Consider contract manufacturing for overflow production',
          'Phase market entry to manage capacity requirements'
        ]
      });
    }
    
    // Add quality control infrastructure
    needs.push({
      type: 'infrastructure',
      description: 'Quality control infrastructure for export standards',
      estimatedCost: {
        min: 5000,
        max: 15000,
        currency: 'USD'
      },
      timeline: 3,
      alternatives: [
        'Partner with third-party quality control services',
        'Implement quality management software systems',
        'Gradually upgrade testing equipment as export volumes increase'
      ]
    });
    
    return needs;
  }
  
  private identifyKnowledgeNeeds(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    
    // Export documentation knowledge
    needs.push({
      type: 'knowledge',
      description: 'Export documentation and procedures training',
      estimatedCost: {
        min: 500,
        max: 2000,
        currency: 'USD'
      },
      timeline: 1,
      alternatives: [
        'Attend export training workshops by trade promotion organizations',
        'Utilize online export procedure courses',
        'Join export networking groups for knowledge sharing'
      ]
    });
    
    // Market-specific cultural knowledge
    for (const marketCode of Object.keys(marketData)) {
      if (['CN', 'JP', 'AE', 'SA'].includes(marketCode)) {
        needs.push({
          type: 'knowledge',
          description: `Cultural business practices for ${marketCode} market`,
          estimatedCost: {
            min: 300,
            max: 1500,
            currency: 'USD'
          },
          timeline: 1,
          alternatives: [
            'Hire local business culture consultant for training',
            'Participate in cultural business exchange programs',
            'Partner with businesses experienced in the target market'
          ]
        });
      }
    }
    
    return needs;
  }
  
  private generateActionPlan(
    assessmentState: AssessmentState,
    complianceData: any,
    marketData: Record<string, MarketInsight>
  ): ActionPlanItem[] {
    const actionPlan: ActionPlanItem[] = [];
    
    // Add immediate actions (first 3 months)
    
    // 1. Compliance preparation
    actionPlan.push({
      id: 'ap-001',
      title: 'Begin compliance preparation process',
      description: 'Start the process for obtaining required certifications and meeting regulatory requirements',
      timeline: { startMonth: 1, durationMonths: 2 },
      priority: 'critical',
      resources: ['Compliance documentation', 'Legal expertise']
    });
    
    // 2. Market research refinement
    actionPlan.push({
      id: 'ap-002',
      title: 'Refine market research for target markets',
      description: 'Conduct detailed market research to validate opportunities and refine strategy',
      timeline: { startMonth: 1, durationMonths: 2 },
      priority: 'high',
      resources: ['Market research tools', 'Industry reports']
    });
    
    // 3. Partner identification
    actionPlan.push({
      id: 'ap-003',
      title: 'Identify potential distribution partners',
      description: 'Research and initiate contact with potential distributors or partners in target markets',
      timeline: { startMonth: 2, durationMonths: 3 },
      priority: 'high',
      dependencies: ['ap-002'],
      resources: ['Networking platforms', 'Trade show participation']
    });
    
    // Medium-term actions (3-6 months)
    
    // 4. Product adaptation
    actionPlan.push({
      id: 'ap-004',
      title: 'Adapt products for target markets',
      description: 'Modify products to meet target market requirements and preferences',
      timeline: { startMonth: 3, durationMonths: 3 },
      priority: 'high',
      dependencies: ['ap-002'],
      resources: ['R&D budget', 'Product design expertise']
    });
    
    // 5. Export logistics setup
    actionPlan.push({
      id: 'ap-005',
      title: 'Set up export logistics chain',
      description: 'Establish relationships with freight forwarders and develop shipping procedures',
      timeline: { startMonth: 4, durationMonths: 2 },
      priority: 'medium',
      resources: ['Logistics consultants', 'Shipping platforms']
    });
    
    // 6. Marketing strategy development
    actionPlan.push({
      id: 'ap-006',
      title: 'Develop international marketing strategy',
      description: 'Create marketing materials and strategy tailored to target markets',
      timeline: { startMonth: 4, durationMonths: 3 },
      priority: 'medium',
      dependencies: ['ap-002', 'ap-004'],
      resources: ['Marketing budget', 'Design services']
    });
    
    // Long-term actions (6-12 months)
    
    // 7. Pilot export shipment
    actionPlan.push({
      id: 'ap-007',
      title: 'Execute pilot export shipment',
      description: 'Send first test shipment to primary target market',
      timeline: { startMonth: 6, durationMonths: 1 },
      priority: 'critical',
      dependencies: ['ap-001', 'ap-003', 'ap-004', 'ap-005'],
      resources: ['Product inventory', 'Export documentation']
    });
    
    // 8. Export process refinement
    actionPlan.push({
      id: 'ap-008',
      title: 'Refine export processes based on pilot',
      description: 'Evaluate pilot shipment results and optimize processes',
      timeline: { startMonth: 7, durationMonths: 2 },
      priority: 'high',
      dependencies: ['ap-007'],
      resources: ['Process improvement methodology', 'Feedback systems']
    });
    
    // 9. Market expansion planning
    actionPlan.push({
      id: 'ap-009',
      title: 'Plan secondary market entry',
      description: 'Develop timeline and strategy for entering additional target markets',
      timeline: { startMonth: 9, durationMonths: 3 },
      priority: 'medium',
      dependencies: ['ap-007', 'ap-008'],
      resources: ['Market entry templates', 'Expansion budget']
    });
    
    // Return action plan sorted by start month
    return actionPlan.sort((a, b) => a.timeline.startMonth - b.timeline.startMonth);
  }
  
  private calculateExportReadinessScore(
    assessmentState: AssessmentState,
    complianceData: any,
    marketData: Record<string, MarketInsight>
  ): number {
    let score = 0;
    const maxScore = 100;
    
    // 1. Business profile completeness (max 10 points)
    if (assessmentState.businessProfile) {
      const profile = assessmentState.businessProfile;
      let profileScore = 0;
      
      if (profile.name) profileScore += 2;
      if (profile.description) profileScore += 2;
      if (profile.industry) profileScore += 2;
      if (profile.location) profileScore += 2;
      if (profile.contactInfo && Object.keys(profile.contactInfo).length > 0) profileScore += 2;
      
      score += profileScore;
    }
    
    // 2. Product readiness (max 20 points)
    const productScore = Math.min(20, assessmentState.selectedProducts.length * 5);
    score += productScore;
    
    // 3. Production capacity (max 15 points)
    let capacityScore = 0;
    if (assessmentState.productionCapacity.monthlyCapacity > 0) capacityScore += 5;
    if (assessmentState.productionCapacity.leadTime > 0) capacityScore += 5;
    if (assessmentState.productionCapacity.minimumOrderQuantity > 0) capacityScore += 5;
    score += capacityScore;
    
    // 4. Market selection (max 15 points)
    const marketSelectionScore = Math.min(15, assessmentState.marketInfo.targetMarkets.length * 5);
    score += marketSelectionScore;
    
    // 5. Competitor analysis (max 10 points)
    if (assessmentState.marketInfo.competitorAnalysis && assessmentState.marketInfo.competitorAnalysis.length > 10) {
      score += 10;
    } else if (assessmentState.marketInfo.competitorAnalysis && assessmentState.marketInfo.competitorAnalysis.length > 0) {
      score += 5;
    }
    
    // 6. Certification readiness (max 15 points)
    const certificationScore = Math.min(15, assessmentState.certifications.length * 5);
    score += certificationScore;
    
    // 7. Budget allocation (max 15 points)
    if (assessmentState.budget.amount > 0) {
      const allocationSum = Object.values(assessmentState.budget.allocation).reduce(
        (sum: number, value: number) => sum + value, 0);
      
      if (allocationSum > 0) {
        score += 15;
      } else {
        score += 7;
      }
    }
    
    // Return the final score rounded to the nearest integer
    return Math.round(score);
  }
} 