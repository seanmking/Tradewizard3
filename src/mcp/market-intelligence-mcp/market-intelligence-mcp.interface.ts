import { BusinessProfile } from '../../types/business-profile.types';

export interface MarketSize {
  value: number;
  currency: string;
  year: number;
  growthRate?: number;
}

export interface Competitor {
  name: string;
  marketShare?: number;
  country?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface TariffInfo {
  rate: number;
  type: string;
  conditions?: string;
}

export interface MarketInsight {
  marketSize: MarketSize;
  topCompetitors: Competitor[];
  entryBarriers: string[];
  tariffs: Record<string, TariffInfo>;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}

export interface MarketIntelligenceRequest {
  productCategories: string[];
  targetMarkets: string[];
  businessProfile: BusinessProfile;
}

export interface MarketIntelligenceMCP {
  getMarketInsights(request: MarketIntelligenceRequest): Promise<Record<string, MarketInsight>>;
} 