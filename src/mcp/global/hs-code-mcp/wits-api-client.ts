import axios from 'axios';
import { CacheService } from '@/utils/cache.service';
import { ApiKeyManager } from '@/utils/api-key-manager';
import { Cache } from '@/utils/cache';
import { 
  ClassificationMatch, 
  ProductExample,
  HSChapter,
  HSHeading,
  HSSubheading
} from './hs-code.types';

// Type definitions for Axios
interface AxiosConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  method?: string;
  url?: string;
}

interface AxiosInstance {
  create(config: AxiosConfig): AxiosInstance;
  interceptors: {
    request: AxiosInterceptor;
    response: AxiosInterceptor;
  };
  get(url: string, config?: AxiosConfig): Promise<any>;
  (config: AxiosConfig): Promise<any>;
}

interface AxiosInterceptor {
  use(
    onFulfilled: (value: any) => any | Promise<any>,
    onRejected?: (error: any) => any
  ): number;
}

interface AxiosResponse {
  data: any;
  status: number;
  config: AxiosConfig;
}

// Types
interface HSChapter {
  code: string;
  name: string;
  description: string;
}

interface HSHeading {
  code: string;
  name: string;
  description: string;
  chapterCode: string;
}

interface HSSubheading {
  code: string;
  name: string;
  description: string;
  headingCode: string;
}

interface ClassificationMatch {
  id: string;
  code: string;
  description: string;
  confidence: number;
  path: string[];
}

interface ProductExample {
  id: string;
  description: string;
  hsCode: string;
}

interface TariffResult {
  countryCode: string;
  countryName: string;
  hsCode: string;
  rate: number | null;
  unit: string;
  year: number;
  source: string;
  notes: string;
}

/**
 * Enhanced WITS API Client for HS Code classification
 * Provides integration with the World Integrated Trade Solution API
 * with proper authentication, rate limiting, and error handling
 */
export class WITSAPIClient {
  private apiClient: any;
  private cache: Cache<string, any>;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private requestCounter: number;
  private lastRequestTimestamp: number;
  private readonly requestLimit: number;
  private readonly requestWindowMs: number;
  private cacheService: CacheService;
  
  constructor() {
    // Get API keys from centralized manager
    const apiKeyManager = ApiKeyManager.getInstance();
    
    // Change to use local API proxy to avoid CORS issues
    this.baseUrl = '/api/wits-proxy';
    this.apiKey = apiKeyManager.getKeyValue('wits') || 'demo-api-key';
    this.cacheService = new CacheService('wits-api');
    
    if (!this.apiKey || this.apiKey === 'demo-api-key') {
      console.warn('WITS API key not properly configured in WITSApiClient - using demo key');
    }
    
    // Initialize configuration from environment variables with fallbacks
    this.maxRetries = Number(process.env.WITS_API_MAX_RETRIES) || 3;
    this.requestLimit = Number(process.env.WITS_API_REQUEST_LIMIT) || 100; // Requests per window
    this.requestWindowMs = Number(process.env.WITS_API_REQUEST_WINDOW_MS) || 60000; // 1 minute window
    
    // Initialize request tracking
    this.requestCounter = 0;
    this.lastRequestTimestamp = Date.now();
    
    // Initialize Axios client - API key is now handled by the proxy
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradeWizard/3.0'
      }
    });
    
    // Initialize cache - 24 hour TTL
    this.cache = new Cache<string, any>({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 1000
    });
    
    // Add request interceptor for rate limiting and logging
    this.apiClient.interceptors.request.use(
      async (config: any) => {
        // Implement client-side rate limiting
        await this.enforceRateLimit();
        
        // Log request
        console.log(`WITS API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for error handling and retries
    this.apiClient.interceptors.response.use(
      (response: any) => {
        console.log(`WITS API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: any) => {
        const config = error.config;
        if (!config) {
          return Promise.reject(error);
        }
        
        // Initialize retry count if not present
        const retryCount = config.headers?.['x-retry-count'] 
          ? Number(config.headers['x-retry-count']) 
          : 0;
        
        // Determine if we should retry based on error type
        const shouldRetry = 
          retryCount < this.maxRetries &&
          (
            // Network errors
            !error.response ||
            // Rate limiting (429)
            error.response?.status === 429 ||
            // Service unavailable (503)
            error.response?.status === 503 ||
            // Gateway errors (502, 504)
            error.response?.status === 502 ||
            error.response?.status === 504 ||
            // Timeout
            error.code === 'ECONNABORTED'
          );
        
        if (shouldRetry) {
          // Increment retry count
          const nextRetryCount = retryCount + 1;
          config.headers = {
            ...config.headers,
            'x-retry-count': String(nextRetryCount)
          };
          
          // Exponential backoff with jitter
          const delay = Math.min(
            1000 * Math.pow(2, nextRetryCount) + Math.random() * 1000,
            30000 // Max 30 seconds
          );
          
          console.log(`Retrying WITS API request (${nextRetryCount}/${this.maxRetries}) after ${delay}ms`);
          
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.apiClient(config);
        }
        
        // Log error details for debugging
        if (error.response) {
          console.error(`WITS API Error (${error.response.status}):`, 
            error.response.data || 'No response data');
        } else if (error.request) {
          console.error('WITS API Error (No Response):', error.message);
        } else {
          console.error('WITS API Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Enforce rate limiting based on configured limits
   * Prevents sending too many requests in a short time period
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    
    // Reset counter if outside window
    if (elapsed > this.requestWindowMs) {
      this.requestCounter = 0;
      this.lastRequestTimestamp = now;
    }
    
    // Check if we've reached the limit
    if (this.requestCounter >= this.requestLimit) {
      // Calculate time to wait before next request
      const timeToWait = this.requestWindowMs - elapsed;
      
      if (timeToWait > 0) {
        console.log(`Rate limit reached, waiting ${timeToWait}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, timeToWait));
        
        // Reset after waiting
        this.requestCounter = 0;
        this.lastRequestTimestamp = Date.now();
      }
    }
    
    // Increment counter
    this.requestCounter++;
  }
  
  /**
   * Make a request to the WITS API with proper formatting for our proxy
   * This centralizes the common request pattern used across multiple methods
   */
  private async makeRequest<T>(endpoint: string, hsCode?: string, format: string = 'json'): Promise<T> {
    try {
      const params: any = { endpoint };
      if (hsCode) params.hsCode = hsCode;
      params.format = format;
      
      const response = await this.apiClient.get('', { params });
      return response.data;
    } catch (error) {
      // Re-throw the error after logging
      throw error;
    }
  }
  
  /**
   * Search for HS codes by query
   * @param query Text to search for in HS code database
   * @returns Array of classification matches with confidence scores
   */
  async searchHSCodes(query: string): Promise<ClassificationMatch[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    try {
      // Check cache first
      const cacheKey = `wits:search:${query.toLowerCase().trim()}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Make API request using our proxy
      const params = {
        endpoint: 'nomenclature/search',
        query: query,
        limit: 10,
        includeMetadata: true
      };
      
      const response = await this.apiClient.get('', { params });
      
      if (!response.data || !response.data.results) {
        return [];
      }
      
      // Transform the API response to our internal format
      const matches: ClassificationMatch[] = response.data.results.map((result: any) => ({
        id: result.code,
        code: result.code,
        description: result.description,
        confidence: result.score || 0,
        path: result.path || []
      }));
      
      // Cache the results
      this.cache.set(cacheKey, matches);
      
      return matches;
    } catch (error) {
      console.error('Failed to search HS codes:', error);
      return [];
    }
  }
  
  /**
   * Get product examples for a specific HS code
   * @param hsCode HS code to get examples for
   * @returns Array of product examples
   */
  async getProductExamples(hsCode: string): Promise<ProductExample[]> {
    if (!hsCode) {
      return [];
    }
    
    try {
      // Check cache
      const cacheKey = `wits:examples:${hsCode}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Make API request using our proxy
      const params = {
        endpoint: 'nomenclature/examples',
        hsCode: hsCode
      };
      
      const response = await this.apiClient.get('', { params });
      
      if (!response.data || !response.data.examples) {
        return [];
      }
      
      // Transform the API response
      const examples: ProductExample[] = response.data.examples.map((example: any) => ({
        id: example.id || `${hsCode}-${Math.random().toString(36).substring(2)}`,
        description: example.description,
        hsCode: hsCode
      }));
      
      // Cache the results
      this.cache.set(cacheKey, examples);
      
      return examples;
    } catch (error) {
      console.error(`Failed to get product examples for HS code ${hsCode}:`, error);
      return [];
    }
  }
  
  /**
   * Get all chapters (2-digit codes)
   */
  async getChapters(): Promise<HSChapter[]> {
    try {
      // Check cache
      const cacheKey = 'wits:chapters';
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Make API request using our proxy
      const params = {
        endpoint: 'nomenclature/chapters'
      };
      
      const response = await this.apiClient.get('', { params });
      
      if (!response.data || !response.data.chapters) {
        return [];
      }
      
      // Transform the response
      const chapters: HSChapter[] = response.data.chapters.map((chapter: any) => ({
        code: chapter.code,
        name: chapter.name || '',
        description: chapter.description || ''
      }));
      
      // Cache the results
      this.cache.set(cacheKey, chapters);
      
      return chapters;
    } catch (error) {
      console.error('Failed to get chapters:', error);
      return [];
    }
  }
  
  /**
   * Get headings (4-digit codes) for a specific chapter
   */
  async getHeadings(chapterCode: string): Promise<HSHeading[]> {
    try {
      // Check cache
      const cacheKey = `wits:headings:${chapterCode}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Make API request using our proxy
      const params = {
        endpoint: 'nomenclature/headings',
        chapterCode
      };
      
      const response = await this.apiClient.get('', { params });
      
      if (!response.data || !response.data.headings) {
        return [];
      }
      
      // Transform the response
      const headings: HSHeading[] = response.data.headings.map((heading: any) => ({
        code: heading.code,
        name: heading.name || '',
        description: heading.description || '',
        chapterCode: chapterCode
      }));
      
      // Cache the results
      this.cache.set(cacheKey, headings);
      
      return headings;
    } catch (error) {
      console.error(`Failed to get headings for chapter ${chapterCode}:`, error);
      return [];
    }
  }
  
  /**
   * Get subheadings (6-digit codes) for a specific heading
   */
  async getSubheadings(headingCode: string): Promise<HSSubheading[]> {
    try {
      // Check cache
      const cacheKey = `wits:subheadings:${headingCode}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Make API request using our proxy
      const params = {
        endpoint: 'nomenclature/subheadings',
        headingCode
      };
      
      const response = await this.apiClient.get('', { params });
      
      if (!response.data || !response.data.subheadings) {
        return [];
      }
      
      // Transform the response
      const subheadings: HSSubheading[] = response.data.subheadings.map((subheading: any) => ({
        code: subheading.code,
        name: subheading.name || '',
        description: subheading.description || '',
        headingCode: headingCode
      }));
      
      // Cache the results
      this.cache.set(cacheKey, subheadings);
      
      return subheadings;
    } catch (error) {
      console.error(`Failed to get subheadings for heading ${headingCode}:`, error);
      return [];
    }
  }
  
  /**
   * Clear cache entries matching a pattern
   * @param pattern Optional pattern to match cache keys
   */
  clearCache(pattern?: string): void {
    // Implementation depends on the cache system used
    // This is a simplified example
    if (pattern) {
      console.log(`Clearing cache entries matching: ${pattern}`);
      // In a real implementation, we would iterate through cache keys
      // and delete ones matching the pattern
    } else {
      console.log('Clearing entire WITS API cache');
      this.cache.clear();
    }
  }
  
  /**
   * Calculate initial confidence score based on the API result and query
   * @param item API result item
   * @param query Search query
   * @returns Confidence score (0-100)
   */
  private calculateInitialConfidence(item: any, query: string): number {
    // Convert to lowercase for comparison
    const normalizedQuery = query.toLowerCase();
    const normalizedDescription = (item.description || '').toLowerCase();
    const normalizedName = (item.name || '').toLowerCase();
    
    // Higher confidence if exact match
    if (
      normalizedDescription.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedDescription) ||
      normalizedName.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedName)
    ) {
      return 90;
    }
    
    // Medium confidence if partial match
    const queryWords = normalizedQuery.split(/\s+/);
    const descriptionWords = normalizedDescription.split(/\s+/);
    const nameWords = normalizedName.split(/\s+/);
    
    // Count matching words
    const matchingWords = queryWords.filter(word => 
      descriptionWords.includes(word) || nameWords.includes(word)
    ).length;
    
    // Calculate match percentage
    const matchPercentage = (matchingWords / queryWords.length) * 100;
    
    // Base confidence on match percentage
    if (matchPercentage > 80) {
      return 85;
    } else if (matchPercentage > 50) {
      return 75;
    } else if (matchPercentage > 30) {
      return 65;
    } else {
      // Default confidence for limited matches
      return 60;
    }
  }
  
  // Fallback methods to provide basic data when API fails
  
  /**
   * Get fallback product examples for common HS codes
   * @param hsCode HS code
   * @returns Array of product examples
   */
  private getFallbackExamples(hsCode: string): ProductExample[] {
    // Standardize HS code format
    const code = hsCode.replace(/\./g, '');
    
    // Lookup table for common HS codes
    const fallbackMap: Record<string, ProductExample[]> = {
      // Electronics
      '851712': [
        { name: 'Smartphone', description: 'Mobile phone with computing capabilities', hsCode: '851712' },
        { name: 'iPhone', description: 'Apple smartphone with touchscreen interface', hsCode: '851712' },
        { name: 'Android Phone', description: 'Smartphone running Android operating system', hsCode: '851712' }
      ],
      '847130': [
        { name: 'Laptop', description: 'Portable computer with integrated screen', hsCode: '847130' },
        { name: 'Notebook', description: 'Thin and light portable computer', hsCode: '847130' },
        { name: 'MacBook', description: 'Apple laptop computer', hsCode: '847130' }
      ],
      // Apparel
      '610910': [
        { name: 'Cotton T-shirt', description: 'Casual shirt made of cotton', hsCode: '610910' },
        { name: 'Polo shirt', description: 'Knitted cotton shirt with collar', hsCode: '610910' }
      ],
      // Food
      '090111': [
        { name: 'Coffee beans', description: 'Unroasted coffee beans', hsCode: '090111' },
        { name: 'Arabica beans', description: 'Premium coffee variety', hsCode: '090111' }
      ],
    };
    
    // Return specific examples if available
    if (fallbackMap[code]) {
      return fallbackMap[code];
    }
    
    // Try to match by prefix (first 4 digits)
    const prefix = code.substring(0, 4);
    for (const [hsCode, examples] of Object.entries(fallbackMap)) {
      if (hsCode.startsWith(prefix)) {
        return examples;
      }
    }
    
    // Default empty array
    return [];
  }
  
  /**
   * Get fallback HS chapters when API fails
   * @returns Array of common HS chapters
   */
  private getFallbackChapters(): HSChapter[] {
    return [
      { code: '84', name: 'Machinery', description: 'Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof' },
      { code: '85', name: 'Electrical machinery', description: 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers, television recorders and reproducers, parts and accessories' },
      { code: '87', name: 'Vehicles', description: 'Vehicles other than railway or tramway rolling stock, and parts and accessories thereof' },
      { code: '61', name: 'Apparel (knitted)', description: 'Articles of apparel and clothing accessories, knitted or crocheted' },
      { code: '62', name: 'Apparel (not knitted)', description: 'Articles of apparel and clothing accessories, not knitted or crocheted' },
      { code: '39', name: 'Plastics', description: 'Plastics and articles thereof' },
      { code: '90', name: 'Optical instruments', description: 'Optical, photographic, cinematographic, measuring, checking, precision, medical or surgical instruments and apparatus; parts and accessories thereof' },
      { code: '94', name: 'Furniture', description: 'Furniture; bedding, mattresses, mattress supports, cushions and similar stuffed furnishings; lamps and lighting fittings, not elsewhere specified; illuminated signs, illuminated nameplates and the like; prefabricated buildings' }
    ];
  }
  
  /**
   * Get fallback HS headings for a chapter when API fails
   * @param chapterCode Chapter code
   * @returns Array of common HS headings for the chapter
   */
  private getFallbackHeadings(chapterCode: string): HSHeading[] {
    // First 2 digits only
    const chapter = chapterCode.substring(0, 2);
    
    // Fallback headings for common chapters
    const fallbackMap: Record<string, HSHeading[]> = {
      '84': [
        { code: '8471', name: 'Computers', description: 'Automatic data processing machines and units thereof' },
        { code: '8473', name: 'Computer parts', description: 'Parts and accessories for machines of headings 8469 to 8472' }
      ],
      '85': [
        { code: '8517', name: 'Telephones', description: 'Telephone sets, including smartphones and other telephones for cellular networks' },
        { code: '8528', name: 'Monitors and projectors', description: 'Monitors and projectors, not incorporating television reception apparatus' }
      ],
      '61': [
        { code: '6109', name: 'T-shirts', description: 'T-shirts, singlets and other vests, knitted or crocheted' },
        { code: '6110', name: 'Sweaters', description: 'Sweaters, pullovers, sweatshirts, waistcoats and similar articles, knitted or crocheted' }
      ]
    };
    
    // Return headings for the chapter or empty array
    return fallbackMap[chapter] || [];
  }
  
  /**
   * Get fallback HS subheadings for a heading when API fails
   * @param headingCode Heading code
   * @returns Array of common HS subheadings for the heading
   */
  private getFallbackSubheadings(headingCode: string): HSSubheading[] {
    // First 4 digits only
    const heading = headingCode.substring(0, 4);
    
    // Fallback subheadings for common headings
    const fallbackMap: Record<string, HSSubheading[]> = {
      '8471': [
        { code: '847130', name: 'Laptops', description: 'Portable automatic data processing machines, weighing not more than 10 kg, consisting of at least a central processing unit, a keyboard and a display' },
        { code: '847150', name: 'Processing units', description: 'Processing units other than those of subheading 8471.41 or 8471.49, whether or not containing in the same housing one or two of the following types of unit: storage units, input units, output units' }
      ],
      '8517': [
        { code: '851712', name: 'Smartphones', description: 'Telephones for cellular networks or for other wireless networks' },
        { code: '851761', name: 'Base stations', description: 'Base stations for communication apparatus' }
      ],
      '6109': [
        { code: '610910', name: 'Cotton t-shirts', description: 'T-shirts, singlets and other vests, of cotton, knitted or crocheted' },
        { code: '610990', name: 'Other t-shirts', description: 'T-shirts, singlets and other vests, of other textile materials, knitted or crocheted' }
      ]
    };
    
    // Return subheadings for the heading or empty array
    return fallbackMap[heading] || [];
  }

  /**
   * Get tariff rates for a specific HS code and country
   */
  async getTariffRates(hsCode: string, countryCodes: string[]): Promise<TariffResult[]> {
    if (!hsCode || !countryCodes || countryCodes.length === 0) {
      return [];
    }
    
    try {
      // Generate a cache key
      const cacheKey = `wits:tariffs:${hsCode}:${countryCodes.sort().join(',')}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Make API request using our proxy
      const params = {
        endpoint: 'tariffs/query',
        hsCode,
        countries: countryCodes.join(',')
      };
      
      const response = await this.apiClient.get('', { params });
      
      if (!response.data || !response.data.results) {
        return [];
      }
      
      // Transform the response
      const tariffRates: TariffResult[] = response.data.results.map((result: any) => ({
        countryCode: result.countryCode,
        countryName: result.countryName || '',
        hsCode: hsCode,
        rate: result.rate !== undefined ? parseFloat(result.rate) : null,
        unit: result.unit || '%',
        year: result.year || new Date().getFullYear(),
        source: result.source || 'WITS',
        notes: result.notes || ''
      }));
      
      // Cache the results
      this.cache.set(cacheKey, tariffRates);
      
      return tariffRates;
    } catch (error) {
      console.error(`Failed to get tariff rates for HS code ${hsCode} and countries ${countryCodes.join(',')}:`, error);
      return [];
    }
  }
} 