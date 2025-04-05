import {
  BusinessProfile,
  Product,
  ProductionCapacity,
  MarketInfo,
  Certification,
  Budget,
  TargetMarket
} from '@/contexts/assessment-context';
import { MarketInsight } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.interface';
import { ComplianceRequirement } from '@/mcp/compliance-mcp/compliance-mcp.interface';

// Market Overview Section
export interface MarketOverviewSection {
  marketCode: string;
  marketName: string;
  marketSize: number;
  marketCurrency: string;
  growthRate: number;
  keyCompetitors: Array<{
    name: string;
    marketShare: number;
  }>;
  entryBarriers: string[];
  opportunities: string[];
  risks: string[];
  productSpecificInsights: string[];
  confidenceScore?: number;
}

// Certification Roadmap Section
export interface CertificationRequirement {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedTimelineInDays: number;
  marketCode: string;
  marketName: string;
  regulatoryBody: string;
  referenceUrl: string;
  confidenceScore?: number;
}

export interface CertificationRoadmapSection {
  requirements: CertificationRequirement[];
  timelineVisualizationData: {
    certificationName: string;
    startDay: number;
    durationDays: number;
    marketCode: string;
    cost: number;
  }[];
  totalEstimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  totalEstimatedTimelineInDays: number;
  confidenceScore?: number;
}

// Resource Needs Section
export interface ResourceNeed {
  type: 'financial' | 'human' | 'infrastructure' | 'knowledge';
  name: string;
  description: string;
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  alternativeOptions?: string[];
  confidenceScore?: number;
}

export interface ResourceNeedsSection {
  resourceNeeds: ResourceNeed[];
  budgetAllocationRecommendation: {
    certifications: number;
    marketing: number;
    logistics: number;
    other: number;
  };
  productionCapacityAnalysis: {
    currentCapacity: number;
    requiredCapacity: number;
    capacityGap: number;
    recommendations: string[];
  };
  supplyChainConsiderations: string[];
  confidenceScore?: number;
}

// Action Plan Section
export interface ActionItem {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: {
    startDay: number;
    durationDays: number;
  };
  dependsOn: string[];
  resources: string[];
  estimatedCost?: {
    amount: number;
    currency: string;
  };
  marketCodes: string[];
  confidenceScore?: number;
}

export interface RiskFactor {
  name: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigationStrategy: string;
  confidenceScore?: number;
}

export interface ActionPlanSection {
  actionItems: ActionItem[];
  implementationTimeline: {
    phase: string;
    startDay: number;
    durationDays: number;
    items: string[];
  }[];
  riskAssessment: RiskFactor[];
  confidenceScore?: number;
}

// Complete Report Data
export interface ReportData {
  businessProfile: BusinessProfile;
  selectedProducts: Product[];
  productionCapacity: ProductionCapacity;
  marketInfo: MarketInfo;
  certifications: Certification[];
  budget: Budget;
  
  // Report Sections
  marketOverview: MarketOverviewSection[];
  certificationRoadmap: CertificationRoadmapSection;
  resourceNeeds: ResourceNeedsSection;
  actionPlan: ActionPlanSection;
  
  // Metadata
  generatedAt: Date;
  exportReadinessScore: number;
  overallConfidenceScore?: number;
  
  // Raw Data for verification
  rawComplianceData?: ComplianceRequirement[];
  rawMarketData?: Record<string, MarketInsight>;
}

// Report Generation Configuration
export interface ReportGenerationConfig {
  includeConfidenceScores: boolean;
  prioritizeMarkets: string[];
  focusOnCertification: boolean;
  costOptimization: boolean;
  timelineOptimization: boolean;
  includeRawData: boolean;
}

// Report Format
export enum ReportFormat {
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json'
} 