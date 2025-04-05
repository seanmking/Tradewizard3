// Replace logger with console.log
// import { logger } from '../../utils/logger';
import { HSCodeTariffMCPService } from '../../mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.service';
import { HSCodeTariffInfo, HSCodeSearchResult } from '../../mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.interface';
import { ProductCategory } from './categoryBasedConsolidation.service';
import { CacheService } from '../cache-service';
import { safeSetImmediate } from '../../utils/logger';

/**
 * Represents an HS Code node in the hierarchy
 */
interface HSCodeNode {
  code: string;
  description: string;
  level: 'chapter' | 'heading' | 'subheading';
  parent?: string;
  children?: string[];
  notes?: string[];
  examples?: string[];
  confidence?: number;
}

/**
 * Represents a level in the HS Code hierarchy
 */
type HSCodeLevel = 'chapter' | 'heading' | 'subheading';

/**
 * Detailed HS Code information with confidence score
 */
export interface HSCodeSuggestion {
  code: string;
  description: string;
  level: HSCodeLevel;
  confidence: number;
  notes?: string[];
  examples?: string[];
  children?: HSCodeSuggestion[];
}

/**
 * Request for HS code suggestions
 */
export interface HSCodeRequest {
  productCategory: string;
  productName?: string;
  productDescription?: string;
  attributes?: Record<string, any>;
  countryCode?: string;
}

/**
 * Configuration for the HS Code Hierarchy Service
 */
export interface HSCodeHierarchyConfig {
  confidenceThreshold: number;
  useCaching: boolean;
  cacheExpiryMinutes: number;
  maxConcurrentRequests: number;
  maxSuggestions: number;
}

/**
 * Enhanced service for HS code hierarchy navigation and suggestion
 * Following the MCP architecture pattern: global MCP → country-specific MCP
 */
export class HSCodeHierarchyService {
  private readonly defaultConfig: HSCodeHierarchyConfig = {
    confidenceThreshold: 0.6,
    useCaching: true,
    cacheExpiryMinutes: 43200, // 30 days
    maxConcurrentRequests: 5,
    maxSuggestions: 5
  };

  // Track service status
  private mcpServiceStatus = {
    operational: false,
    lastCheckTime: 0,
    failedAttempts: 0,
    lastError: ''
  };
  
  // Cache keys for commonly accessed data
  private readonly CACHE_KEYS = {
    SERVICE_STATUS: 'hscode-service-status',
    HIERARCHY_BASE: 'hscode-hierarchy-base',
    HS_DETAILS_PREFIX: 'hscode-details-'
  };

  private config: HSCodeHierarchyConfig;
  private hsCodeMap: Map<string, HSCodeNode> = new Map();
  private categoryToHSCodeMap: Map<string, string[]> = new Map();
  private cacheKeyPrefix = 'hscode-hierarchy:';
  
  private hsCodeService: HSCodeTariffMCPService;
  private cache: CacheService<HSCodeNode[]>;

  /**
   * Constructor that initializes the HS Code Hierarchy Service
   * 
   * @param hsCodeService The HS Code Tariff MCP Service to use
   * @param cacheService The cache service to use
   * @param config Configuration options
   */
  constructor(
    hsCodeService: HSCodeTariffMCPService,
    cacheService: CacheService<any>,
    config?: Partial<HSCodeHierarchyConfig>
  ) {
    this.hsCodeService = hsCodeService;
    this.cache = cacheService;
    this.config = {
      ...this.defaultConfig,
      ...config
    };
    
    // Initial service status check
    this.checkServiceStatus();
  }

  /**
   * Check if the WITS API service is operational
   */
  private async checkServiceStatus(): Promise<boolean> {
    try {
      // Use a common HS code to check if the service is responding correctly
      const testHsCode = '0101'; // Live horses
      await this.hsCodeService.getTariffByHsCode(testHsCode);
      
      this.mcpServiceStatus = {
        operational: true,
        lastCheckTime: Date.now(),
        failedAttempts: 0,
        lastError: ''
      };
      
      return true;
    } catch (error) {
      this.mcpServiceStatus = {
        operational: false,
        lastCheckTime: Date.now(),
        failedAttempts: this.mcpServiceStatus.failedAttempts + 1,
        lastError: error instanceof Error ? error.message : String(error)
      };
      
      console.error(`WITS API service check failed: ${this.mcpServiceStatus.lastError}`);
      return false;
    }
  }

  /**
   * Get HS Code chapters (2-digit codes)
   * 
   * @throws Error if the WITS API service is not operational
   */
  async getHSCodeChapters(): Promise<HSCodeNode[]> {
    const cacheKey = `${this.cacheKeyPrefix}chapters`;
    
    // Check cache first
    const cachedChapters = this.cache.get(cacheKey);
    if (cachedChapters) {
      return cachedChapters;
    }
    
    try {
      // This would be implemented to call the WITS API to get all chapters
      // For now, we'll throw an error to indicate this needs implementation
      throw new Error('WITS API direct chapter lookup not yet implemented');
    } catch (error) {
      console.error(`Failed to get HS code chapters: ${error}`);
      throw new Error(`Failed to retrieve HS code chapters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get HS Code headings for a specific chapter
   * 
   * @param chapterCode The 2-digit chapter code
   * @throws Error if the WITS API service is not operational
   */
  async getHSCodeHeadings(chapterCode: string): Promise<HSCodeNode[]> {
    if (!chapterCode || chapterCode.length !== 2) {
      throw new Error('Invalid chapter code. Must be a 2-digit code.');
    }
    
    const cacheKey = `${this.cacheKeyPrefix}headings-${chapterCode}`;
    
    // Check cache first
    const cachedHeadings = this.cache.get(cacheKey);
    if (cachedHeadings) {
      return cachedHeadings;
    }
    
    try {
      // This would be implemented to call the WITS API to get headings for a chapter
      // For now, we'll throw an error to indicate this needs implementation
      throw new Error(`WITS API direct heading lookup for chapter ${chapterCode} not yet implemented`);
    } catch (error) {
      console.error(`Failed to get HS code headings for chapter ${chapterCode}: ${error}`);
      throw new Error(`Failed to retrieve HS code headings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get HS Code subheadings for a specific heading
   * 
   * @param headingCode The 4-digit heading code
   * @throws Error if the WITS API service is not operational
   */
  async getHSCodeSubheadings(headingCode: string): Promise<HSCodeNode[]> {
    if (!headingCode || headingCode.length !== 4) {
      throw new Error('Invalid heading code. Must be a 4-digit code.');
    }
    
    const cacheKey = `${this.cacheKeyPrefix}subheadings-${headingCode}`;
    
    // Check cache first
    const cachedSubheadings = this.cache.get(cacheKey);
    if (cachedSubheadings) {
      return cachedSubheadings;
    }
    
    try {
      // This would be implemented to call the WITS API to get subheadings for a heading
      // For now, we'll throw an error to indicate this needs implementation
      throw new Error(`WITS API direct subheading lookup for heading ${headingCode} not yet implemented`);
    } catch (error) {
      console.error(`Failed to get HS code subheadings for heading ${headingCode}: ${error}`);
      throw new Error(`Failed to retrieve HS code subheadings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get detailed information about a specific HS Code
   * 
   * @param hsCode The HS code to get details for
   * @throws Error if the WITS API service is not operational
   */
  async getHSCodeDetails(hsCode: string): Promise<HSCodeSuggestion | null> {
    if (!hsCode) {
      throw new Error('HS Code is required');
    }
    
    const cacheKey = `${this.cacheKeyPrefix}${this.CACHE_KEYS.HS_DETAILS_PREFIX}${hsCode}`;
    
    // Check cache first
    const cachedDetails = this.cache.get(cacheKey);
    if (cachedDetails && cachedDetails.length > 0) {
      return this.transformNodeToSuggestion(cachedDetails[0]);
    }
    
    try {
      // Call the WITS API through the MCP service
      const tariffInfo = await this.hsCodeService.getTariffByHsCode(hsCode);
      
      if (!tariffInfo || tariffInfo.length === 0) {
        return null;
      }
      
      // Transform the tariff info into an HSCodeNode
      const node: HSCodeNode = {
        code: tariffInfo[0].hsCode,
        description: tariffInfo[0].description,
        level: this.determineLevel(tariffInfo[0].hsCode),
        notes: tariffInfo[0].notes,
        parent: this.getParentCode(tariffInfo[0].hsCode)
      };
      
      // Cache the result
      this.cache.set(cacheKey, [node]);
      
      return this.transformNodeToSuggestion(node);
    } catch (error) {
      console.error(`Failed to get HS code details for ${hsCode}: ${error}`);
      throw new Error(`Failed to retrieve HS code details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get HS code suggestions based on product description
   * 
   * @param request The request with product details
   * @throws Error if the WITS API service is not operational
   */
  async getHSCodeSuggestions(request: HSCodeRequest): Promise<HSCodeSuggestion[]> {
    if (!request.productName && !request.productDescription) {
      throw new Error('Product name or description is required');
    }
    
    const searchQuery = request.productName || request.productDescription || '';
    const cacheKey = `${this.cacheKeyPrefix}suggestions-${searchQuery}-${request.productCategory || ''}`;
    
    // Check cache first
    const cachedSuggestions = this.cache.get(cacheKey);
    if (cachedSuggestions) {
      return cachedSuggestions.map(node => this.transformNodeToSuggestion(node));
    }
    
    try {
      // Call the WITS API through the MCP service
      const searchResults = await this.hsCodeService.searchHSCodes({
        searchQuery,
        category: request.productCategory
      });
      
      if (!searchResults || searchResults.length === 0) {
        return [];
      }
      
      // Transform the search results into HSCodeNodes
      const nodes: HSCodeNode[] = await Promise.all(
        searchResults
          .slice(0, this.config.maxSuggestions)
          .map(async result => {
            const details = await this.hsCodeService.getTariffByHsCode(result.code);
            
            return {
              code: result.code,
              description: result.description,
              level: this.determineLevel(result.code),
              confidence: result.matchConfidence,
              notes: details && details.length > 0 ? details[0].notes : [],
              parent: this.getParentCode(result.code)
            };
          })
      );
      
      // Cache the results
      this.cache.set(cacheKey, nodes);
      
      return nodes.map(node => this.transformNodeToSuggestion(node));
    } catch (error) {
      console.error(`Failed to get HS code suggestions for ${searchQuery}: ${error}`);
      throw new Error(`Failed to retrieve HS code suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Determine the level of an HS code based on its length
   */
  private determineLevel(hsCode: string): HSCodeLevel {
    const code = hsCode.replace(/\./g, '');
    
    if (code.length <= 2) {
      return 'chapter';
    } else if (code.length <= 4) {
      return 'heading';
    } else {
      return 'subheading';
    }
  }
  
  /**
   * Get the parent code of an HS code
   */
  private getParentCode(hsCode: string): string | undefined {
    const code = hsCode.replace(/\./g, '');
    
    if (code.length <= 2) {
      return undefined;
    } else if (code.length <= 4) {
      return code.substring(0, 2);
    } else {
      return code.substring(0, 4);
    }
  }
  
  /**
   * Transform an HSCodeNode to an HSCodeSuggestion
   */
  private transformNodeToSuggestion(node: HSCodeNode): HSCodeSuggestion {
    return {
      code: node.code,
      description: node.description,
      level: node.level,
      confidence: node.confidence || 1.0,
      notes: node.notes,
      examples: node.examples
    };
  }
} 