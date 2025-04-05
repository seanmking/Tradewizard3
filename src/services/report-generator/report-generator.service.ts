import { 
  ReportData, 
  MarketOverviewSection,
  CertificationRoadmapSection,
  ResourceNeedsSection,
  ActionPlanSection,
  CertificationRequirement,
  ResourceNeed, 
  ActionItem,
  RiskFactor,
  ReportGenerationConfig
} from '@/types/report.types';
import { ComplianceMCPService } from '@/mcp/compliance-mcp/compliance-mcp.service';
import { MarketIntelligenceMCPService } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.service';
import { ComplianceRequirement, ComplianceRequest } from '@/mcp/compliance-mcp/compliance-mcp.interface';
import { MarketInsight, MarketIntelligenceRequest } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.interface';
import { BusinessProfile, Product, ProductionCapacity, MarketInfo, Certification, Budget, TargetMarket } from '@/contexts/assessment-context';
import { BusinessProfile as MCPBusinessProfile } from '@/types/business-profile.types';
import { PerplexityVerificationService } from '@/ai-agent/services/perplexity-verification.service';
import { logger } from '@/utils/logger';

// Define AssessmentState interface to match the context
interface AssessmentState {
  currentStep: number;
  isAnalysing: boolean;
  businessInfo: {
    websiteUrl: string;
    extractedInfo: any;
  };
  businessProfile: BusinessProfile;
  selectedProducts: Product[];
  productionCapacity: ProductionCapacity;
  marketInfo: MarketInfo;
  certifications: Certification[];
  budget: Budget;
}

export class ReportGeneratorService {
  private complianceService: ComplianceMCPService;
  private marketIntelligenceService: MarketIntelligenceMCPService;
  private perplexityService: PerplexityVerificationService;
  private useMockData: boolean;
  
  constructor(useMockData: boolean = false) {
    this.complianceService = new ComplianceMCPService();
    this.marketIntelligenceService = new MarketIntelligenceMCPService();
    this.perplexityService = new PerplexityVerificationService();
    this.useMockData = useMockData;
    logger.info(`ReportGeneratorService initialized ${useMockData ? 'with mock data' : ''}`);
  }
  
  async generateReport(
    assessmentState: AssessmentState, 
    config: ReportGenerationConfig = {
      includeConfidenceScores: true,
      prioritizeMarkets: [],
      focusOnCertification: false,
      costOptimization: false,
      timelineOptimization: false,
      includeRawData: false
    }
  ): Promise<ReportData> {
    try {
      logger.info('Generating export readiness report');
      
      // Use mock data if enabled (for development/testing)
      if (this.useMockData) {
        logger.info('Using mock data for report generation');
        return this.generateMockReportData(assessmentState);
      }
      
      // Validate that we have all the necessary data
      this.validateAssessmentData(assessmentState);
      
      // Get compliance requirements
      const complianceRequest: ComplianceRequest = {
        productCategories: assessmentState.selectedProducts.map((p) => p.category),
        targetMarkets: assessmentState.marketInfo.targetMarkets.map((m) => m.code),
        businessProfile: this.convertBusinessProfileForMCP(assessmentState.businessProfile, assessmentState.selectedProducts)
      };
      
      logger.info('Fetching compliance requirements');
      const complianceData = await this.complianceService.getRequirements(complianceRequest);
      
      // Get market intelligence
      const marketRequest: MarketIntelligenceRequest = {
        productCategories: assessmentState.selectedProducts.map((p) => p.category),
        targetMarkets: assessmentState.marketInfo.targetMarkets.map((m) => m.code),
        businessProfile: this.convertBusinessProfileForMCP(assessmentState.businessProfile, assessmentState.selectedProducts)
      };
      
      logger.info('Fetching market intelligence');
      const marketData = await this.marketIntelligenceService.getMarketInsights(marketRequest);
      
      // Verify data with Perplexity if confidence scores are requested
      let verifiedProducts = assessmentState.selectedProducts;
      let verifiedComplianceData = complianceData.requirements;
      let verifiedMarketData = marketData;
      
      if (config.includeConfidenceScores) {
        logger.info('Verifying data with Perplexity');
        
        try {
          // Verify product categories
          verifiedProducts = await this.perplexityService.verifyProductCategories(
            assessmentState.selectedProducts,
            assessmentState.businessProfile
          );
          
          // Verify compliance requirements
          verifiedComplianceData = await this.perplexityService.verifyComplianceRequirements(
            complianceData.requirements,
            assessmentState.selectedProducts,
            assessmentState.businessProfile,
            assessmentState.marketInfo.targetMarkets.map(m => m.code)
          );
          
          // Verify market intelligence
          verifiedMarketData = await this.perplexityService.verifyMarketInsights(
            marketData,
            assessmentState.selectedProducts,
            assessmentState.businessProfile,
            assessmentState.marketInfo.targetMarkets.map(m => m.code)
          );
        } catch (error) {
          logger.error(`Error verifying data with Perplexity: ${error}`);
          // Continue with unverified data rather than failing
        }
      }
      
      // Generate insights for each section
      logger.info('Generating market overview section');
      const marketOverview = this.generateMarketOverview(
        verifiedMarketData, 
        assessmentState,
        verifiedProducts
      );
      
      logger.info('Generating certification roadmap section');
      const certificationRoadmap = this.generateCertificationRoadmap(
        verifiedComplianceData,
        assessmentState.marketInfo.targetMarkets,
        assessmentState.budget
      );
      
      logger.info('Generating resource needs section');
      const resourceNeeds = this.generateResourceNeeds(
        assessmentState,
        verifiedComplianceData,
        verifiedMarketData
      );
      
      logger.info('Generating action plan section');
      const actionPlan = this.generateActionPlan(
        assessmentState,
        verifiedComplianceData,
        verifiedMarketData
      );
      
      // Calculate export readiness score
      const exportReadinessScore = this.calculateExportReadinessScore(
        assessmentState,
        complianceData,
        marketData
      );
      
      // Calculate overall confidence score if enabled
      let overallConfidenceScore;
      if (config.includeConfidenceScores) {
        overallConfidenceScore = this.calculateOverallConfidenceScore(
          marketOverview,
          certificationRoadmap,
          resourceNeeds,
          actionPlan
        );
      }
      
      // Build the final report data
      const reportData: ReportData = {
        businessProfile: assessmentState.businessProfile,
        selectedProducts: verifiedProducts,
        productionCapacity: assessmentState.productionCapacity,
        marketInfo: assessmentState.marketInfo,
        certifications: assessmentState.certifications,
        budget: assessmentState.budget,
        
          marketOverview,
          certificationRoadmap,
          resourceNeeds,
        actionPlan,
        
        generatedAt: new Date(),
        exportReadinessScore,
        overallConfidenceScore
      };
      
      // Include raw data if requested
      if (config.includeRawData) {
        reportData.rawComplianceData = verifiedComplianceData;
        reportData.rawMarketData = verifiedMarketData;
      }
      
      logger.info('Export readiness report generated successfully');
      return reportData;
    } catch (error) {
      logger.error(`Error generating report: ${error}`);
      throw new Error(`Failed to generate export readiness report: ${error}`);
    }
  }
  
  /**
   * Validate that all necessary assessment data is present
   * Throw errors for missing data rather than using mock data
   */
  private validateAssessmentData(assessmentState: AssessmentState): void {
    if (!assessmentState.businessProfile) {
      throw new Error('Business profile is required for report generation');
    }
    
    if (!assessmentState.selectedProducts || assessmentState.selectedProducts.length === 0) {
      throw new Error('At least one product must be selected for report generation');
    }
    
    if (!assessmentState.marketInfo.targetMarkets || assessmentState.marketInfo.targetMarkets.length === 0) {
      throw new Error('At least one target market must be selected for report generation');
    }
    
    if (!assessmentState.budget || assessmentState.budget.amount <= 0) {
      throw new Error('Budget information is required for report generation');
    }
    
    logger.info('Assessment data validation successful');
  }
  
  /**
   * Convert the AssessmentBusinessProfile to the format expected by MCP services
   */
  private convertBusinessProfileForMCP(
    profile: BusinessProfile, 
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
  
  /**
   * Generate the Market Overview section of the report
   */
  private generateMarketOverview(
    marketData: Record<string, MarketInsight>,
    assessmentState: AssessmentState,
    verifiedProducts: Product[]
  ): MarketOverviewSection[] {
    const marketOverview: MarketOverviewSection[] = [];
    
    // Process each target market
    for (const targetMarket of assessmentState.marketInfo.targetMarkets) {
      const marketCode = targetMarket.code;
      const marketInsight = marketData[marketCode];
      
      if (marketInsight) {
        // Calculate confidence score by averaging product confidence scores
        let confidenceScore = undefined;
        if (verifiedProducts.some(p => p.confidenceScore !== undefined)) {
          const scores = verifiedProducts
            .filter(p => p.confidenceScore !== undefined)
            .map(p => p.confidenceScore as number);
          confidenceScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
        
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
          opportunities: marketInsight.opportunities,
          risks: marketInsight.risks,
          productSpecificInsights: this.generateProductSpecificInsights(
            verifiedProducts,
            marketInsight
          ),
          confidenceScore
        });
      }
    }
    
    return marketOverview;
  }
  
  /**
   * Generate product-specific market insights
   */
  private generateProductSpecificInsights(
    products: Product[],
    marketInsight: MarketInsight
  ): string[] {
    const insights: string[] = [];
    
    // Generate specific insights for each product category
    const categories = [...new Set(products.map(p => p.category))];
    
    for (const category of categories) {
      if (marketInsight.marketSize.categoryBreakdown && 
          marketInsight.marketSize.categoryBreakdown[category]) {
        const categorySize = marketInsight.marketSize.categoryBreakdown[category];
        const marketShare = (categorySize / marketInsight.marketSize.value) * 100;
        
        insights.push(
          `The ${category} category represents ${marketShare.toFixed(1)}% of the overall market with a value of ${categorySize.toLocaleString()} ${marketInsight.marketSize.currency}.`
        );
      }
      
      // Add category-specific recommendations from market insights
      const categoryRecommendations = marketInsight.recommendations
        .filter(rec => rec.toLowerCase().includes(category.toLowerCase()));
      
      if (categoryRecommendations.length > 0) {
        insights.push(...categoryRecommendations);
      }
    }
    
    return insights;
  }
  
  /**
   * Generate the Certification Roadmap section of the report
   */
  private generateCertificationRoadmap(
    complianceRequirements: ComplianceRequirement[],
    targetMarkets: TargetMarket[],
    budget: Budget
  ): CertificationRoadmapSection {
    // Map requirements to the certification roadmap format
    const requirements: CertificationRequirement[] = complianceRequirements
      .filter(req => req.isRequired)
      .map(req => {
        const market = targetMarkets.find(m => m.code === req.countryCode);
        
        return {
          id: req.id,
          name: req.name,
          description: req.description,
          isRequired: req.isRequired,
          estimatedCost: req.estimatedCost || {
            min: 0,
            max: 0,
            currency: 'USD'
          },
          estimatedTimelineInDays: req.estimatedTimelineInDays || 90,
          marketCode: req.countryCode,
          marketName: market ? market.name : req.countryCode,
          regulatoryBody: req.regulatoryBody || 'Regulatory authority',
          referenceUrl: req.referenceUrl || '',
          confidenceScore: req.confidenceScore
        };
      });
    
    // Generate timeline visualization based on budget constraints
    const certBudget = budget.amount * (budget.allocation.certifications / 100);
    const timelineVisualizationData = this.generateTimelineVisualization(
      requirements,
      certBudget,
      budget.timeline
    );
    
    // Calculate total estimated cost
    const totalMin = requirements.reduce((sum, req) => sum + req.estimatedCost.min, 0);
    const totalMax = requirements.reduce((sum, req) => sum + req.estimatedCost.max, 0);
    const currency = requirements.length > 0 ? requirements[0].estimatedCost.currency : 'USD';
    
    // Calculate total timeline
    const totalTimeline = this.calculateTotalTimeline(requirements);
    
    // Calculate confidence score
    let confidenceScore = undefined;
    if (requirements.some(req => req.confidenceScore !== undefined)) {
      const scores = requirements
        .filter(req => req.confidenceScore !== undefined)
        .map(req => req.confidenceScore as number);
      confidenceScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return {
      requirements,
      timelineVisualizationData,
      totalEstimatedCost: {
        min: totalMin,
        max: totalMax,
        currency
      },
      totalEstimatedTimelineInDays: totalTimeline,
      confidenceScore
    };
  }
  
  /**
   * Generate timeline visualization data for certification roadmap
   */
  private generateTimelineVisualization(
    requirements: CertificationRequirement[],
    budget: number,
    timelineMonths: number
  ) {
    // Convert timeline from months to days
    const timelineDays = timelineMonths * 30;
    
    // Sort requirements by priority (required first, then by timeline)
    const sortedRequirements = [...requirements].sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return a.estimatedTimelineInDays - b.estimatedTimelineInDays;
    });
    
    // Allocate timeline based on budget constraints
    let currentDay = 0;
    let remainingBudget = budget;
    
    return sortedRequirements.map(req => {
      // Determine how much of this requirement can be covered by the budget
      const reqCost = (req.estimatedCost.min + req.estimatedCost.max) / 2;
      const costCovered = Math.min(reqCost, remainingBudget);
      remainingBudget -= costCovered;
      
      // If we can't cover any cost, push to later in the timeline
      if (costCovered === 0 && remainingBudget === 0) {
        currentDay += 30; // Add a month delay for budget to recover
      }
      
      // Create timeline item
      const timelineItem = {
        certificationName: req.name,
        startDay: currentDay,
        durationDays: req.estimatedTimelineInDays,
        marketCode: req.marketCode,
        cost: reqCost
      };
      
      // Update current day for the next item
      currentDay += Math.min(
        req.estimatedTimelineInDays,
        Math.max(30, timelineDays - currentDay)
      );
      
      return timelineItem;
    });
  }
  
  /**
   * Calculate the total timeline for all requirements,
   * accounting for requirements that can be pursued in parallel
   */
  private calculateTotalTimeline(requirements: CertificationRequirement[]): number {
    if (requirements.length === 0) return 0;
    
    // Group requirements by market
    const marketGroups: Record<string, CertificationRequirement[]> = {};
    for (const req of requirements) {
      if (!marketGroups[req.marketCode]) {
        marketGroups[req.marketCode] = [];
      }
      marketGroups[req.marketCode].push(req);
    }
    
    // Find the maximum timeline for each market (assuming requirements
    // within the same market can be pursued somewhat in parallel)
    const marketTimelines = Object.values(marketGroups).map(reqs => {
      // Calculate a reduced total that accounts for some parallelization
      const total = reqs.reduce((sum, req) => sum + req.estimatedTimelineInDays, 0);
      const max = Math.max(...reqs.map(req => req.estimatedTimelineInDays));
      
      // Use a formula that estimates some parallel work but not complete parallelization
      return Math.max(max, total * 0.7);
    });
    
    // Sum the market timelines (assuming different markets must be addressed sequentially)
    return Math.round(marketTimelines.reduce((sum, timeline) => sum + timeline, 0));
  }
  
  /**
   * Generate the Resource Needs section of the report
   */
  private generateResourceNeeds(
    assessmentState: AssessmentState,
    complianceRequirements: ComplianceRequirement[],
    marketData: Record<string, MarketInsight>
  ): ResourceNeedsSection {
    // Collect all resource needs
    const resourceNeeds: ResourceNeed[] = [
      ...this.identifyFinancialResourceNeeds(assessmentState, complianceRequirements),
      ...this.identifyHumanResourceNeeds(assessmentState, marketData),
      ...this.identifyInfrastructureResourceNeeds(assessmentState, marketData),
      ...this.identifyKnowledgeResourceNeeds(assessmentState, marketData, complianceRequirements)
    ];
    
    // Analyze production capacity requirements
    const capacityAnalysis = this.analyzeProductionCapacity(
      assessmentState.productionCapacity,
      assessmentState.selectedProducts,
      marketData
    );
    
    // Generate supply chain considerations
    const supplyChainConsiderations = this.generateSupplyChainConsiderations(
      assessmentState,
      marketData
    );
    
    // Recommend budget allocation based on needs
    const budgetAllocationRecommendation = this.recommendBudgetAllocation(
      resourceNeeds,
      assessmentState.budget,
      complianceRequirements
    );
    
    // Calculate confidence score
    let confidenceScore = undefined;
    if (resourceNeeds.some(need => need.confidenceScore !== undefined)) {
      const scores = resourceNeeds
        .filter(need => need.confidenceScore !== undefined)
        .map(need => need.confidenceScore as number);
      confidenceScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return {
      resourceNeeds,
      budgetAllocationRecommendation,
      productionCapacityAnalysis: capacityAnalysis,
      supplyChainConsiderations,
      confidenceScore
    };
  }
  
  /**
   * Generate the Action Plan section of the report
   */
  private generateActionPlan(
    assessmentState: AssessmentState,
    complianceRequirements: ComplianceRequirement[],
    marketData: Record<string, MarketInsight>
  ): ActionPlanSection {
    // Generate action items
    const actionItems = this.generateActionItems(
      assessmentState,
      complianceRequirements,
      marketData
    );
    
    // Generate implementation timeline
    const implementationTimeline = this.generateImplementationTimeline(
      actionItems,
      assessmentState.budget.timeline
    );
    
    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(
      assessmentState,
      marketData
    );
    
    // Calculate confidence score
    let confidenceScore = undefined;
    if (actionItems.some(item => item.confidenceScore !== undefined)) {
      const scores = actionItems
        .filter(item => item.confidenceScore !== undefined)
        .map(item => item.confidenceScore as number);
      confidenceScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return {
      actionItems,
      implementationTimeline,
      riskAssessment,
      confidenceScore
    };
  }
  
  /**
   * Calculate overall confidence score for the entire report
   */
  private calculateOverallConfidenceScore(
    marketOverview: MarketOverviewSection[],
    certificationRoadmap: CertificationRoadmapSection,
    resourceNeeds: ResourceNeedsSection,
    actionPlan: ActionPlanSection
  ): number {
    const scores: number[] = [];
    
    // Add market overview confidence scores
    const marketScores = marketOverview
      .filter(market => market.confidenceScore !== undefined)
      .map(market => market.confidenceScore as number);
    
    if (marketScores.length > 0) {
      const avgMarketScore = marketScores.reduce((sum, score) => sum + score, 0) / marketScores.length;
      scores.push(avgMarketScore);
    }
    
    // Add certification roadmap confidence score
    if (certificationRoadmap.confidenceScore !== undefined) {
      scores.push(certificationRoadmap.confidenceScore);
    }
    
    // Add resource needs confidence score
    if (resourceNeeds.confidenceScore !== undefined) {
      scores.push(resourceNeeds.confidenceScore);
    }
    
    // Add action plan confidence score
    if (actionPlan.confidenceScore !== undefined) {
      scores.push(actionPlan.confidenceScore);
    }
    
    // Return average of all confidence scores, or 0.75 if no scores available
    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0.75;
  }
  
  /**
   * Calculate export readiness score based on assessment data
   */
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
  
  /**
   * Identify financial resource needs
   */
  private identifyFinancialResourceNeeds(
    assessmentState: AssessmentState,
    complianceRequirements: ComplianceRequirement[]
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    
    // Calculate total compliance costs
    const complianceCosts = complianceRequirements.reduce(
      (total, req) => {
        if (req.estimatedCost) {
          total.min += req.estimatedCost.min;
          total.max += req.estimatedCost.max;
        }
        return total;
      },
      { min: 0, max: 0 }
    );
    
    const currency = complianceRequirements.length > 0 && complianceRequirements[0].estimatedCost
      ? complianceRequirements[0].estimatedCost.currency
      : assessmentState.budget.currency;
    
    // Certification costs
    needs.push({
      type: 'financial',
      name: 'Certification and Compliance Costs',
      description: 'Budget required for obtaining all necessary certifications and meeting regulatory requirements',
      estimatedCost: {
        min: complianceCosts.min,
        max: complianceCosts.max,
        currency
      },
      priority: complianceCosts.min > assessmentState.budget.amount * 0.3 ? 'high' : 'medium',
      timeline: `${Math.ceil(assessmentState.budget.timeline * 0.4)} months`,
      alternativeOptions: [
        'Prioritize certifications by market importance',
        'Explore government export promotion funding',
        'Consider phased implementation to spread costs'
      ]
    });
    
    // Market entry costs
    const marketCount = assessmentState.marketInfo.targetMarkets.length;
    const marketEntryCost = {
      min: 5000 * marketCount,
      max: 15000 * marketCount,
      currency: assessmentState.budget.currency
    };
    
    needs.push({
      type: 'financial',
      name: 'Market Entry and Marketing Costs',
      description: 'Budget required for market entry activities, marketing materials, and initial promotion',
      estimatedCost: marketEntryCost,
      priority: 'high',
      timeline: `${Math.ceil(assessmentState.budget.timeline * 0.5)} months`,
      alternativeOptions: [
        'Partner with established distributors to share costs',
        'Utilize digital marketing to reduce traditional marketing costs',
        'Join trade missions and government-sponsored exhibitions'
      ]
    });
    
    // Logistics setup costs
    const logisticsCost = {
      min: 3000 * marketCount,
      max: 8000 * marketCount,
      currency: assessmentState.budget.currency
    };
    
    needs.push({
      type: 'financial',
      name: 'Logistics and Shipping Setup Costs',
      description: 'Budget required for establishing logistics channels, freight partnerships, and shipping protocols',
      estimatedCost: logisticsCost,
      priority: 'medium',
      timeline: `${Math.ceil(assessmentState.budget.timeline * 0.3)} months`,
      alternativeOptions: [
        'Use freight forwarders specializing in your target markets',
        'Consider consolidated shipping options',
        'Explore different Incoterms to optimize cost distribution'
      ]
    });
    
    return needs;
  }
  
  /**
   * Identify human resource needs
   */
  private identifyHumanResourceNeeds(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    const marketCount = assessmentState.marketInfo.targetMarkets.length;
    const currency = assessmentState.budget.currency;
    
    // Export management expertise
    needs.push({
      type: 'human',
      name: 'Export Management Expertise',
      description: 'Personnel with export management experience to coordinate certification, logistics, and market entry',
      estimatedCost: {
        min: 3000 * marketCount,
        max: 6000 * marketCount,
        currency
      },
      priority: 'high',
      timeline: 'Ongoing',
      alternativeOptions: [
        'Hire export consultant on project basis',
        'Train existing staff on export procedures',
        'Join export mentorship programs'
      ]
    });
    
    // Market-specific expertise
      needs.push({
        type: 'human',
      name: 'Market-Specific Sales Representation',
      description: 'Sales representatives familiar with target markets to establish and manage distributor relationships',
        estimatedCost: {
        min: 2000 * marketCount,
        max: 5000 * marketCount,
        currency
      },
      priority: 'medium',
      timeline: `${Math.ceil(assessmentState.budget.timeline * 0.6)} months`,
      alternativeOptions: [
          'Partner with local market experts in target countries',
        'Utilize distributor networks with existing presence',
        'Consider virtual representation through digital channels initially'
      ]
    });
    
    // Compliance specialist
    const complexMarkets = assessmentState.marketInfo.targetMarkets.filter(
      market => ['CN', 'JP', 'AE', 'SA', 'RU', 'BR'].includes(market.code)
    ).length;
    
    if (complexMarkets > 0) {
      needs.push({
        type: 'human',
        name: 'Regulatory Compliance Specialist',
        description: 'Specialist with expertise in navigating complex regulatory environments in target markets',
        estimatedCost: {
          min: 2500 * complexMarkets,
          max: 4500 * complexMarkets,
          currency
        },
        priority: 'medium',
        timeline: `${Math.ceil(assessmentState.budget.timeline * 0.3)} months`,
        alternativeOptions: [
          'Engage with compliance consulting firms on a project basis',
          'Partner with industry associations with regulatory expertise',
          'Utilize embassy commercial services for regulatory guidance'
        ]
      });
    }
    
    return needs;
  }
  
  /**
   * Identify infrastructure resource needs
   */
  private identifyInfrastructureResourceNeeds(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    const currency = assessmentState.budget.currency;
    
    // Production capacity needs
    const currentCapacity = assessmentState.productionCapacity.monthlyCapacity;
    const marketCount = assessmentState.marketInfo.targetMarkets.length;
    const productCount = assessmentState.selectedProducts.length;
    
    // Estimate required capacity increase
    let capacityExpansionNeeded = false;
    let expansionRatio = 1;
    
    if (currentCapacity < 1000 && productCount > 1 && marketCount > 1) {
      capacityExpansionNeeded = true;
      expansionRatio = Math.min(1 + (0.2 * marketCount + 0.1 * productCount), 3);
    }
    
    if (capacityExpansionNeeded) {
      needs.push({
        type: 'infrastructure',
        name: 'Production Capacity Expansion',
        description: `Increase production capacity by approximately ${Math.round((expansionRatio-1)*100)}% to meet export market demands`,
        estimatedCost: {
          min: 10000 * Math.round(expansionRatio * 0.5),
          max: 50000 * Math.round(expansionRatio * 0.5),
          currency
        },
        priority: 'high',
        timeline: `${Math.ceil(assessmentState.budget.timeline * 0.4)} months`,
        alternativeOptions: [
          'Optimize current production processes before expanding',
          'Consider contract manufacturing for overflow production',
          'Phase market entry to manage capacity requirements'
        ]
      });
    }
    
    // Quality control infrastructure
    needs.push({
      type: 'infrastructure',
      name: 'Quality Control Infrastructure',
      description: 'Equipment and systems needed to meet international quality standards and certification requirements',
      estimatedCost: {
        min: 5000,
        max: 15000,
        currency
      },
      priority: capacityExpansionNeeded ? 'medium' : 'high',
      timeline: `${Math.ceil(assessmentState.budget.timeline * 0.3)} months`,
      alternativeOptions: [
        'Partner with third-party quality control services',
        'Implement quality management software systems',
        'Gradually upgrade testing equipment as export volumes increase'
      ]
    });
    
    // Packaging and labeling upgrades
    const marketSpecificPackaging = assessmentState.marketInfo.targetMarkets.some(
      market => ['CN', 'JP', 'AE', 'SA'].includes(market.code)
    );
    
    if (marketSpecificPackaging) {
      needs.push({
        type: 'infrastructure',
        name: 'Packaging and Labeling Equipment',
        description: 'Packaging and labeling infrastructure to meet international standards and market-specific requirements',
        estimatedCost: {
          min: 3000,
          max: 12000,
          currency
        },
        priority: 'medium',
        timeline: `${Math.ceil(assessmentState.budget.timeline * 0.2)} months`,
        alternativeOptions: [
          'Outsource packaging to specialized facilities',
          'Use modular labeling approaches for multiple markets',
          'Invest in digital printing for smaller, flexible label runs'
        ]
      });
    }
    
    return needs;
  }
  
  /**
   * Identify knowledge resource needs
   */
  private identifyKnowledgeResourceNeeds(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>,
    complianceRequirements: ComplianceRequirement[]
  ): ResourceNeed[] {
    const needs: ResourceNeed[] = [];
    const currency = assessmentState.budget.currency;
    
    // Export documentation knowledge
    needs.push({
      type: 'knowledge',
      name: 'Export Documentation Training',
      description: 'Training on export documentation, customs procedures, and compliance record-keeping',
      estimatedCost: {
        min: 500,
        max: 2000,
        currency
      },
      priority: 'high',
      timeline: '1-2 months',
      alternativeOptions: [
        'Attend export training workshops by trade promotion organizations',
        'Utilize online export procedure courses',
        'Join export networking groups for knowledge sharing'
      ]
    });
    
    // Market-specific cultural knowledge
    const culturallyComplexMarkets = assessmentState.marketInfo.targetMarkets.filter(
      market => ['CN', 'JP', 'AE', 'SA', 'KR', 'IN'].includes(market.code)
    );
    
    if (culturallyComplexMarkets.length > 0) {
        needs.push({
          type: 'knowledge',
        name: 'Cultural Business Practices Training',
        description: `Cultural business training for ${culturallyComplexMarkets.map(m => m.name).join(', ')} markets`,
          estimatedCost: {
          min: 300 * culturallyComplexMarkets.length,
          max: 1500 * culturallyComplexMarkets.length,
          currency
        },
        priority: 'medium',
        timeline: '1-3 months',
        alternativeOptions: [
            'Hire local business culture consultant for training',
            'Participate in cultural business exchange programs',
            'Partner with businesses experienced in the target market'
          ]
        });
      }
    
    // Regulatory compliance knowledge
    if (complianceRequirements.length > 3) {
      needs.push({
        type: 'knowledge',
        name: 'Regulatory Compliance Training',
        description: 'Training on specific regulatory requirements and compliance processes for target markets',
        estimatedCost: {
          min: 1000,
          max: 3000,
          currency
        },
        priority: 'high',
        timeline: '2-3 months',
        alternativeOptions: [
          'Engage with regulatory consultants for targeted training',
          'Utilize industry association compliance resources',
          'Participate in government export compliance programs'
        ]
      });
    }
    
    return needs;
  }
  
  /**
   * Analyze production capacity requirements
   */
  private analyzeProductionCapacity(
    productionCapacity: ProductionCapacity,
    products: Product[],
    marketData: Record<string, MarketInsight>
  ) {
    // Estimate required capacity based on target markets
    const marketCount = Object.keys(marketData).length;
    const productCount = products.length;
    
    // Basic formula for required capacity
    let requiredCapacity = productionCapacity.monthlyCapacity * (1 + 0.3 * marketCount);
    
    // Adjust based on market size and growth potential
    const avgGrowthRate = Object.values(marketData)
      .reduce((sum, market) => sum + (market.marketSize.growthRate || 0), 0) / marketCount;
    
    // Add growth factor
    requiredCapacity *= (1 + Math.min(avgGrowthRate / 100, 0.5));
    
    // Calculate capacity gap
    const capacityGap = requiredCapacity - productionCapacity.monthlyCapacity;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (capacityGap > 0) {
      recommendations.push(`Increase production capacity by at least ${Math.round(capacityGap)} ${productionCapacity.unit} per month to meet export market demand.`);
      
      if (capacityGap > productionCapacity.monthlyCapacity * 0.5) {
        recommendations.push('Consider phased market entry to manage production capacity constraints.');
        recommendations.push('Explore contract manufacturing or production partnerships to address capacity limitations.');
      } else {
        recommendations.push('Optimize current production processes to increase efficiency before major capacity investments.');
      }
    } else {
      recommendations.push('Current production capacity is sufficient for initial export market entry.');
      recommendations.push('Monitor capacity utilization closely during the first 6 months of export activities.');
    }
    
    // Add lead time recommendations
    if (productionCapacity.leadTime > 14) {
      recommendations.push(`Work on reducing lead times from current ${productionCapacity.leadTime} days to improve market responsiveness.`);
    }
    
    return {
      currentCapacity: productionCapacity.monthlyCapacity,
      requiredCapacity: Math.round(requiredCapacity),
      capacityGap: Math.round(capacityGap),
      recommendations
    };
  }
  
  /**
   * Generate supply chain considerations
   */
  private generateSupplyChainConsiderations(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>
  ): string[] {
    const considerations: string[] = [];
    const marketCodes = Object.keys(marketData);
    
    // Distance-based considerations
    const distantMarkets = marketCodes.filter(code => 
      ['CN', 'JP', 'AE', 'SA', 'AU', 'NZ', 'SG', 'IN'].includes(code)
    );
    
    if (distantMarkets.length > 0) {
      considerations.push('Long shipping distances to Asian and Middle Eastern markets will require optimized logistics planning and increased lead times.');
      considerations.push('Consider consolidating shipments to reduce freight costs for distant markets.');
    }
    
    // Cold chain requirements
    const perishableProducts = assessmentState.selectedProducts.some(product => 
      product.category.toLowerCase().includes('food') || 
      product.category.toLowerCase().includes('beverage') ||
      product.category.toLowerCase().includes('fresh')
    );
    
    if (perishableProducts) {
      considerations.push('Perishable products will require cold chain logistics and careful shelf-life management for international markets.');
      considerations.push('Evaluate packaging solutions to extend shelf life for extended shipping durations.');
    }
    
    // Customs and documentation
    considerations.push('Establish relationships with freight forwarders experienced in your target markets to streamline customs clearance.');
    considerations.push('Implement digital documentation systems to ensure consistent and accurate export documentation.');
    
    // Inventory management
    considerations.push(`Adjust inventory management practices to account for longer supply chains and ${assessmentState.productionCapacity.leadTime} day lead times.`);
    
    // Tariff and trade agreement considerations
    const hasTariffChallenges = Object.values(marketData).some(market => 
      Object.values(market.tariffs).some(tariff => tariff.rate > 10)
    );
    
    if (hasTariffChallenges) {
      considerations.push('High tariff rates in some target markets may impact pricing strategy and market competitiveness.');
      considerations.push('Investigate bonded warehousing options to defer duty payments until products enter the market.');
    }
    
    // Market-specific supply chain considerations
    if (marketCodes.includes('CN')) {
      considerations.push('The Chinese market requires careful selection of distribution partners and potential warehousing within free trade zones.');
    }
    
    if (marketCodes.includes('AE') || marketCodes.includes('SA')) {
      considerations.push('Middle Eastern markets often require specific labeling and certification for religious compliance (Halal).');
    }
    
    return considerations;
  }
  
  /**
   * Recommend budget allocation based on needs
   */
  private recommendBudgetAllocation(
    resourceNeeds: ResourceNeed[],
    budget: Budget,
    complianceRequirements: ComplianceRequirement[]
  ) {
    // Analyze costs by category
    const complianceCosts = resourceNeeds
      .filter(need => need.type === 'financial' && need.name.includes('Certification'))
      .reduce((sum, need) => sum + ((need.estimatedCost?.min || 0) + (need.estimatedCost?.max || 0)) / 2, 0);
    
    const marketingCosts = resourceNeeds
      .filter(need => need.type === 'financial' && need.name.includes('Market'))
      .reduce((sum, need) => sum + ((need.estimatedCost?.min || 0) + (need.estimatedCost?.max || 0)) / 2, 0);
    
    const logisticsCosts = resourceNeeds
      .filter(need => need.type === 'financial' && (need.name.includes('Logistics') || need.name.includes('Supply')))
      .reduce((sum, need) => sum + ((need.estimatedCost?.min || 0) + (need.estimatedCost?.max || 0)) / 2, 0);
    
    const otherCosts = resourceNeeds
      .filter(need => !need.name.includes('Certification') && !need.name.includes('Market') && !need.name.includes('Logistics') && !need.name.includes('Supply'))
      .reduce((sum, need) => sum + ((need.estimatedCost?.min || 0) + (need.estimatedCost?.max || 0)) / 2, 0);
    
    // Calculate total estimated costs
    const totalEstimatedCost = complianceCosts + marketingCosts + logisticsCosts + otherCosts;
    
    // Calculate recommended percentages
    let certPercentage = Math.round((complianceCosts / totalEstimatedCost) * 100);
    let marketingPercentage = Math.round((marketingCosts / totalEstimatedCost) * 100);
    let logisticsPercentage = Math.round((logisticsCosts / totalEstimatedCost) * 100);
    let otherPercentage = Math.round((otherCosts / totalEstimatedCost) * 100);
    
    // Adjust for minimum requirements
    if (certPercentage < 20 && complianceRequirements.length > 2) {
      certPercentage = 20;
    }
    
    if (marketingPercentage < 25) {
      marketingPercentage = 25;
    }
    
    if (logisticsPercentage < 15) {
      logisticsPercentage = 15;
    }
    
    // Normalize to 100%
    const total = certPercentage + marketingPercentage + logisticsPercentage + otherPercentage;
    const adjustmentFactor = 100 / total;
    
    return {
      certifications: Math.round(certPercentage * adjustmentFactor),
      marketing: Math.round(marketingPercentage * adjustmentFactor),
      logistics: Math.round(logisticsPercentage * adjustmentFactor),
      other: Math.round(otherPercentage * adjustmentFactor)
    };
  }
  
  /**
   * Generate action items for the action plan
   */
  private generateActionItems(
    assessmentState: AssessmentState,
    complianceRequirements: ComplianceRequirement[],
    marketData: Record<string, MarketInsight>
  ): ActionItem[] {
    const actionItems: ActionItem[] = [];
    const timelineMonths = assessmentState.budget.timeline;
    
    // Immediate actions (first 3 months)
    
    // 1. Compliance preparation
    actionItems.push({
      id: 'act-001',
      name: 'Begin Compliance Preparation',
      description: 'Start the process for obtaining required certifications and meeting regulatory requirements',
      priority: 'high',
      timeline: {
        startDay: 0,
        durationDays: 60
      },
      dependsOn: [],
      resources: [
        'Compliance documentation',
        'Legal expertise',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.1)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.1),
        currency: assessmentState.budget.currency
      },
      marketCodes: assessmentState.marketInfo.targetMarkets.map(m => m.code)
    });
    
    // 2. Market research refinement
    actionItems.push({
      id: 'act-002',
      name: 'Refine Market Research',
      description: 'Conduct detailed market research to validate opportunities and refine strategy',
      priority: 'high',
      timeline: {
        startDay: 0,
        durationDays: 45
      },
      dependsOn: [],
      resources: [
        'Market research tools',
        'Industry reports',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.05)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.05),
        currency: assessmentState.budget.currency
      },
      marketCodes: assessmentState.marketInfo.targetMarkets.map(m => m.code)
    });
    
    // 3. Partner identification
    actionItems.push({
      id: 'act-003',
      name: 'Identify Potential Distribution Partners',
      description: 'Research and initiate contact with potential distributors or partners in target markets',
      priority: 'high',
      timeline: {
        startDay: 45,
        durationDays: 90
      },
      dependsOn: ['act-002'],
      resources: [
        'Networking platforms',
        'Trade show participation',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.08)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.08),
        currency: assessmentState.budget.currency
      },
      marketCodes: assessmentState.marketInfo.targetMarkets.map(m => m.code)
    });
    
    // Medium-term actions (3-6 months)
    
    // 4. Product adaptation
    const needsAdaptation = Object.values(marketData).some(market => 
      market.recommendations.some(rec => 
        rec.toLowerCase().includes('adapt') || rec.toLowerCase().includes('modif')
      )
    );
    
    if (needsAdaptation) {
      actionItems.push({
        id: 'act-004',
        name: 'Adapt Products for Target Markets',
      description: 'Modify products to meet target market requirements and preferences',
      priority: 'high',
        timeline: {
          startDay: 90,
          durationDays: 90
        },
        dependsOn: ['act-002'],
        resources: [
          'R&D budget',
          'Product design expertise',
          `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.12)}`
        ],
        estimatedCost: {
          amount: Math.round(assessmentState.budget.amount * 0.12),
          currency: assessmentState.budget.currency
        },
        marketCodes: assessmentState.marketInfo.targetMarkets.map(m => m.code)
      });
    }
    
    // 5. Export logistics setup
    actionItems.push({
      id: 'act-005',
      name: 'Set Up Export Logistics Chain',
      description: 'Establish relationships with freight forwarders and develop shipping procedures',
      priority: 'medium',
      timeline: {
        startDay: 120,
        durationDays: 60
      },
      dependsOn: [],
      resources: [
        'Logistics consultants',
        'Shipping platforms',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.07)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.07),
        currency: assessmentState.budget.currency
      },
      marketCodes: assessmentState.marketInfo.targetMarkets.map(m => m.code)
    });
    
    // 6. Marketing strategy development
    actionItems.push({
      id: 'act-006',
      name: 'Develop International Marketing Strategy',
      description: 'Create marketing materials and strategy tailored to target markets',
      priority: 'medium',
      timeline: {
        startDay: 120,
        durationDays: 90
      },
      dependsOn: ['act-002', needsAdaptation ? 'act-004' : ''],
      resources: [
        'Marketing budget',
        'Design services',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.1)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.1),
        currency: assessmentState.budget.currency
      },
      marketCodes: assessmentState.marketInfo.targetMarkets.map(m => m.code)
    });
    
    // Long-term actions (6-12 months)
    
    // 7. Pilot export shipment
    actionItems.push({
      id: 'act-007',
      name: 'Execute Pilot Export Shipment',
      description: 'Send first test shipment to primary target market',
      priority: 'high',
      timeline: {
        startDay: 180,
        durationDays: 30
      },
      dependsOn: ['act-001', 'act-003', needsAdaptation ? 'act-004' : '', 'act-005'],
      resources: [
        'Product inventory',
        'Export documentation',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.05)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.05),
        currency: assessmentState.budget.currency
      },
      marketCodes: [assessmentState.marketInfo.targetMarkets[0].code]
    });
    
    // 8. Export process refinement
    actionItems.push({
      id: 'act-008',
      name: 'Refine Export Processes Based on Pilot',
      description: 'Evaluate pilot shipment results and optimize processes',
      priority: 'high',
      timeline: {
        startDay: 210,
        durationDays: 60
      },
      dependsOn: ['act-007'],
      resources: [
        'Process improvement methodology',
        'Feedback systems',
        `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.03)}`
      ],
      estimatedCost: {
        amount: Math.round(assessmentState.budget.amount * 0.03),
        currency: assessmentState.budget.currency
      },
      marketCodes: [assessmentState.marketInfo.targetMarkets[0].code]
    });
    
    // 9. Market expansion planning
    if (assessmentState.marketInfo.targetMarkets.length > 1) {
      actionItems.push({
        id: 'act-009',
        name: 'Plan Secondary Market Entry',
      description: 'Develop timeline and strategy for entering additional target markets',
      priority: 'medium',
        timeline: {
          startDay: 270,
          durationDays: 90
        },
        dependsOn: ['act-007', 'act-008'],
        resources: [
          'Market entry templates',
          'Expansion budget',
          `Budget: ${assessmentState.budget.currency} ${Math.round(assessmentState.budget.amount * 0.04)}`
        ],
        estimatedCost: {
          amount: Math.round(assessmentState.budget.amount * 0.04),
          currency: assessmentState.budget.currency
        },
        marketCodes: assessmentState.marketInfo.targetMarkets.slice(1).map(m => m.code)
      });
    }
    
    // Add compliance-specific action items
    const criticalRequirements = complianceRequirements
      .filter(req => req.isRequired)
      .sort((a, b) => (a.estimatedTimelineInDays || 90) - (b.estimatedTimelineInDays || 90));
    
    let startDay = 30; // Start compliance items 1 month in
    
    for (let i = 0; i < Math.min(3, criticalRequirements.length); i++) {
      const req = criticalRequirements[i];
      actionItems.push({
        id: `act-c${i + 1}`,
        name: `Obtain ${req.name}`,
        description: `Complete the application and certification process for ${req.name}`,
        priority: 'high',
        timeline: {
          startDay,
          durationDays: req.estimatedTimelineInDays || 90
        },
        dependsOn: ['act-001'],
        resources: [
          'Compliance documentation',
          `Budget: ${req.estimatedCost?.currency || assessmentState.budget.currency} ${(req.estimatedCost?.min || 0) + (req.estimatedCost?.max || 0) / 2}`
        ],
        estimatedCost: {
          amount: (req.estimatedCost?.min || 0) + (req.estimatedCost?.max || 0) / 2,
          currency: req.estimatedCost?.currency || assessmentState.budget.currency
        },
        marketCodes: [req.countryCode]
      });
      
      startDay += 15; // Stagger compliance items
    }
    
    // Filter out empty dependsOn entries and return action items sorted by start day
    return actionItems.map(item => ({
      ...item,
      dependsOn: item.dependsOn.filter(d => d !== '')
    })).sort((a, b) => a.timeline.startDay - b.timeline.startDay);
  }
  
  /**
   * Generate implementation timeline based on action items
   */
  private generateImplementationTimeline(
    actionItems: ActionItem[],
    timelineMonths: number
  ) {
    // Create phases based on the timeline
    const phases = [
      {
        phase: 'Preparation Phase',
        startDay: 0,
        durationDays: Math.min(90, timelineMonths * 30 * 0.25),
        items: [] as string[]
      },
      {
        phase: 'Development Phase',
        startDay: Math.min(90, timelineMonths * 30 * 0.25),
        durationDays: Math.min(180, timelineMonths * 30 * 0.5) - Math.min(90, timelineMonths * 30 * 0.25),
        items: [] as string[]
      },
      {
        phase: 'Execution Phase',
        startDay: Math.min(180, timelineMonths * 30 * 0.5),
        durationDays: Math.min(270, timelineMonths * 30 * 0.75) - Math.min(180, timelineMonths * 30 * 0.5),
        items: [] as string[]
      },
      {
        phase: 'Expansion Phase',
        startDay: Math.min(270, timelineMonths * 30 * 0.75),
        durationDays: timelineMonths * 30 - Math.min(270, timelineMonths * 30 * 0.75),
        items: [] as string[]
      }
    ];
    
    // Assign action items to phases
    for (const item of actionItems) {
      for (const phase of phases) {
        if (item.timeline.startDay >= phase.startDay && 
            item.timeline.startDay < phase.startDay + phase.durationDays) {
          phase.items.push(item.id);
          break;
        }
      }
    }
    
    // Filter out empty phases
    return phases.filter(phase => phase.items.length > 0);
  }
  
  /**
   * Generate risk assessment based on market and compliance data
   */
  private generateRiskAssessment(
    assessmentState: AssessmentState,
    marketData: Record<string, MarketInsight>
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    
    // Competitive market risks
    const topCompetitiveMarkets = Object.entries(marketData)
      .filter(([code, market]) => market.topCompetitors.length > 3)
      .map(([code]) => code);
    
    if (topCompetitiveMarkets.length > 0) {
      riskFactors.push({
        name: 'High Competitive Intensity',
        probability: 'high',
        impact: 'medium',
        mitigationStrategy: 'Focus on product differentiation and niche market segments where competition is less intense'
      });
    }
    
    // Regulatory risks
    const highRegulatoryMarkets = assessmentState.marketInfo.targetMarkets
      .filter(market => ['CN', 'JP', 'RU', 'BR', 'IN'].includes(market.code))
      .map(market => market.code);
    
    if (highRegulatoryMarkets.length > 0) {
      riskFactors.push({
        name: 'Regulatory Compliance Challenges',
        probability: 'high',
        impact: 'high',
        mitigationStrategy: 'Engage with regulatory experts and allow additional time for certification in complex markets'
      });
    }
    
    // Production capacity risks
    if (assessmentState.productionCapacity.monthlyCapacity < 1000 && 
        assessmentState.marketInfo.targetMarkets.length > 2) {
      riskFactors.push({
        name: 'Production Capacity Constraints',
        probability: 'medium',
        impact: 'high',
        mitigationStrategy: 'Phase market entry to manage capacity and consider production partnerships for overflow demand'
      });
    }
    
    // Market entry timing risks
    if (assessmentState.budget.timeline < 12) {
      riskFactors.push({
        name: 'Aggressive Timeline Constraints',
        probability: 'high',
        impact: 'medium',
        mitigationStrategy: 'Prioritize critical certifications and focus on one primary market before expanding'
      });
    }
    
    // Budget constraints
    const estimatedTotalCost = assessmentState.marketInfo.targetMarkets.length * 25000;
    if (assessmentState.budget.amount < estimatedTotalCost) {
      riskFactors.push({
        name: 'Budget Constraints',
        probability: 'medium',
        impact: 'high',
        mitigationStrategy: 'Seek export financing options and prioritize expenditures on highest-return activities'
      });
    }
    
    // Currency and payment risks
    const volatileMarkets = assessmentState.marketInfo.targetMarkets
      .filter(market => ['RU', 'BR', 'IN', 'TR', 'ZA'].includes(market.code))
      .map(market => market.code);
    
    if (volatileMarkets.length > 0) {
      riskFactors.push({
        name: 'Currency Volatility and Payment Risks',
        probability: 'medium',
        impact: 'medium',
        mitigationStrategy: 'Implement hedging strategies and secure payment terms (letters of credit or advance payments)'
      });
    }
    
    // Supply chain disruption risks
    const distantMarkets = assessmentState.marketInfo.targetMarkets
      .filter(market => ['CN', 'JP', 'AU', 'NZ', 'SG', 'IN'].includes(market.code))
      .map(market => market.code);
    
    if (distantMarkets.length > 0) {
      riskFactors.push({
        name: 'Supply Chain Disruptions',
        probability: 'medium',
        impact: 'high',
        mitigationStrategy: 'Develop contingency shipping routes and maintain safety stock for key markets'
      });
    }
    
    // Cultural and business practice risks
    const culturallyDistantMarkets = assessmentState.marketInfo.targetMarkets
      .filter(market => ['CN', 'JP', 'AE', 'SA', 'KR'].includes(market.code))
      .map(market => market.code);
    
    if (culturallyDistantMarkets.length > 0) {
      riskFactors.push({
        name: 'Cultural and Business Practice Differences',
        probability: 'high',
        impact: 'medium',
        mitigationStrategy: 'Partner with local representatives and invest in cultural training for key staff'
      });
    }
    
    return riskFactors;
  }

  // Method to generate mock report data for testing
  private generateMockReportData(assessmentState: AssessmentState): ReportData {
    logger.info('Generating mock report data');
    
    const targetMarkets = assessmentState.marketInfo?.targetMarkets || [];
    const products = assessmentState.selectedProducts || [];
    
    // Generate a simple mock report
    return {
      businessProfile: assessmentState.businessProfile || {
        name: 'Sample Business',
        description: 'A sample business profile',
        industry: 'Manufacturing',
        location: 'Sample Location',
        websiteUrl: 'https://example.com',
        contactInfo: {}
      },
      selectedProducts: products,
      productionCapacity: assessmentState.productionCapacity || {
        monthlyCapacity: 1000,
        unit: 'units',
        leadTime: 30,
        minimumOrderQuantity: 100
      },
      marketInfo: assessmentState.marketInfo || {
        targetMarkets: [],
        existingMarkets: [],
        competitorAnalysis: ''
      },
      certifications: assessmentState.certifications || [],
      budget: assessmentState.budget || {
        amount: 100000,
        currency: 'USD',
        timeline: 12,
        allocation: {
          certifications: 30,
          marketing: 40,
          logistics: 20,
          other: 10
        }
      },
      
      // Mock report sections
      marketOverview: targetMarkets.map(market => ({
        marketCode: market.code,
        marketName: market.name,
        marketSize: 10000000,
        marketCurrency: 'USD',
        growthRate: 5,
        keyCompetitors: [
          { name: 'Competitor A', marketShare: 25 },
          { name: 'Competitor B', marketShare: 20 }
        ],
        entryBarriers: ['Regulatory requirements', 'Local competition'],
        opportunities: ['Growing market', 'Premium segment potential'],
        risks: ['Currency fluctuation', 'Supply chain risks'],
        productSpecificInsights: ['Good potential for export growth'],
        confidenceScore: 0.85
      })),
      
      certificationRoadmap: {
        requirements: [
          {
            id: 'iso9001',
            name: 'ISO 9001',
            description: 'Quality management certification',
            isRequired: true,
            estimatedCost: { min: 5000, max: 10000, currency: 'USD' },
            estimatedTimelineInDays: 180,
            marketCode: 'global',
            marketName: 'Global Markets',
            regulatoryBody: 'ISO',
            referenceUrl: 'https://www.iso.org',
            confidenceScore: 0.9
          }
        ],
        timelineVisualizationData: [
          {
            certificationName: 'ISO 9001',
            startDay: 0,
            durationDays: 180,
            marketCode: 'global',
            cost: 7500
          }
        ],
        totalEstimatedCost: { min: 5000, max: 10000, currency: 'USD' },
        totalEstimatedTimelineInDays: 180,
        confidenceScore: 0.9
      },
      
      resourceNeeds: {
        resourceNeeds: [
          {
            type: 'financial',
            name: 'Certification Budget',
            description: 'Budget for certification process',
            estimatedCost: { min: 5000, max: 10000, currency: 'USD' },
            priority: 'high',
            timeline: '6 months',
            confidenceScore: 0.9
          }
        ],
        budgetAllocationRecommendation: {
          certifications: 30,
          marketing: 40,
          logistics: 20,
          other: 10
        },
        productionCapacityAnalysis: {
          currentCapacity: 1000,
          requiredCapacity: 1500,
          capacityGap: 500,
          recommendations: ['Increase production capacity']
        },
        supplyChainConsiderations: ['Establish reliable logistics partners'],
        confidenceScore: 0.85
      },
      
      actionPlan: {
        actionItems: [
          {
            id: 'action1',
            name: 'Begin certification process',
            description: 'Start ISO 9001 certification',
            priority: 'high',
            timeline: { startDay: 0, durationDays: 30 },
            dependsOn: [],
            resources: ['Certification Budget'],
            estimatedCost: { amount: 2000, currency: 'USD' },
            marketCodes: ['global'],
            confidenceScore: 0.9
          }
        ],
        implementationTimeline: [
          {
            phase: 'Preparation',
            startDay: 0,
            durationDays: 90,
            items: ['Begin certification process']
          }
        ],
        riskAssessment: [
          {
            name: 'Certification delays',
            probability: 'medium',
            impact: 'high',
            mitigationStrategy: 'Start early and allocate sufficient resources',
            confidenceScore: 0.8
          }
        ],
        confidenceScore: 0.85
      },
      
      generatedAt: new Date(),
      exportReadinessScore: 75,
      overallConfidenceScore: 0.85
    };
  }
} 