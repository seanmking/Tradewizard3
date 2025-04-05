import axios from 'axios';
import { logger } from '../../utils/logger';
import { WITSCacheService } from './witsCache';
import { HSCode, ClassificationResult } from '../../types/classification.types';
import { TariffRequest, TariffResponse } from '@/types/tariff';
import { ApiKeyManager } from '@/utils/api-key-manager';

interface WITSApiError {
  response?: {
    status: number;
    data?: any;
  };
  message?: string;
}

export class WITSError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'WITSError';
  }
}

/**
 * Service for interacting with the WITS API to get trade data
 */
export class WITSService {
  private apiUrl: string;
  private apiKey: string;
  private readonly cache: WITSCacheService;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    // Get API keys from centralized manager
    const apiKeyManager = ApiKeyManager.getInstance();
    this.apiUrl = apiKeyManager.getApiUrl('wits') || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest';
    this.apiKey = apiKeyManager.getKeyValue('wits') || '';
    
    if (!this.apiKey) {
      console.warn('WITS API key not configured in WITSService');
    }

    this.cache = WITSCacheService.getInstance();
  }

  // Fetch HS code details with retries and caching
  async getHSCodeDetails(code: string): Promise<HSCode> {
    try {
      // Try cache first
      const cached = await this.cache.getCachedHSCode(code);
      if (cached) {
        logger.debug(`Using cached data for HS code ${code}`);
        return this.mapCacheToHSCode(cached);
      }

      // If no cache or expired, try WITS API
      if (!this.apiKey) {
        throw new WITSError(
          'WITS API key not configured',
          'NO_API_KEY',
          undefined,
          false
        );
      }

      const data = await this.retryableRequest(
        `/TARIFF/H6/${code}?format=json&subscription-key=${this.apiKey}`
      );

      // Update cache with new data
      await this.cache.forceUpdate([code]);

      return this.mapWITSResponseToHSCode(data);
    } catch (error) {
      if (error instanceof WITSError) {
        throw error;
      }

      // For other errors, try to get stale cache data as fallback
      const staleCache = await this.cache.getCachedHSCode(code);
      if (staleCache) {
        logger.warn(`Using stale cache for HS code ${code} due to API error`);
        return this.mapCacheToHSCode(staleCache);
      }

      const apiError = error as WITSApiError;
      throw new WITSError(
        `Failed to fetch HS code ${code} details`,
        'API_ERROR',
        apiError.response?.status,
        true
      );
    }
  }

  // Fetch tariff data with retries and caching
  async getTariffData(hsCode: string, importerCode: string, exporterCode: string): Promise<any> {
    try {
      // Format parameters for WITS API
      const formattedHsCode = hsCode.replace(/\./g, '');
      const formattedImporter = importerCode.toUpperCase();
      const formattedExporter = exporterCode.toUpperCase();

      if (!this.apiKey) {
        throw new WITSError(
          'WITS API key not configured',
          'NO_API_KEY',
          undefined,
          false
        );
      }

      const endpoint = `/TARIFF/TRAINS/A.${formattedImporter}.${formattedExporter}.${formattedHsCode}`;
      const data = await this.retryableRequest(
        `${endpoint}?format=json&subscription-key=${this.apiKey}`
      );

      return this.parseTariffData(data);
    } catch (error) {
      if (error instanceof WITSError) {
        throw error;
      }

      const apiError = error as WITSApiError;
      throw new WITSError(
        `Failed to fetch tariff data for ${hsCode}`,
        'API_ERROR',
        apiError.response?.status,
        true
      );
    }
  }

  // Helper method for retryable requests
  private async retryableRequest(endpoint: string, retryCount = 0): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}${endpoint}`);
      return response.data;
    } catch (error) {
      const apiError = error as WITSApiError;
      
      // Don't retry on certain status codes
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        throw new WITSError(
          'Authentication failed',
          'AUTH_ERROR',
          apiError.response.status,
          false
        );
      }

      if (apiError.response?.status === 404) {
        throw new WITSError(
          'Resource not found',
          'NOT_FOUND',
          404,
          false
        );
      }

      // Retry on 5xx errors or network issues
      if (retryCount < this.maxRetries && 
          (apiError.response?.status?.toString().startsWith('5') || !apiError.response)) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount)));
        return this.retryableRequest(endpoint, retryCount + 1);
      }

      throw error;
    }
  }

  private mapCacheToHSCode(cached: any): HSCode {
    return {
      code: cached.hsCode,
      description: cached.description,
      level: this.determineHSCodeLevel(cached.hsCode),
      examples: [],
      searchTerms: []
    };
  }

  private mapWITSResponseToHSCode(data: any): HSCode {
    try {
      // WITS API response structure example:
      // {
      //   header: { id: "H6", name: "Harmonized System 2017" },
      //   data: {
      //     code: "840734",
      //     description: "Spark-ignition reciprocating piston engines",
      //     notes: ["Some restrictions may apply"],
      //     metadata: { chapter: "84", section: "XVI" }
      //   }
      // }

      const hsData = data.data;
      if (!hsData || !hsData.code || !hsData.description) {
        throw new WITSError(
          'Invalid WITS API response format',
          'INVALID_RESPONSE',
          undefined,
          false
        );
      }

      // Create a descriptive ariaLabel
      const ariaLabel = `HS Code ${hsData.code}: ${hsData.description}`;

      return {
        code: hsData.code,
        description: hsData.description,
        level: this.determineHSCodeLevel(hsData.code),
        examples: hsData.examples || [],
        searchTerms: this.generateSearchTerms(hsData),
        parentCode: this.getParentCode(hsData.code),
        ariaLabel
      };
    } catch (error) {
      logger.error('Failed to map WITS response to HSCode:', error);
      throw new WITSError(
        'Failed to process HS code data',
        'MAPPING_ERROR',
        undefined,
        false
      );
    }
  }

  private parseTariffData(data: any): {
    rate: number;
    effectiveDate: string;
    expiryDate?: string;
    restrictions?: string[];
    quotas?: {
      amount: number;
      unit: string;
      period: string;
    }[];
  } {
    try {
      // WITS API tariff response structure example:
      // {
      //   header: { reporter: "USA", partner: "CHN", year: "2023" },
      //   rates: [{
      //     value: 2.5,
      //     effectiveDate: "2023-01-01",
      //     expiryDate: "2023-12-31",
      //     type: "MFN"
      //   }],
      //   restrictions: ["License required"],
      //   quotas: [{ amount: 1000, unit: "KG", period: "2023" }]
      // }

      if (!data || !data.rates || !data.rates.length) {
        throw new WITSError(
          'Invalid tariff data format',
          'INVALID_TARIFF_DATA',
          undefined,
          false
        );
      }

      // Get the most recent applicable rate
      const currentRate = data.rates
        .sort((a: any, b: any) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
        .find((rate: any) => 
          new Date(rate.effectiveDate) <= new Date() && 
          (!rate.expiryDate || new Date(rate.expiryDate) > new Date())
        );

      if (!currentRate) {
        throw new WITSError(
          'No current applicable tariff rate found',
          'NO_CURRENT_RATE',
          undefined,
          false
        );
      }

      return {
        rate: Number(currentRate.value),
        effectiveDate: currentRate.effectiveDate,
        expiryDate: currentRate.expiryDate,
        restrictions: data.restrictions || [],
        quotas: data.quotas?.map((q: any) => ({
          amount: Number(q.amount),
          unit: q.unit,
          period: q.period
        })) || []
      };
    } catch (error) {
      logger.error('Failed to parse tariff data:', error);
      throw new WITSError(
        'Failed to process tariff data',
        'PARSING_ERROR',
        undefined,
        false
      );
    }
  }

  private generateSearchTerms(hsData: any): string[] {
    const terms = new Set<string>();
    
    // Add the description words
    terms.add(hsData.description.toLowerCase());
    
    // Add any examples
    if (hsData.examples) {
      hsData.examples.forEach((example: string) => 
        terms.add(example.toLowerCase())
      );
    }
    
    // Add any alternative names
    if (hsData.alternativeNames) {
      hsData.alternativeNames.forEach((name: string) => 
        terms.add(name.toLowerCase())
      );
    }
    
    return Array.from(terms);
  }

  private getParentCode(code: string): string {
    const digits = code.replace(/\D/g, '');
    if (digits.length <= 2) return '';
    if (digits.length <= 4) return digits.slice(0, 2);
    return digits.slice(0, 4);
  }

  private determineHSCodeLevel(code: string): 'chapter' | 'heading' | 'subheading' {
    const digits = code.replace(/\D/g, '').length;
    if (digits <= 2) return 'chapter';
    if (digits <= 4) return 'heading';
    return 'subheading';
  }
} 