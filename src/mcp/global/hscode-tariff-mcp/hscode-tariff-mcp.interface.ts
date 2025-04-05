export interface HSCodeLookupRequest {
  searchQuery: string;
  category?: string;
  exactMatch?: boolean;
}

export interface HSCodeTariffInfo {
  hsCode: string;
  description: string;
  section?: string;
  chapter?: string;
  isRestrictedGood?: boolean;
  notes?: string[];
  relatedCodes?: string[];
}

export interface HSCodeSearchResult {
  code: string;
  description: string;
  matchConfidence: number;
}

export interface HSCodeResult {
  classifications: HSCodeTariffInfo[];
  query: string;
  timestamp: string;
}

export interface TariffRate {
  country: string;
  rate: number;
  unit: string;
  year: number;
  category?: string;
  specialProvisions?: string[];
  quotas?: {
    amount: number;
    unit: string;
    rate: number;
  }[];
}

export interface HSCodeTariffMCP {
  searchHSCodes(request: HSCodeLookupRequest): Promise<HSCodeSearchResult[]>;
  getHsCodeInfo(productDescription: string): Promise<HSCodeResult>;
  getTariffRates(hsCode: string, importingCountry: string, exportingCountry?: string): Promise<TariffRate[]>;
  getTariffByHsCode(hsCode: string): Promise<HSCodeTariffInfo[]>;
} 