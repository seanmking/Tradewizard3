import { 
  HSCodeTariffMCP, 
  HSCodeLookupRequest, 
  HSCodeSearchResult,
  HSCodeTariffInfo,
  HSCodeResult,
  TariffRate
} from './hscode-tariff-mcp.interface';
import axios from 'axios';
// Replace logger with console for browser compatibility
// import { logger } from '../../../utils/logger';
import { CacheService } from '@/utils/cache.service';
import { ApiKeyManager } from '@/utils/api-key-manager';
import { createApiClient } from '@/utils/api-client';

// Define interfaces for API responses
interface WITSProductSearchResponse {
  products: Array<{
    productCode: string;
    productName: string;
    relevance?: number;
  }>;
}

interface WITSTariffResponse {
  data: {
    dataSets: any[];
    structure: {
      descriptions: Array<{description: string}>;
      dimensions: {
        section?: string;
        chapter?: string;
      };
    };
  };
}

interface WITSTariffRateResponse {
  data: {
    dataSets: any[];
    observation: Array<{value: number}>;
  };
}

/**
 * Service for HS Code tariff information
 * Implements HSCodeTariffMCP interface
 */
export class HSCodeTariffMCPService implements HSCodeTariffMCP {
  private apiUrl: string;
  private apiKey: string;
  private apiKeyManager: ApiKeyManager;
  private cache: CacheService;
  private useMockData: boolean;

  constructor() {
    // Get API keys from centralized manager
    this.apiKeyManager = ApiKeyManager.getInstance();
    this.apiUrl = this.apiKeyManager.getApiUrl('wits') || 'https://wits.worldbank.org/API/V1/SDMX/V21/rest';
    this.apiKey = this.apiKeyManager.getKeyWithFallback('wits', '');
    this.cache = new CacheService('hs-code-tariff');
    
    // Check if we should use mock data
    this.useMockData = !this.apiKeyManager.hasKey('wits');
    
    if (!this.apiKeyManager.hasKey('wits')) {
      console.warn('WITS API Key not configured - using mock data');
    }
  }
  
  /**
   * Search for HS codes based on a search request
   * @param request Search request
   * @returns Promise with search result
   */
  public async searchHSCodes(request: HSCodeLookupRequest): Promise<HSCodeSearchResult[]> {
    // Generate cache key based on request
    const cacheKey = `search:${JSON.stringify(request)}`;
    
    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check if we can use the real API
    if (this.useMockData) {
      return this.getMockHsCodeSearchResults(request);
    }
    
    try {
      // Using WITS API for HS code search
      // Note: This is a placeholder until we understand the exact WITS API endpoint for HS code search
      const url = `${this.apiUrl}/reference/product?format=json&subscription-key=${this.apiKey}`;
      const response = await axios.get<WITSProductSearchResponse>(url, {
        params: {
          query: request.searchQuery,
          category: request.category || '',
          exact: request.exactMatch || false
        }
      });
      
      if (!response.data || !response.data.products) {
        throw new Error(`No search results found for query: ${request.searchQuery}`);
      }
      
      const results = response.data.products.map((product: {productCode: string; productName: string; relevance?: number}) => ({
        code: product.productCode,
        description: product.productName,
        matchConfidence: product.relevance || 1.0
      }));
      
      // Cache the results
      this.cache.set(cacheKey, results);
      
      return results;
      
    } catch (error) {
      console.error('Error searching HS Codes:', error);
      // Fall back to mock data
      return this.getMockHsCodeSearchResults(request);
    }
  }
  
  /**
   * Get information about an HS code
   * @param request HS code info request
   * @returns HS code information
   */
  public async getHsCodeInfo(productDescription: string): Promise<HSCodeResult> {
    // Generate a descriptive cache key
    const cacheKey = `hsinfo:${productDescription}`;
    
    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check if we can use the real API
    if (this.useMockData) {
      return this.getMockHsCodeInfo(productDescription);
    }
    
    try {
      // First search for HS codes based on the description
      const searchRequest: HSCodeLookupRequest = {
        searchQuery: productDescription,
      };
      
      const searchResults = await this.searchHSCodes(searchRequest);
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error(`No HS codes found matching description: ${productDescription}`);
      }
      
      // Now get tariff info for each found HS code (limit to top 3 matches)
      const topMatches = searchResults.slice(0, 3);
      const classifications: HSCodeTariffInfo[] = [];
      
      for (const match of topMatches) {
        const tariffInfo = await this.getTariffByHsCode(match.code);
        classifications.push(...tariffInfo);
      }
      
      const result: HSCodeResult = {
        classifications,
        query: productDescription,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('Error getting HS Code info:', error);
      // Fall back to mock data
      return this.getMockHsCodeInfo(productDescription);
    }
  }
  
  /**
   * Get tariff information for a specific HS code
   * @param request Tariff request with HS code
   * @returns Tariff information
   */
  public async getTariffByHsCode(hsCode: string): Promise<HSCodeTariffInfo[]> {
    // Format the HS code for the API (ensure it's properly formatted with dots)
    const formattedHsCode = hsCode.replace(/\./g, '');
    
    // Generate cache key
    const cacheKey = `tariff:${formattedHsCode}`;
    
    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // If explicitly configured to use mock data, use it
    if (this.useMockData) {
      console.log(`Using mock data as configured for HS code: ${hsCode}`);
      return this.getMockTariffData(hsCode);
    }
    
    try {
      // For global implementations, we only consider 6-digit codes (international standard)
      const sixDigitCode = formattedHsCode.substring(0, 6);
      
      // Use our proxy API instead of direct WITS API call
      const proxyUrl = '/api/wits-proxy';
      const response = await axios.get<WITSTariffResponse>(proxyUrl, {
        params: {
          endpoint: 'nomenclature/search',
          query: sixDigitCode,
          limit: 1,
          format: 'json'
        }
      });
      
      // Check if we have valid data
      if (!response.data || !response.data.data) {
        throw new Error(`Invalid response from WITS API for HS code ${hsCode}`);
      }
      
      // Create tariff object from the response
      const tariffInfo: HSCodeTariffInfo = {
        hsCode: hsCode,
        description: this.extractDescription(response.data),
        section: this.extractSection(response.data),
        chapter: this.extractChapter(response.data),
        isRestrictedGood: this.determineIfRestricted(response.data),
        notes: this.extractNotes(response.data),
        relatedCodes: this.extractRelatedCodes(response.data)
      };
      
      const result = [tariffInfo];
      
      // Cache the results
      this.cache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('Error getting tariff data:', error);
      // Throw the error to allow UI to handle it
      throw new Error(`Failed to fetch tariff data for HS code ${hsCode}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getTariffRates(hsCode: string, importingCountry: string, exportingCountry?: string): Promise<TariffRate[]> {
    try {
      // Create cache key
      const cacheKey = `tariff-${hsCode}-${importingCountry}-${exportingCountry || 'all'}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Format parameters for WITS API
      const formattedHsCode = hsCode.replace(/\./g, '');
      const formattedImporter = importingCountry.toUpperCase();
      const formattedExporter = exportingCountry ? exportingCountry.toUpperCase() : 'ALL';
      
      // Use our proxy API instead of direct WITS API call
      const proxyUrl = '/api/wits-proxy';
      const response = await axios.get<WITSTariffRateResponse>(proxyUrl, {
        params: {
          endpoint: 'tariffs/trains',
          frequency: 'A',
          reporter: formattedImporter,
          partner: formattedExporter,
          hsCode: formattedHsCode,
          format: 'json'
        }
      });
      
      // Validate the WITS API response
      if (!response.data || !response.data.data || !response.data.data.dataSets) {
        throw new Error(`No tariff data found from WITS API for HS code ${hsCode} and countries ${importingCountry}, ${exportingCountry || 'all'}`);
      }
      
      // Extract tariff rates from WITS response
      const tariffRates = this.parseWITSTariffRates(response.data, importingCountry);
      
      // Cache the results
      this.cache.set(cacheKey, tariffRates);
      
      return tariffRates;
      
    } catch (error) {
      console.error(`Error getting tariff rates for HS code ${hsCode} and countries ${importingCountry}, ${exportingCountry || 'all'}: ${error}`);
      throw new Error(`Failed to get tariff rates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper methods to properly parse WITS API responses
  private extractDescription(data: WITSTariffResponse): string {
    try {
      return data.data.structure.descriptions[0].description || 'No description available';
    } catch (error) {
      console.error('Error extracting description from WITS API response:', error);
      return 'No description available';
    }
  }

  private extractSection(data: WITSTariffResponse): string {
    try {
      return data.data.structure.dimensions.section || 'Section not available';
    } catch (error) {
      console.error('Error extracting section from WITS API response:', error);
      return 'Section not available';
    }
  }

  private extractChapter(data: WITSTariffResponse): string {
    try {
      return data.data.structure.dimensions.chapter || 'Chapter not available';
    } catch (error) {
      console.error('Error extracting chapter from WITS API response:', error);
      return 'Chapter not available';
    }
  }

  private determineIfRestricted(data: WITSTariffResponse): boolean {
    try {
      // Implement logic to determine if a good is restricted based on WITS API response
      // This would depend on specific indicators in the WITS data
      return false;
    } catch (error) {
      console.error('Error determining restriction status from WITS API response:', error);
      return false;
    }
  }

  private extractNotes(data: WITSTariffResponse): string[] {
    try {
      // Implement logic to extract notes from WITS API response
      return [];
    } catch (error) {
      console.error('Error extracting notes from WITS API response:', error);
      return [];
    }
  }

  private extractRelatedCodes(data: WITSTariffResponse): string[] {
    try {
      // Implement logic to extract related codes from WITS API response
      return [];
    } catch (error) {
      console.error('Error extracting related codes from WITS API response:', error);
      return [];
    }
  }

  private parseWITSTariffRates(data: WITSTariffRateResponse, importingCountry: string): TariffRate[] {
    try {
      // Implement proper parsing of tariff rates from WITS API response
      // This is a placeholder that should be implemented with actual WITS API response structure
      const tariffRates: TariffRate[] = [];
      
      // Extract observation data from response
      if (data.data && data.data.observation) {
        const observation = data.data.observation;
        const currentYear = new Date().getFullYear();
        
        // Sample transformation of WITS data to our interface format
        const rate: TariffRate = {
          country: importingCountry,
          rate: observation[0].value || 0,
          unit: '%',
          year: currentYear,
          category: 'MFN' // Default to Most-Favored Nation
        };
        
        tariffRates.push(rate);
      }
      
      if (tariffRates.length === 0) {
        throw new Error('Could not extract tariff rates from WITS API response');
      }
      
      return tariffRates;
    } catch (error) {
      console.error('Error parsing tariff rates from WITS API response:', error);
      throw new Error(`Failed to parse tariff rates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Mock implementation for HS code search
   */
  private getMockHsCodeSearchResults(request: HSCodeLookupRequest): HSCodeSearchResult[] {
    // Implementation for mock HS code search results
    return [
      {
        code: '8471.30',
        description: 'Portable automatic data processing machines, weighing not more than 10 kg, consisting of at least a central processing unit, a keyboard and a display',
        matchConfidence: 0.85
      },
      {
        code: '8471.41',
        description: 'Other automatic data processing machines comprising in the same housing at least a central processing unit and an input and output unit',
        matchConfidence: 0.75
      }
    ];
  }
  
  /**
   * Mock implementation for HS code info
   */
  private getMockHsCodeInfo(description: string): HSCodeResult {
    // Implementation for mock HS code info
    return {
      classifications: [],
      query: description,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Mock implementation for tariff data
   */
  private getMockTariffData(hsCode: string): HSCodeTariffInfo[] {
    // Implementation for mock tariff data
    console.log(`Using mock tariff data for HS code: ${hsCode}`);
    
    // Provide more useful mock data based on the HS code
    let description = 'Mock tariff description';
    let section = 'Section not available';
    let chapter = 'Chapter not available';
    
    // Add some intelligence to the mock data based on HS code
    const firstTwoDigits = hsCode.replace(/\./g, '').substring(0, 2);
    
    // HS codes with common categories
    switch(firstTwoDigits) {
      case '01':
        description = 'Live animals';
        section = 'Section I: Live Animals; Animal Products';
        chapter = 'Chapter 1: Live animals';
        break;
      case '08':
        description = 'Edible fruit and nuts; peel of citrus fruit or melons';
        section = 'Section II: Vegetable Products';
        chapter = 'Chapter 8: Edible fruit and nuts';
        break;
      case '84':
        description = 'Machinery and mechanical appliances; parts thereof';
        section = 'Section XVI: Machinery and Mechanical Appliances';
        chapter = 'Chapter 84: Nuclear reactors, boilers, machinery';
        break;
      case '85':
        description = 'Electrical machinery and equipment and parts thereof';
        section = 'Section XVI: Machinery and Mechanical Appliances';
        chapter = 'Chapter 85: Electrical machinery and equipment';
        break;
      default:
        description = `Mock product for HS code ${hsCode}`;
        break;
    }
    
    return [
      {
        hsCode,
        description,
        section,
        chapter,
        isRestrictedGood: false,
        notes: ['Note: This is mock data as WITS API is currently unavailable'],
        relatedCodes: []
      }
    ];
  }
} 