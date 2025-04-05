import { HsClassificationResult } from '@/mcp/global/hs-code-mcp/hs-code-mcp.interface';
import { UkHsCodeResult } from '@/mcp/country/uk/hs-tariff-mcp/uk-hs-tariff-mcp.interface';
import { UkMarketInsightsResult } from '@/mcp/country/uk/market-mcp/uk-market-mcp.interface';
import { UkComplianceResult } from '@/mcp/country/uk/compliance-mcp/uk-compliance-mcp.interface';
import { UaeHsCodeResult } from '@/mcp/country/uae/hs-tariff-mcp/uae-hs-tariff-mcp.interface';

export type AssessmentPhase = 
  | 'not-started'
  | 'global-assessment'
  | 'global-assessment-complete'
  | 'country-assessment'
  | 'country-assessment-complete'
  | 'report-generation'
  | 'report-complete';

export type TargetMarket = 'uk' | 'uae';

export interface AssessmentError {
  phase: string;
  message: string;
  timestamp: string;
}

export interface UkAssessmentData {
  hsCodeResult?: UkHsCodeResult;
  marketInsights?: UkMarketInsightsResult;
  complianceRequirements?: UkComplianceResult;
}

export interface UaeAssessmentData {
  hsCodeResult?: UaeHsCodeResult;
  // Add more UAE-specific data types as they are implemented
}

export interface CountrySpecificData {
  uk?: UkAssessmentData;
  uae?: UaeAssessmentData;
}

export interface AssessmentData {
  id: string;
  productDescription: string;
  targetMarket: TargetMarket;
  exporterCountry: string;
  currentPhase: AssessmentPhase;
  
  // Results from different phases
  globalClassification?: HsClassificationResult;
  countrySpecificData?: CountrySpecificData;
  report?: any; // This would be a complex structure with final report data
  
  // Metadata
  createdAt: string;
  lastUpdated: string;
  assessmentComplete: boolean;
  errors?: AssessmentError[];
} 