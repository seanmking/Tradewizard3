import axios from 'axios';
import { logger } from '../../utils/logger';
import { HSCode } from '../../types/classification.types';
import { CircuitBreaker, CircuitBreakerState } from './circuitBreaker';
import { RateLimiter } from './rateLimiter';
import { UsageMetrics } from './usageMetrics';
import { ApiKeyManager } from '@/utils/api-key-manager';
import { createApiClient } from '@/utils/api-client';

interface WITSApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

export interface WITSError extends Error {
  status?: number;
  response?: {
    status: number;
    data: any;
  };
  config?: {
    url?: string;
    method?: string;
  };
}

interface WITSProduct {
  hsCode: string;
  description: string;
  confidence: number;
  examples?: string[];
}

interface WITSChapter {
  code: string;
  description: string;
  examples?: string[];
}

interface WITSHeading extends WITSChapter {}
interface WITSSubheading extends WITSChapter {}

export class WITSApiService {
  private readonly config: WITSApiConfig;
  private readonly client;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimiter: RateLimiter;
  private readonly metrics: UsageMetrics;
  private readonly apiKeyManager: ApiKeyManager;

  constructor(config?: Partial<WITSApiConfig>) {
    this.apiKeyManager = ApiKeyManager.getInstance();
    
    this.config = {
      baseUrl: process.env.WITS_API_URL || 'https://wits.worldbank.org/API/V1/WITS',
      timeout: 10000,
      ...config
    };

    // Get API key from centralized manager
    const apiKey = this.apiKeyManager.getKeyValue('wits') || '';
    
    if (!apiKey) {
      logger.warn('WITS API key not configured - API calls will fail');
    }

    // Create API client with proper authentication
    this.client = createApiClient({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      keyType: 'wits',
      retries: 3
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 0.5,
      resetTimeout: 30000,
      onStateChange: (state: CircuitBreakerState) => {
        logger.info(`Circuit breaker state changed to: ${state}`);
      }
    });

    this.rateLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      apiKey: apiKey || ''
    });

    this.metrics = new UsageMetrics();

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: unknown) => this.handleApiError(error)
    );

    // Start periodic cleanup of rate limiter
    setInterval(() => this.rateLimiter.cleanup(), this.config.timeout);
    
    logger.info('WITSApiService initialized successfully');
  }

  /**
   * Track API call metrics
   */
  private async trackApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let errorType: string | undefined;

    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      errorType = this.getErrorType(error);
      throw error;
    } finally {
      const endTime = Date.now();
      this.metrics.recordCall({
        timestamp: startTime,
        endpoint,
        responseTime: endTime - startTime,
        success,
        errorType,
        apiKey: this.config.apiKey
      });
    }
  }

  private getErrorType(error: unknown): string {
    if (this.isWITSError(error)) {
      const status = error.response?.status;
      if (!status) return 'API_ERROR';
      if (status === 429) return 'RATE_LIMIT';
      if (status === 401 || status === 403) return 'AUTH';
      if (status === 404) return 'NOT_FOUND';
      if (status >= 500) return 'SERVER_ERROR';
      return 'API_ERROR';
    }
    return 'UNKNOWN';
  }

  /**
   * Get usage metrics for analysis
   */
  public getUsageMetrics(startTime?: number, endTime?: number) {
    return this.metrics.getMetrics(this.config.apiKey, startTime, endTime);
  }

  /**
   * Get rate limit recommendations based on usage patterns
   */
  public getRateLimitRecommendations() {
    return this.metrics.getRateLimitRecommendations(this.config.apiKey);
  }

  /**
   * Get usage patterns for analysis
   */
  public getUsagePatterns(days = 7) {
    return this.metrics.getUsagePattern(this.config.apiKey, days);
  }

  /**
   * Check rate limit before making API call
   */
  private async checkRateLimit(): Promise<void> {
    const allowed = await this.rateLimiter.checkAndRecord();
    if (!allowed) {
      const metrics = this.rateLimiter.getMetrics();
      throw new Error(`Rate limit exceeded. Reset in ${Math.ceil((metrics.resetTime - Date.now()) / 1000)} seconds`);
    }
  }

  /**
   * Fetch HS code details from WITS API
   */
  public async getHSCodeDetails(code: string): Promise<HSCode> {
    await this.checkRateLimit();
    return this.trackApiCall(`/classification/${code}`, () =>
      this.circuitBreaker.execute(async () => {
        const response = await this.client.get(`/classification/${code}`);
        return this.mapResponseToHSCode(response.data);
      })
    );
  }

  /**
   * Fetch tariff data for specific HS code and countries
   */
  public async getTariffData(hsCode: string, importerCode: string, exporterCode: string): Promise<any> {
    await this.checkRateLimit();
    return this.trackApiCall('/tariff', () =>
      this.circuitBreaker.execute(async () => {
        const response = await this.client.get('/tariff', {
          params: { hsCode, importerCode, exporterCode }
        });
        return response.data;
      })
    );
  }

  /**
   * Verify if an HS code is still valid
   */
  public async verifyHSCode(code: string): Promise<boolean> {
    await this.checkRateLimit();
    return this.trackApiCall(`/classification/${code}`, () =>
      this.circuitBreaker.execute(async () => {
        try {
          await this.client.head(`/classification/${code}`);
          return true;
        } catch (error) {
          if (this.isWITSError(error) && error.response?.status === 404) {
            return false;
          }
          throw error;
        }
      })
    );
  }

  /**
   * Batch fetch multiple HS codes
   */
  public async batchGetHSCodes(codes: string[]): Promise<Map<string, HSCode>> {
    await this.checkRateLimit();
    return this.trackApiCall('/classification/batch', () =>
      this.circuitBreaker.execute(async () => {
        const response = await this.client.post('/classification/batch', { codes });
        const results = new Map<string, HSCode>();
        
        const data = response.data as Record<string, any>;
        for (const [code, hsData] of Object.entries(data)) {
          results.set(code, this.mapResponseToHSCode(hsData));
        }
        
        return results;
      })
    );
  }

  /**
   * Get current rate limit metrics
   */
  public getRateLimitMetrics() {
    return this.rateLimiter.getMetrics();
  }

  private mapResponseToHSCode(data: any): HSCode {
    return {
      code: data.code,
      level: this.determineLevel(data.code),
      description: data.description,
      parentCode: this.getParentCode(data.code),
      examples: data.examples || [],
      searchTerms: data.searchTerms || []
    };
  }

  private determineLevel(code: string): 'chapter' | 'heading' | 'subheading' {
    const digits = code.replace(/\D/g, '').length;
    if (digits <= 2) return 'chapter';
    if (digits <= 4) return 'heading';
    return 'subheading';
  }

  private getParentCode(code: string): string | undefined {
    const digits = code.replace(/\D/g, '');
    if (digits.length <= 2) return undefined;
    if (digits.length <= 4) return digits.slice(0, 2);
    return digits.slice(0, 4);
  }

  private isWITSError(error: unknown): error is WITSError {
    return error instanceof Error && 'response' in error;
  }

  private async handleApiError(error: unknown): Promise<never> {
    if (this.isWITSError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      // Log detailed error information
      logger.error('WITS API Error:', {
        status,
        data,
        url: error.config?.url,
        method: error.config?.method
      });

      // Handle specific error cases
      if (status === 429) {
        throw new Error('WITS API rate limit exceeded');
      }
      if (status === 401 || status === 403) {
        throw new Error('WITS API authentication failed');
      }
      if (status === 404) {
        throw new Error('WITS API resource not found');
      }
    }

    // Re-throw the error for the circuit breaker to handle
    throw error;
  }

  /**
   * Classify a product description using WITS API
   */
  async classifyProduct(description: string): Promise<WITSProduct> {
    try {
      const response = await this.client.post('/classify', { description });
      return this.transformClassificationResponse(response.data);
    } catch (error) {
      logger.error('WITS API classification error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get chapter information by code
   */
  async getChapterInfo(code: string): Promise<WITSChapter> {
    try {
      const response = await this.client.get(`/chapter/${code}`);
      return this.transformChapterResponse(response.data);
    } catch (error) {
      logger.error(`WITS API chapter info error for code ${code}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get heading information by code
   */
  async getHeadingInfo(code: string): Promise<WITSHeading> {
    try {
      const response = await this.client.get(`/heading/${code}`);
      return this.transformHeadingResponse(response.data);
    } catch (error) {
      logger.error(`WITS API heading info error for code ${code}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get subheading information by code
   */
  async getSubheadingInfo(code: string): Promise<WITSSubheading> {
    try {
      const response = await this.client.get(`/subheading/${code}`);
      return this.transformSubheadingResponse(response.data);
    } catch (error) {
      logger.error(`WITS API subheading info error for code ${code}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get similar products for a given description
   */
  async getSimilarProducts(description: string): Promise<WITSProduct[]> {
    try {
      const response = await this.client.post('/similar', { description });
      return this.transformSimilarProductsResponse(response.data);
    } catch (error) {
      logger.error('WITS API similar products error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Transform raw classification response to WITSProduct
   */
  private transformClassificationResponse(data: any): WITSProduct {
    return {
      hsCode: data.hsCode,
      description: data.description,
      confidence: data.confidence || 0,
      examples: data.examples || []
    };
  }

  /**
   * Transform raw chapter response to WITSChapter
   */
  private transformChapterResponse(data: any): WITSChapter {
    return {
      code: data.code,
      description: data.description,
      examples: data.examples || []
    };
  }

  /**
   * Transform raw heading response to WITSHeading
   */
  private transformHeadingResponse(data: any): WITSHeading {
    return {
      code: data.code,
      description: data.description,
      examples: data.examples || []
    };
  }

  /**
   * Transform raw subheading response to WITSSubheading
   */
  private transformSubheadingResponse(data: any): WITSSubheading {
    return {
      code: data.code,
      description: data.description,
      examples: data.examples || []
    };
  }

  /**
   * Transform raw similar products response to WITSProduct array
   */
  private transformSimilarProductsResponse(data: any): WITSProduct[] {
    return (data.products || []).map((product: any) => ({
      hsCode: product.hsCode,
      description: product.description,
      confidence: product.confidence || 0,
      examples: product.examples || []
    }));
  }
} 