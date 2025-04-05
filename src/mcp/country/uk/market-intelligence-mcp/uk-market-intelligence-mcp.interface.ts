import { 
  MarketInsight, 
  MarketIntelligenceRequest 
} from '../../../global/market-intelligence-mcp/market-intelligence-mcp.interface';

export interface UkMarketStatistic {
  category: string;
  value: number;
  unit: string;
  source: string;
  year: number;
}

export interface UkRegulation {
  id: string;
  title: string;
  description: string;
  url: string;
  effectiveDate: string;
}

export interface UkMarketInsight extends MarketInsight {
  ukSpecificStatistics: UkMarketStatistic[];
  ukRegulations: UkRegulation[];
  brexitImpact: {
    description: string;
    tariffChanges: boolean;
    regulatoryChanges: boolean;
    supplyChainImpact: string;
  };
}

export interface UkMarketIntelligenceRequest extends MarketIntelligenceRequest {
  includeBrexitAnalysis?: boolean;
  includeRegulations?: boolean;
}

export interface UkMarketIntelligenceMCP {
  getUkMarketInsights(request: UkMarketIntelligenceRequest): Promise<Record<string, UkMarketInsight>>;
} 