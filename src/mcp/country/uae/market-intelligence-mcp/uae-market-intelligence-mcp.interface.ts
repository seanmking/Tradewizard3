import { 
  MarketInsight, 
  MarketIntelligenceRequest 
} from '../../../global/market-intelligence-mcp/market-intelligence-mcp.interface';

export interface UaeMarketStatistic {
  category: string;
  value: number;
  unit: string;
  source: string;
  year: number;
}

export interface UaeRegulation {
  id: string;
  title: string;
  description: string;
  url: string;
  effectiveDate: string;
  applicableEmirates: string[];
}

export interface UaeMarketInsight extends MarketInsight {
  uaeSpecificStatistics: UaeMarketStatistic[];
  uaeRegulations: UaeRegulation[];
  gccTrade: {
    intraGccTrade: boolean;
    gccTariffExemptions: boolean;
    gccMarketAccess: string;
  };
  freeZones: {
    relevantFreeZones: string[];
    benefits: string[];
    requirements: string[];
  };
}

export interface UaeMarketIntelligenceRequest extends MarketIntelligenceRequest {
  includeFreeZoneAnalysis?: boolean;
  includeRegulations?: boolean;
  emiratesOfInterest?: string[];
}

export interface UaeMarketIntelligenceMCP {
  getUaeMarketInsights(request: UaeMarketIntelligenceRequest): Promise<Record<string, UaeMarketInsight>>;
} 