/**
 * LLM-Website Extractor
 * 
 * This class implements an LLM-first approach to extracting business information
 * and products from websites. It sends the entire HTML content to an LLM with
 * specific prompts designed to extract only legitimate business information
 * while ignoring navigation and UI elements.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';
// import { logger } from '@/utils/logger';
import { 
  ExtractionResult, 
  ExtractedEntity, 
  EntityType 
} from '@/types/extraction';
import { AIModelConfig } from '@/types/config';
import { validateAndCorrectApiEndpoint } from '@/utils/api-endpoint-manager';
// Import the new utilities
import { ApiKeyManager } from '@/utils/api-key-manager';
import { createApiClient } from '@/utils/api-client';
import { BaseWebsiteExtractor } from './base-website-extractor';
// No need to import WebsiteData, WebsiteMetadata as they're not used in this file

// Add the OpenAI SDK import near the top of the file
import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createOpenAIClient, validateOpenAIConfig } from '@/utils/openai-client';
// Remove the imported WebsiteContent and define it locally
interface WebsiteContent {
  title: string;
  description: string;
  specifications: Record<string, string>;
  error: string | null;
}

interface LLMWebsiteExtractorConfig {
  // AI model configuration
  aiModel: {
    apiKey: string;
    url: string;
    model: string;
    maxTokens: number;
  },
  // Perplexity AI configuration for validation
  perplexityAI?: {
    apiKey: string;
    url: string;
    model?: string;
  },
  // MCP configuration
  mcpConfig?: {
    complianceMcpUrl: string;
    marketIntelligenceMcpUrl: string;
    enableCrossReferencing: boolean;
  }
}

// Product data as extracted by the LLM
interface ExtractedProduct {
  name: string;
  description?: string;
  price?: string;
  category?: string;
  productType?: string;
  keywords?: string[];
  potentialHSCode?: string;
  specifications?: Record<string, any>;
  confidence: number;
  url?: string;
  needsMCPEnrichment?: boolean;
  mcpEnrichmentNotes?: string;
}

// Contact data as extracted by the LLM
interface ExtractedContact {
  type: string;
  value: string;
  platform?: string;
  confidence: number;
}

// MCP enrichment flags from LLM extraction
interface MCPEnrichmentFlags {
  needsComplianceData: boolean;
  needsMarketIntelligence: boolean;
  priorityProducts: number[];
}

interface ComplianceMCPResponse {
  hsCode: string;
  requiredDocuments: string[];
  tariffRates: Record<string, string>;
  notes: string;
  confidence: number;
}

interface MarketIntelligenceMCPResponse {
  marketSize: string;
  marketGrowth: string;
  competitors: Array<{
    name: string;
    marketShare: string;
    strengths: string[];
  }>;
  category: string;
  trends: string[];
  confidence: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class LLMWebsiteExtractor extends BaseWebsiteExtractor {
  // Change from private to protected to match parent class
  protected browser: Browser | null = null;
  private config: LLMWebsiteExtractorConfig;
  private apiUrl: string = '';
  private apiKey: string = '';
  private model: string = '';
  private openaiClient: OpenAI | null = null;
  private aiModelName: string;
  
  /**
   * Initialize the LLM-first website extractor
   */
  constructor(config?: Partial<LLMWebsiteExtractorConfig>) {
    super(); // Call the parent constructor first
    
    const apiKeyManager = ApiKeyManager.getInstance();
    
    // Get API keys from centralized manager
    this.apiKey = apiKeyManager.getKeyValue('openai') || '';
    this.apiUrl = apiKeyManager.getApiUrl('openai') || 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    // Default configuration
    this.config = {
      aiModel: {
        apiKey: this.apiKey,
        url: this.apiUrl,
        model: this.model,
        maxTokens: parseInt(process.env.AI_MODEL_MAX_TOKENS || '4000')
      },
      perplexityAI: {
        apiKey: apiKeyManager.getKeyValue('perplexity') || '',
        url: apiKeyManager.getApiUrl('perplexity') || '',
        model: process.env.PERPLEXITY_MODEL || 'sonar-medium-online'
      },
      mcpConfig: {
        complianceMcpUrl: process.env.COMPLIANCE_MCP_URL || 'http://localhost:3001/api/compliance',
        marketIntelligenceMcpUrl: process.env.MARKET_INTELLIGENCE_MCP_URL || 'http://localhost:3002/api/market-intelligence',
        enableCrossReferencing: process.env.ENABLE_CROSS_REFERENCING === 'true'
      },
      ...config
    };
    
    console.info(`LLM-Website Extractor initialized with API keys - OpenAI: ${!!this.apiKey}, Perplexity: ${!!apiKeyManager.getKeyValue('perplexity')}`);
    
    this.aiModelName = process.env.AI_MODEL_NAME || 'gpt-3.5-turbo';
    
    // Validate the configuration
    if (process.env.NODE_ENV === 'development') {
      const validationResult = validateOpenAIConfig();
      if (!validationResult.isValid) {
        console.warn('OpenAI configuration validation failed:');
        validationResult.diagnostics.forEach(msg => console.warn(`- ${msg}`));
      }
    }
    
    try {
      // Create OpenAI client using our utility
      this.openaiClient = createOpenAIClient();
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.openaiClient = null;
    }
  }
  
  /**
   * Extract business and product information from a website using LLM-first approach
   * 
   * @param url - The URL of the website to extract information from
   * @returns An extraction result containing the extracted entities and metadata
   */
  public async extract(url: string): Promise<ExtractionResult> {
    console.info(`Starting LLM-first extraction for URL: ${url}`);
    
    const startTime = Date.now();
    let htmlContent = '';
    let extractionAttempts = 0;
    const maxAttempts = 3;
    
    // Generate a cache key based on URL
    const cacheKey = `extraction:${this.generateHashFromText(url)}`;
    
    try {
      // Check for cached extraction result first
      const cachedResult = this.getCachedExtractionResult(cacheKey);
      if (cachedResult) {
        console.info(`Using cached extraction result for ${url}`);
        const result: ExtractionResult = {
          ...cachedResult,
          status: 'completed',
          processingTime: cachedResult.processingTime,
        };
        // Add a console note about cached result
        console.info('Result loaded from cache');
        return result;
      }
      
      // Get HTML content using the most appropriate method
      htmlContent = await this.getHtmlContent(url, extractionAttempts, maxAttempts);
      
      // Extract data from the HTML content - First use OpenAI for base extraction
      console.info('Sending content to OpenAI for initial structure recognition');
      
      let extractedEntities: ExtractedEntity[] = [];
      let openAIResponse: string | null = null;
      
      try {
        // Try to get data from OpenAI
        const extractionPrompt = this.createExtractionPrompt(htmlContent, url);
        openAIResponse = await this.callAI(extractionPrompt);
        extractedEntities = this.parseExtractionResponse(openAIResponse, url);
      } catch (openAIError) {
        console.error(`OpenAI extraction failed: ${openAIError}`);
        // If OpenAI fails, try basic extraction as fallback
        extractedEntities = this.extractPartialData(htmlContent, url);
      }
      
      // Try enhancing with Perplexity, but don't fail the whole process if it fails
      if (this.config.perplexityAI?.apiKey) {
        try {
          console.info('Using Perplexity API for enhanced extraction and validation');
          extractedEntities = await this.validateWithPerplexity(extractedEntities, htmlContent, url);
        } catch (perplexityError) {
          console.warn(`Perplexity validation failed, continuing with OpenAI results: ${perplexityError}`);
          // Keep the OpenAI extracted entities and continue
        }
      } else {
        console.warn('Perplexity API key not available, skipping enhanced validation');
      }
      
      // If no products found, try partial extraction
      if (!extractedEntities.some(entity => entity.type === 'product')) {
        console.info('No products found in initial extraction, attempting partial extraction');
        const partialEntities = await this.extractPartialData(htmlContent, url);
        if (partialEntities.length > 0) {
          // Merge partial entities with existing entities
          const existingEntityIds = new Set(extractedEntities.map(e => e.id));
          for (const entity of partialEntities) {
            if (!existingEntityIds.has(entity.id)) {
              extractedEntities.push(entity);
            }
          }
        }
      }
      
      // Enrich with MCP layer if configured - make this step optional
      if (this.config.mcpConfig?.enableCrossReferencing) {
        try {
          extractedEntities = await this.enrichWithMCPLayer(extractedEntities, url);
        } catch (mcpError) {
          console.warn(`MCP enrichment failed, continuing with existing results: ${mcpError}`);
          // Continue with the entities we have
        }
      }
      
      const processingTime = Date.now() - startTime;
      const result: ExtractionResult = {
        id: this.generateExtractionId(),
        sourceUrl: url,
        sourceType: 'website',
        rawContent: htmlContent,
        extractedEntities,
        confidence: this.calculateOverallConfidence(extractedEntities),
        processingTime,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Cache the successful result
      this.cacheExtractionResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error extracting from URL ${url}: ${error}`);
      
      // Try to return a partial result rather than failing completely
      let extractedEntities: ExtractedEntity[] = [];
      
      // If we have HTML content, we can still try to extract something
      if (htmlContent) {
        try {
          // Use basic extraction as a fallback
          extractedEntities = this.extractPartialData(htmlContent, url);
          console.info(`Fallback extraction found ${extractedEntities.length} entities`);
        } catch (fallbackError) {
          console.error(`Fallback extraction also failed: ${fallbackError}`);
        }
      }
      
      const processingTime = Date.now() - startTime;
      return {
        id: this.generateExtractionId(),
        sourceUrl: url,
        sourceType: 'website',
        rawContent: htmlContent,
        extractedEntities,
        confidence: this.calculateOverallConfidence(extractedEntities),
        processingTime,
        status: extractedEntities.length > 0 ? 'partial' : 'failed',
        error: error instanceof Error ? error.message : String(error),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } finally {
      // Ensure the browser is closed
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }
  
  /**
   * Cache the extraction result
   * 
   * @param cacheKey - Key for the cache
   * @param result - Extraction result to cache
   */
  private cacheExtractionResult(cacheKey: string, result: ExtractionResult): void {
    try {
      // Use localStorage in browser environment or memory cache in Node.js
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(cacheKey, JSON.stringify(result));
        // Set an expiration time (24 hours)
        window.localStorage.setItem(`${cacheKey}:expiry`, (Date.now() + 24 * 60 * 60 * 1000).toString());
      } else {
        // In-memory cache for Node.js environment
        if (!this._memoryCache) {
          this._memoryCache = new Map();
        }
        this._memoryCache.set(cacheKey, {
          result,
          expiry: Date.now() + 24 * 60 * 60 * 1000
        });
      }
      console.info(`Cached extraction result for key: ${cacheKey}`);
    } catch (error) {
      console.warn(`Failed to cache extraction result: ${error}`);
    }
  }
  
  /**
   * Get a cached extraction result
   * 
   * @param cacheKey - Key for the cache
   * @returns Cached extraction result or null if not found
   */
  private getCachedExtractionResult(cacheKey: string): ExtractionResult | null {
    try {
      // Try to get from localStorage in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const expiry = parseInt(window.localStorage.getItem(`${cacheKey}:expiry`) || '0');
        if (expiry > Date.now()) {
          const cachedData = window.localStorage.getItem(cacheKey);
          if (cachedData) {
            return JSON.parse(cachedData) as ExtractionResult;
          }
        } else {
          // Clean up expired cache entry
          window.localStorage.removeItem(cacheKey);
          window.localStorage.removeItem(`${cacheKey}:expiry`);
        }
      } else {
        // Try in-memory cache for Node.js environment
        if (this._memoryCache) {
          const cached = this._memoryCache.get(cacheKey);
          if (cached && cached.expiry > Date.now()) {
            return cached.result;
          } else if (cached) {
            // Clean up expired cache entry
            this._memoryCache.delete(cacheKey);
          }
        }
      }
      return null;
    } catch (error) {
      console.warn(`Failed to retrieve cached extraction result: ${error}`);
      return null;
    }
  }
  
  // Memory cache for Node.js environment
  private _memoryCache?: Map<string, { result: ExtractionResult; expiry: number }>;
  
  /**
   * Get HTML content using the most appropriate method with fallbacks
   */
  private async getHtmlContent(url: string, extractionAttempts: number, maxAttempts: number): Promise<string> {
    let htmlContent = '';
    
    // Try direct HTTP request first
    try {
      console.info(`Attempting to fetch content from ${url} using direct HTTP request`);
      htmlContent = await this.fetchContentWithAxios(url);
      console.info(`Successfully fetched content with direct HTTP request (${htmlContent.length} bytes)`);
      return htmlContent;
    } catch (axiosError) {
      console.warn(`Direct HTTP request failed: ${axiosError instanceof Error ? axiosError.message : String(axiosError)}`);
      
      // Fall back to Puppeteer for JavaScript-heavy sites
      console.info(`Falling back to Puppeteer for content extraction`);
      
      // Initialize browser if not already initialized
      if (!this.browser) {
        try {
          this.browser = await puppeteer.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu'
            ]
          });
        } catch (error) {
          console.error('Error launching Puppeteer browser:', error);
          throw error;
        }
      }
      
      // Try Puppeteer extraction with exponential backoff
      while (extractionAttempts < maxAttempts) {
        try {
          htmlContent = await this.getWebsiteContent(url);
          return htmlContent; // Success, return the content
        } catch (error) {
          extractionAttempts++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (error instanceof Error && error.stack) {
            console.debug(`Stack trace: ${error.stack}`);
          }
          
          if (extractionAttempts >= maxAttempts) {
            console.warn(`Puppeteer attempt ${extractionAttempts} failed: ${errorMessage}`);
            // Close browser and try final fallback
            if (this.browser) {
              await this.browser.close().catch(closeError => {
                console.error(`Error closing browser: ${closeError}`);
              });
              this.browser = null;
            }
            
            // Final fallback - try basic HTML fetching
            try {
              htmlContent = await this.fetchBasicHtml(url);
              console.info(`Successfully fetched content with basic HTML fallback (${htmlContent.length} bytes)`);
              return htmlContent;
            } catch (fallbackError) {
              console.error(`Basic HTML fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
              throw fallbackError;
            }
          }
          
          // Exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, extractionAttempts - 1), 10000);
          console.info(`Waiting ${backoffTime}ms before retry ${extractionAttempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // This is a fallback return if all the above logic somehow doesn't return
    return htmlContent;
  }
  
  /**
   * Fetch website content using axios HTTP client - faster and more reliable than Puppeteer for simple sites
   * 
   * @param url - The URL to get content from
   * @returns HTML content of the website
   */
  private async fetchContentWithAxios(url: string): Promise<string> {
    try {
      // Add random query param to bypass caches
      const bypassCacheUrl = new URL(url);
      bypassCacheUrl.searchParams.append('_', Date.now().toString());
      
      const response = await axios.get(bypassCacheUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 30000, // 30 seconds timeout
        validateStatus: (status) => status < 400 // Consider any non-4xx/5xx response as success
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP request failed with status: ${response.status}`);
      }
      
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        console.warn(`Unexpected content type: ${contentType}, proceeding anyway`);
      }
      
      // Ensure the response data is a string
      const htmlContent = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
      
      return htmlContent;
    } catch (error) {
      console.error(`Error in HTTP fetch: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the website content using Puppeteer
   * 
   * @param url - The URL to get content from
   * @returns HTML content of the website
   */
  private async getWebsiteContent(url: string): Promise<string> {
    const page = await this.browser!.newPage();
    
    try {
      // Set reasonable timeouts and viewport
      await page.setDefaultNavigationTimeout(60000); // 60 seconds
      await page.setViewport({ width: 1280, height: 800 });
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Block unnecessary resources to improve performance and avoid issues
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Navigate to the URL with more resilient options
      console.info(`Navigating to ${url}...`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Wait for content to load
      console.info('Waiting for content to load...');
      await this.waitForPageLoad(page);
      
      // Get the page content
      console.info('Getting page content...');
      const content = await page.content();
      
      if (!content || content.trim().length === 0) {
        throw new Error('Received empty content from page');
      }
      
      console.info(`Successfully retrieved content (${content.length} bytes)`);
      
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error getting website content: ${errorMessage}`);
      
      // Try to get at least some content even on error
      try {
        const partialContent = await page.content();
        if (partialContent && partialContent.length > 0) {
          console.info(`Retrieved partial content (${partialContent.length} bytes)`);
          return partialContent;
        }
      } catch (secondaryError) {
        console.error(`Failed to get partial content: ${secondaryError}`);
      }
      
      throw error;
    } finally {
      // Always close the page
      await page.close().catch(e => console.error(`Error closing page: ${e}`));
    }
  }
  
  /**
   * Extract all entities from HTML content using LLM
   * 
   * @param html - HTML content of the website
   * @param sourceUrl - The source URL
   * @returns Array of extracted entities
   */
  private async extractEntitiesWithLLM(html: string, sourceUrl: string): Promise<ExtractedEntity[]> {
    // Create a comprehensive extraction prompt
    const prompt = this.createExtractionPrompt(html, sourceUrl);
    
    // Call the AI model
    const response = await this.callAI(prompt);
    
    // Parse the response into entities
    return this.parseExtractionResponse(response, sourceUrl);
  }
  
  /**
   * Create a comprehensive extraction prompt for all entity types
   * 
   * @param html - HTML content of the website
   * @param sourceUrl - The source URL
   * @returns A prompt string for the AI model
   */
  private createExtractionPrompt(html: string, sourceUrl: string): string {
    // Create a text-only version of the HTML by removing all tags
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 20000); // Limit to 20,000 characters to fit in context window
    
    return `
      I need you to extract business information and products from this website content.
      
      IMPORTANT CONTEXT:
      You are part of TradeWizard, a system that helps businesses understand trade opportunities.
      Your extraction will be enriched by specialized Model Context Protocols (MCPs):
      1. Compliance MCP - provides regulatory info (HS codes, required documents, tariff rates)
      2. Market Intelligence MCP - provides market insights (market size, growth trends, competitors)
      
      EXTRACTION GUIDELINES:
      - CRITICAL: ALWAYS extract business name and basic information - this is required
      - You MUST identify the core business, even if minimally referenced in the content
      - Create reasonable business descriptions based on the content and products found
      - Focus ONLY on actual business information and REAL products/services
      - Extract ALL product variants, flavors, and variations as separate products
      - For each product, extract:
        * Full product name
        * Complete description including ALL details about:
          - Storage requirements (frozen/chilled/ambient)
          - Ingredients
          - Packaging types
          - Product variants/flavors
          - Any specific features or characteristics
      - DO NOT attempt to categorize products - this will be handled by MCPs
      - DO NOT guess HS codes - this will be handled by MCPs
      - DO NOT skip any product variations - extract everything and let MCPs handle categorization
      - CRITICALLY IMPORTANT: Ignore navigation elements, menu items, UI components, and generic website text
      - For each entity extracted, provide a confidence level (0-1)
      - Flag ALL products for MCP enrichment with "needsMCPEnrichment": true
      - Include as much raw product information as possible to help MCPs with classification
      
      WHAT TO EXCLUDE:
      - Do NOT extract menu items or navigation elements like "Home", "About Us", "Contact", etc.
      - Do NOT include page section titles as products
      - Do NOT include generic service descriptions unless they're specific offerings
      - Exclude any items that are clearly UI elements rather than actual products
      
      WEBSITE URL: ${sourceUrl}
      
      WEBSITE CONTENT:
      ${textContent}
      
      EXTRACT THE FOLLOWING AND RETURN AS JSON:
      1. Business Information (REQUIRED): Name, description, type, years in operation
         - Even if minimal information is available, you MUST extract a business name and description
         - If the business name isn't explicit, derive it from the domain or content
      2. Location Information: Address, city, province, country, postal code
      3. Contact Information: Phone numbers, email addresses, website
      4. Social Media: Platform names and URLs
      5. Products/Services: Name, description, specifications, variants
         - Include ALL product details in the description field
         - Do NOT attempt to categorize - leave that to MCPs
         - Flag ALL products for MCP enrichment
      
      RETURN A JSON OBJECT WITH THIS EXACT STRUCTURE:
      {
        "business": {
          "name": {"value": "", "confidence": 0.0},
          "description": {"value": "", "confidence": 0.0},
          "businessType": {"value": "", "confidence": 0.0},
          "yearsInOperation": {"value": "", "confidence": 0.0},
          "needsMCPEnrichment": true
        },
        "location": {
          "address": {"value": "", "confidence": 0.0},
          "city": {"value": "", "confidence": 0.0},
          "province": {"value": "", "confidence": 0.0},
          "country": {"value": "", "confidence": 0.0},
          "postalCode": {"value": "", "confidence": 0.0}
        },
        "contacts": [
          {
            "type": "phone/email/social",
            "value": "",
            "platform": "",
            "confidence": 0.0
          }
        ],
        "products": [
          {
            "name": "",
            "description": "",  // Include ALL product details here
            "specifications": {},
            "confidence": 0.0,
            "url": "",
            "needsMCPEnrichment": true,
            "mcpEnrichmentNotes": "Full product details for MCP classification"
          }
        ],
        "mcpEnrichmentFlags": {
          "needsComplianceData": true,
          "needsMarketIntelligence": true,
          "priorityProducts": []
        }
      }
      
      IMPORTANT: You MUST provide the business name field - this is critical.
      Do not return an empty or null business name under any circumstances.
      If the business name isn't clearly stated, derive it from the domain or content.
    `;
  }
  
  /**
   * Parse extraction response from the AI model
   * 
   * @param response - The AI model response
   * @param sourceUrl - The source URL
   * @returns Extracted entities
   */
  private parseExtractionResponse(response: string, sourceUrl: string): ExtractedEntity[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in extraction response, attempting to extract partial data');
        // Try to extract any product-like information even without valid JSON
        return this.extractPartialData(response, sourceUrl);
      }
      
      const data = JSON.parse(jsonMatch[0]) as Record<string, any>;
      const entities: ExtractedEntity[] = [];
      const confidenceThreshold = 0.2; // Lowered further to be even more permissive
      const productConfidenceThreshold = 0.3; // Lowered further to be even more permissive
      
      // Add metadata about extraction quality
      entities.push({
        id: this.generateEntityId(),
        type: 'metadata',
        name: 'Extraction Quality',
        value: 'extraction-quality',
        confidence: 1.0,
        source: sourceUrl,
        verified: false,
        userModified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        attributes: {
          partialExtraction: true,
          qualityMetrics: {
            jsonParsed: true,
            hasProducts: Boolean(data.products?.length),
            hasBusiness: Boolean(data.business?.name?.value),
            confidenceThresholds: {
              general: confidenceThreshold,
              product: productConfidenceThreshold
            }
          }
        }
      });
      
      // Process business entity - ALWAYS create a business entity even with low confidence
      if (data.business && data.business.name && data.business.name.value) {
        // Use any confidence value if provided, or default to 0.5
        const confidence = typeof data.business.name.confidence === 'number' 
                           ? data.business.name.confidence
                           : 0.5;
        
        entities.push({
          id: this.generateEntityId(),
          type: 'business',
          name: data.business.name.value,
          value: data.business.name.value,
          confidence: confidence,
          source: sourceUrl,
          verified: false,
          userModified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: {
            description: data.business.description?.value || '',
            businessType: data.business.businessType?.value || '',
            yearsInOperation: data.business.yearsInOperation?.value || '',
            needsMCPEnrichment: data.business.needsMCPEnrichment || false
          }
        });
      } else {
        // If no business data found, extract from URL to ensure we always have a business entity
        try {
          const url = new URL(sourceUrl);
          const domain = url.hostname;
          const businessName = domain
            .replace('www.', '')
            .split('.')
            .slice(0, -1)
            .join('.')
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          entities.push({
            id: this.generateEntityId(),
            type: 'business',
            name: businessName,
            value: businessName,
            confidence: 0.6, // Medium confidence for domain-based names
            source: sourceUrl,
            verified: false,
            userModified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            attributes: {
              description: `Business operating at ${sourceUrl}`,
              businessType: '',
              needsMCPEnrichment: true,
              extractedFromURL: true
            }
          });
          
          console.info(`Created business entity from URL: ${businessName}`);
        } catch (urlError) {
          console.error(`Error creating business entity from URL: ${urlError}`);
        }
      }
      
      // Process location entity
      if (data.location && data.location.address && 
          data.location.address.value && 
          data.location.address.confidence >= confidenceThreshold) {
        entities.push({
          id: this.generateEntityId(),
          type: 'location',
          name: 'Primary Location',
          value: data.location.address.value,
          confidence: data.location.address.confidence,
          source: sourceUrl,
          verified: false,
          userModified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: {
            address: data.location.address.value,
            city: data.location.city?.value || '',
            province: data.location.province?.value || '',
            country: data.location.country?.value || '',
            postalCode: data.location.postalCode?.value || ''
          }
        });
      }
      
      // Process contact entities
      if (data.contacts && Array.isArray(data.contacts)) {
        data.contacts.forEach((contact: ExtractedContact) => {
          if (contact.value && contact.confidence >= confidenceThreshold) {
            entities.push({
              id: this.generateEntityId(),
              type: 'contact',
              name: contact.type || 'Contact',
              value: contact.value,
              confidence: contact.confidence,
              source: sourceUrl,
              verified: false,
              userModified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              attributes: {
                contactType: contact.type || '',
                platform: contact.platform || ''
              }
            });
          }
        });
      }
      
      // Process product entities with MCP awareness
      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((product: ExtractedProduct, index: number) => {
          // Use higher confidence threshold for products to filter out navigation elements
          if (product.name && product.confidence >= productConfidenceThreshold) {
            // Additional validation to filter out generic UI elements
            if (this.isLikelyNavigationElement(product.name)) {
              console.info(`Filtering out likely navigation element: ${product.name}`);
              return;
            }
            
            // Check if this product is in the priority list
            const isPriority = data.mcpEnrichmentFlags?.priorityProducts?.includes(index) || false;
            
            entities.push({
              id: this.generateEntityId(),
              type: 'product',
              name: product.name,
              value: product.name,
              confidence: product.confidence,
              source: sourceUrl,
              verified: false,
              userModified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              attributes: {
                description: product.description || '',
                price: product.price || '',
                category: product.category || '',
                productType: product.productType || '',
                keywords: product.keywords || [],
                potentialHSCode: product.potentialHSCode || '',
                specifications: product.specifications || {},
                url: product.url || sourceUrl,
                needsMCPEnrichment: product.needsMCPEnrichment || false,
                mcpEnrichmentNotes: product.mcpEnrichmentNotes || '',
                mcpPriority: isPriority ? 'high' : 'normal'
              }
            });
          }
        });
      }
      
      // Store MCP enrichment flags as metadata in a special entity
      if (data.mcpEnrichmentFlags) {
        entities.push({
          id: this.generateEntityId(),
          type: 'metadata',
          name: 'MCP Enrichment Flags',
          value: 'mcp-enrichment-flags',
          confidence: 1.0,
          source: sourceUrl,
          verified: false,
          userModified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: {
            needsComplianceData: data.mcpEnrichmentFlags.needsComplianceData || false,
            needsMarketIntelligence: data.mcpEnrichmentFlags.needsMarketIntelligence || false,
            priorityProducts: data.mcpEnrichmentFlags.priorityProducts || []
          }
        });
      }
      
      return entities;
    } catch (error) {
      console.error(`Error parsing extraction response: ${error}`);
      return [];
    }
  }
  
  /**
   * Check if a string is likely to be a navigation element rather than a product
   */
  private isLikelyNavigationElement(name: string): boolean {
    // Common navigation element patterns - reduced to only clear navigation items
    const navigationPatterns = [
      /^home$/i,
      /^cart$/i,
      /^login$/i,
      /^register$/i,
      /^search$/i,
      /^next$/i,
      /^previous$/i
    ];
    
    // Check against common navigation patterns
    if (navigationPatterns.some(pattern => pattern.test(name.trim()))) {
      return true;
    }
    
    // Only filter out extremely short names that are clearly not products
    if (name.trim().length < 2) {
      return true;
    }
    
    // Don't filter out potential product categories or types
    if (name.toLowerCase().includes('product') || 
        name.toLowerCase().includes('category') ||
        name.toLowerCase().includes('collection')) {
      return false;
    }
    
    return false; // Default to keeping items unless clearly navigation
  }
  
  /**
   * Call the AI model with a prompt using the OpenAI SDK
   * 
   * @param prompt - The prompt to send to the AI model
   * @returns The AI model response
   */
  private async callAI(prompt: string, systemContent?: string): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client is not initialized. Please check your API key configuration.');
    }
    
    try {
      // Log the request details for debugging in development
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_API_KEYS === 'true') {
        console.log(`Using model: ${this.aiModelName}`);
        console.log(`Using API: ${process.env.AI_MODEL_URL}`);
      }
      
      // Prepare the messages array with correct typing
      const messages: ChatCompletionMessageParam[] = systemContent 
        ? [
            { role: 'system', content: systemContent },
            { role: 'user', content: prompt }
          ] 
        : [{ role: 'user', content: prompt }];
      
      // Make the API call using the OpenAI client
      const response = await this.openaiClient.chat.completions.create({
        model: this.aiModelName,
        messages: messages,
        temperature: 0.2,
        max_tokens: this.config.aiModel.maxTokens
      });
      
      return response.choices[0].message.content || '';
    } catch (error: any) {
      // Handle OpenAI API errors
      const errorMessage = error.message || 'Unknown error';
      
      // Check for authentication errors specifically
      if (error.response?.status === 401) {
        throw new Error(`Authentication failed with OpenAI API: ${errorMessage}`);
      }
      
      throw new Error(`Error calling OpenAI API: ${errorMessage}`);
    }
  }
  
  /**
   * Generate a unique ID for an extraction
   * 
   * @returns A unique extraction ID
   */
  private generateExtractionId(): string {
    return 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Generate a unique ID for an entity
   * 
   * @returns A unique entity ID
   */
  private generateEntityId(): string {
    return 'ent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Calculate overall confidence score for a set of extracted entities
   * 
   * @param entities - The extracted entities
   * @returns Overall confidence score
   */
  private calculateOverallConfidence(entities: ExtractedEntity[]): number {
    if (entities.length === 0) {
      return 0;
    }
    
    // Calculate weighted average based on entity types
    const weights: Record<EntityType, number> = {
      'business': 0.4,
      'product': 0.3,
      'location': 0.2,
      'contact': 0.1,
      'person': 0.1,
      'service': 0.3,
      'metadata': 0.1  // Add metadata type with low weight
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    entities.forEach(entity => {
      const weight = weights[entity.type] || 0.1;
      weightedSum += entity.confidence * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Validate extracted entities using Perplexity AI
   * Enhanced to make better use of Perplexity's capabilities
   */
  private async validateWithPerplexity(entities: ExtractedEntity[], html: string, sourceUrl: string): Promise<ExtractedEntity[]> {
    try {
      console.info(`Validating and enhancing extracted data with Perplexity AI for ${sourceUrl}`);
      
      // Extract product and business entities for focused validation
      const productEntities = entities.filter(entity => entity.type === 'product');
      const businessEntities = entities.filter(entity => entity.type === 'business');
      
      // Skip validation if no products or business entities found
      if (productEntities.length === 0 && businessEntities.length === 0) {
        console.warn('No business or product entities found for Perplexity validation');
        return entities;
      }
      
      // Build enhanced validation prompt
      const validationPrompt = this.buildPerplexityValidationPrompt(entities, sourceUrl);
      
      // Call Perplexity AI for validation
      console.info('Calling Perplexity API for detailed validation and enrichment');
      const validationResponse = await this.callPerplexityAI(validationPrompt);
      
      // Parse validation response and update entities
      const validatedEntities = this.processPerplexityValidation(entities, validationResponse);
      
      // If Perplexity identified more products than OpenAI, use its results
      if (validatedEntities.filter(e => e.type === 'product').length > productEntities.length) {
        console.info('Perplexity identified additional products not found in initial extraction');
      }
      
      console.info(`Perplexity validation complete: ${validatedEntities.filter(e => e.type === 'product').length} products`);
      return validatedEntities;
    } catch (error) {
      console.warn(`Error validating with Perplexity AI: ${error}`);
      // If validation fails, return original entities
      return entities;
    }
  }
  
  /**
   * Build a validation prompt for Perplexity AI
   * 
   * @param entities - Extracted entities to validate
   * @param sourceUrl - The source URL
   * @returns The validation prompt
   */
  private buildPerplexityValidationPrompt(entities: ExtractedEntity[], sourceUrl: string): string {
    const businessEntity = entities.find(entity => entity.type === 'business');
    const productEntities = entities.filter(entity => entity.type === 'product');
    
    let prompt = `
      I need you to validate and research information about this business and its products.
      Website URL: ${sourceUrl}
      
      TASKS:
      1. Search the web for information about this business and its products
      2. Cross-reference product information with industry databases and market reports
      3. Verify product authenticity and market presence
      4. Research similar products in the market for validation
      
      IMPORTANT VALIDATION GUIDELINES:
      - Consider ALL product variants and flavors as valid products
      - Include products that might be seasonal or limited editions
      - Accept products that are similar to known offerings from this business
      - Be inclusive of product variations and regional names
      - Only mark products as invalid if they are clearly:
        * Navigation menu items
        * Website section headers
        * Generic category names
        * Completely unrelated to the business's industry
      
      EXTRACTED INFORMATION TO VALIDATE:
      
      BUSINESS INFO:
      ${businessEntity ? `
        Name: ${businessEntity.name}
        Description: ${businessEntity.attributes.description || 'N/A'}
        Business Type: ${businessEntity.attributes.businessType || 'N/A'}
        Years in Operation: ${businessEntity.attributes.yearsInOperation || 'N/A'}
      ` : 'No business information extracted'}
      
      PRODUCTS:
      ${productEntities.map((product, index) => `
        Product ${index + 1}:
        - Name: ${product.name}
        - Description: ${product.attributes.description || 'N/A'}
        - Price: ${product.attributes.price || 'N/A'}
        - Category: ${product.attributes.category || 'N/A'}
        - Product Type: ${product.attributes.productType || 'N/A'}
      `).join('\n')}
      
      VALIDATION AND RESEARCH REQUIREMENTS:
      1. Search online for the business name and verify its existence, operations, and reputation
      2. For each product:
         - Consider it valid if it could reasonably be a product variant
         - Search for the product in online marketplaces and industry databases
         - Check for similar products in the market
         - Verify if the product category matches industry standards
      3. Flag items ONLY if they are clearly:
         - Navigation elements or UI components
         - Generic website sections
         - Completely unrelated to the business's industry
      4. Provide confidence scores based on:
         - Web presence and verifiability (40%)
         - Market data correlation (30%)
         - Industry standard alignment (30%)
      
      RESPOND IN THIS EXACT JSON FORMAT:
      {
        "businessValidation": {
          "isValid": true/false,
          "correctedName": "Business Name",
          "confidence": 0.0,
          "webPresence": "Description of online presence and reputation",
          "notes": "Validation and research notes"
        },
        "productValidations": [
          {
            "index": 0,
            "isValid": true/false, 
            "correctedName": "Product Name",
            "confidence": 0.0,
            "marketPresence": "Description of product's market presence",
            "competitorProducts": ["Similar product 1", "Similar product 2"],
            "notes": "Validation and research notes"
          }
        ]
      }
    `;
    
    return prompt;
  }
  
  /**
   * Process Perplexity AI validation response to update entities
   * 
   * @param entities - Original extracted entities
   * @param validationResponse - The response from Perplexity AI
   * @returns Updated entities with validation data
   */
  private processPerplexityValidation(entities: ExtractedEntity[], validationResponse: string): ExtractedEntity[] {
    try {
      console.info(`Processing Perplexity validation for ${entities.length} entities`);
      
      // Count original products for comparison
      const originalProductCount = entities.filter(entity => entity.type === 'product').length;
      console.info(`Original product count: ${originalProductCount}`);
      
      const jsonMatch = validationResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in validation response');
        console.info('Returning original entities due to invalid JSON response');
        return entities;
      }
      
      const validationData = JSON.parse(jsonMatch[0]);
      const updatedEntities = [...entities];
      
      // Update product entities if validations exist
      if (validationData.productValidations && Array.isArray(validationData.productValidations)) {
        const productEntities = updatedEntities.filter(entity => entity.type === 'product');
        console.info(`Found ${productEntities.length} product entities and ${validationData.productValidations.length} validations`);
        
        // Keep track of how many products would be filtered out
        let validProductCount = 0;
        
        validationData.productValidations.forEach((validation: {
          index: number;
          isValid: boolean;
          correctedName?: string;
          confidence: number;
          marketPresence?: string;
          competitorProducts?: string[];
          notes?: string;
        }) => {
          const index = validation.index;
          if (index >= 0 && index < productEntities.length) {
            const product = productEntities[index];
            
            // Calculate weighted confidence score
            const webPresenceScore = validation.confidence * 0.4;
            const marketDataScore = validation.confidence * 0.3;
            const industryStandardScore = validation.confidence * 0.3;
            const combinedConfidence = webPresenceScore + marketDataScore + industryStandardScore;
            
            // Log validation details for debugging
            console.info(`Product ${index}: "${product.name}" - Confidence: ${combinedConfidence.toFixed(2)}, Original isValid: ${validation.isValid}`);
            
            product.confidence = combinedConfidence;
            
            // Update name if correction provided and valid
            if (validation.correctedName && validation.isValid) {
              product.name = validation.correctedName;
              product.value = validation.correctedName;
              console.info(`Corrected product name from "${product.value}" to "${validation.correctedName}"`);
            }
            
            // REDUCED THRESHOLD: Accept products with lower confidence (0.35 instead of 0.7)
            const validationThreshold = 0.35; // Lowered from 0.4
            product.verified = validation.confidence > validationThreshold;
            console.info(`Product ${index} verified: ${product.verified} (threshold: ${validationThreshold}, confidence: ${validation.confidence})`);
            
            if (product.verified) {
              validProductCount++;
            }
            
            // Add validation notes and market data
            product.attributes = product.attributes || {};
            product.attributes.validationNotes = validation.notes;
            product.attributes.marketPresence = validation.marketPresence;
            product.attributes.competitorProducts = validation.competitorProducts;
            product.attributes.confidenceScore = validation.confidence;
            
            // Mark low confidence products but don't remove them
            if (!product.verified) {
              product.attributes.lowConfidence = true;
              product.attributes.validationWarning = validation.notes || 'Lower confidence in product validation';
            }
          }
        });
        
        console.info(`After validation logic: ${validProductCount} valid products out of ${productEntities.length}`);
        
        // IMPORTANT: Apply minimum product preservation rule
        // If all or most products would be filtered out, adjust verification to keep at least some products
        if (validProductCount === 0 && productEntities.length > 0) {
          console.warn('All products were filtered out by validation. Preserving highest confidence products.');
          
          // Find the highest confidence products and mark them as verified
          const sortedByConfidence = [...productEntities].sort((a, b) => b.confidence - a.confidence);
          const minProductsToKeep = Math.min(2, sortedByConfidence.length);
          
          for (let i = 0; i < minProductsToKeep; i++) {
            sortedByConfidence[i].verified = true;
            sortedByConfidence[i].attributes.forcedVerification = true;
            sortedByConfidence[i].attributes.validationWarning = 'Verification forced to preserve minimum products';
            console.info(`Force verified product: "${sortedByConfidence[i].name}" with confidence ${sortedByConfidence[i].confidence}`);
          }
        } else if (validProductCount < Math.max(2, Math.floor(productEntities.length * 0.3))) {
          // If less than 30% of products are valid or less than 2 products, preserve more
          console.warn(`Low valid product count (${validProductCount}). Preserving additional products.`);
          
          // Sort by confidence and verify more products
          const unverifiedProducts = productEntities.filter(p => !p.verified)
            .sort((a, b) => b.confidence - a.confidence);
          
          const additionalToVerify = Math.min(
            Math.max(2 - validProductCount, Math.ceil(productEntities.length * 0.3) - validProductCount),
            unverifiedProducts.length
          );
          
          for (let i = 0; i < additionalToVerify; i++) {
            unverifiedProducts[i].verified = true;
            unverifiedProducts[i].attributes.forcedVerification = true;
            unverifiedProducts[i].attributes.validationWarning = 'Verification forced to preserve minimum products';
            console.info(`Additionally verified product: "${unverifiedProducts[i].name}" with confidence ${unverifiedProducts[i].confidence}`);
          }
        }
      }
      
      // Final count of verified products
      const finalVerifiedCount = updatedEntities.filter(e => e.type === 'product' && e.verified).length;
      console.info(`Final verification results: ${finalVerifiedCount} verified products out of ${originalProductCount} original products`);
      
      return updatedEntities;
    } catch (error) {
      console.error(`Error processing validation response: ${error}`);
      console.warn('Returning original entities due to validation processing error');
      // Return original entities if validation processing fails
      return entities;
    }
  }
  
  /**
   * Call Perplexity AI with a prompt
   * 
   * @param prompt - The prompt to send to Perplexity AI
   * @returns The Perplexity AI response
   */
  private async callPerplexityAI(prompt: string): Promise<string> {
    try {
      if (!this.config.perplexityAI?.apiKey) {
        throw new Error('Perplexity API key not configured');
      }
      
      console.info('Calling Perplexity API for validation');
      
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a precise validation assistant for TradeWizard. Your task is to validate business and product information with high accuracy. Be critical and flag any potential navigation elements or UI components that may have been misidentified as products.'
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.perplexityAI.apiKey}`
          }
        }
      );
      
      console.info('Successfully received Perplexity API response');
      
      // Safe type handling - using type assertions for response data
      const responseData = response.data as any;
      if (responseData && 
          typeof responseData === 'object' && 
          'choices' in responseData && 
          Array.isArray(responseData.choices) && 
          responseData.choices.length > 0 &&
          'message' in responseData.choices[0] &&
          'content' in responseData.choices[0].message) {
        return responseData.choices[0].message.content as string;
      }
      
      throw new Error('Unexpected response format from Perplexity AI');
    } catch (error: any) {
      // Handle and log Axios errors with detailed information
      console.error(`Error calling Perplexity AI: ${error.message || String(error)}`);
      
      // Check if it's an axios error with response
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data || {})}`);
      }
      
      throw new Error(`Perplexity AI call failed: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Enrich extracted entities using the MCP Layer with cross-referencing
   * 
   * @param entities - Entities extracted from the website
   * @param sourceUrl - The source URL
   * @returns Enriched entities with additional context from MCPs
   */
  private async enrichWithMCPLayer(entities: ExtractedEntity[], sourceUrl: string): Promise<ExtractedEntity[]> {
    try {
      console.info(`Enriching extracted data from ${sourceUrl} with MCP Layer`);
      
      // Clone the entities to avoid modifying the originals
      const enrichedEntities = [...entities];
      
      // Find the metadata entity containing MCP flags
      const metadataEntity = entities.find(entity => entity.type === 'metadata' && entity.name === 'MCP Enrichment Flags');
      
      // Get MCP enrichment flags
      const mcpFlags = metadataEntity ? {
        needsComplianceData: metadataEntity.attributes.needsComplianceData || false,
        needsMarketIntelligence: metadataEntity.attributes.needsMarketIntelligence || false,
        priorityProducts: metadataEntity.attributes.priorityProducts || []
      } : {
        needsComplianceData: true,
        needsMarketIntelligence: true,
        priorityProducts: []
      };
      
      // Extract product entities for enrichment
      const productEntities = entities.filter(entity => entity.type === 'product');
      
      if (productEntities.length > 0) {
        // Determine which MCPs to call based on flags
        if (mcpFlags.needsComplianceData) {
          await this.enrichWithComplianceMCP(productEntities);
        }
        
        if (mcpFlags.needsMarketIntelligence) {
          await this.enrichWithMarketIntelligenceMCP(productEntities);
        }
        
        // If cross-referencing is enabled, validate data between MCPs
        if (this.config.mcpConfig?.enableCrossReferencing) {
          await this.performMCPCrossReferenceValidation(productEntities);
        }
      }
      
      // Extract business entities for additional enrichment
      const businessEntities = entities.filter(entity => entity.type === 'business');
      
      if (businessEntities.length > 0) {
        // Implement business-specific enrichment in the future
      }
      
      return enrichedEntities;
    } catch (error) {
      console.warn(`Error enriching data with MCP Layer: ${error}`);
      // Return original entities if enrichment fails
      return entities;
    }
  }
  
  /**
   * Perform cross-reference validation between different MCP data sources
   * 
   * @param productEntities - Product entities to validate
   */
  private async performMCPCrossReferenceValidation(productEntities: ExtractedEntity[]): Promise<void> {
    try {
      console.info('Performing cross-reference validation between MCP data sources');
      
      for (const product of productEntities) {
        // Skip products without both compliance and market data
        if (!product.attributes.hsCode || !product.attributes.marketSize) {
          continue;
        }
        
        // Check for consistency between HS code and product category
        const hsCode = product.attributes.hsCode;
        const productType = product.attributes.productType;
        const marketCategory = product.attributes.marketCategory;
        
        // If there's an inconsistency, log it and adjust the confidence
        if (hsCode && productType && marketCategory && 
            !this.areProductCategoriesConsistent(hsCode, productType, marketCategory)) {
          console.warn(`Inconsistency detected for product ${product.name}: HS code ${hsCode} doesn't match category ${marketCategory}`);
          
          // Reduce confidence when inconsistencies are found
          product.confidence *= 0.8;
          
          // Add cross-reference validation note
          product.attributes.crossReferenceValidation = {
            isConsistent: false,
            notes: 'Inconsistency detected between HS code and market category'
          };
        } else {
          // Add positive validation note
          product.attributes.crossReferenceValidation = {
            isConsistent: true,
            notes: 'Cross-reference validation passed'
          };
          
          // Boost confidence slightly for consistent data
          product.confidence = Math.min(product.confidence * 1.1, 1.0);
        }
      }
    } catch (error) {
      console.warn(`Error in MCP cross-reference validation: ${error}`);
    }
  }
  
  /**
   * Check if product categories from different sources are consistent
   * 
   * @param hsCode - HS code from Compliance MCP
   * @param productType - Product type from extraction
   * @param marketCategory - Market category from Market Intelligence MCP
   * @returns Whether the categories are consistent
   */
  private areProductCategoriesConsistent(hsCode: string, productType: string, marketCategory: string): boolean {
    // This is a placeholder implementation that would need to be expanded
    // with actual HS code to category mapping logic
    
    // For demonstration, we'll use a simple check
    const hsCodePrefix = hsCode.substring(0, 2);
    
    // Example mappings (would need a comprehensive database in practice)
    const categoryMappings: Record<string, string[]> = {
      '84': ['electronics', 'machinery', 'computer'],
      '85': ['electronics', 'electrical', 'device'],
      '61': ['apparel', 'clothing', 'textile'],
      '94': ['furniture', 'lighting', 'bedding']
    };
    
    // Check if product type and market category are consistent with HS code
    const validCategories = categoryMappings[hsCodePrefix] || [];
    
    const productTypeLower = productType.toLowerCase();
    const marketCategoryLower = marketCategory.toLowerCase();
    
    // Check if any valid category is included in either product type or market category
    return validCategories.some(category => 
      productTypeLower.includes(category) || marketCategoryLower.includes(category)
    );
  }
  
  /**
   * Enrich product entities with compliance information from Compliance MCP
   * 
   * @param products - Product entities to enrich
   */
  private async enrichWithComplianceMCP(products: ExtractedEntity[]): Promise<void> {
    try {
      if (!this.config.mcpConfig?.complianceMcpUrl) {
        console.warn('Compliance MCP URL not configured');
        return;
      }

      console.info('Enriching products with Compliance MCP');

      // Use Promise.allSettled instead of sequential processing to handle errors per product
      const enrichmentPromises = products.map(async (product) => {
        try {
          const response = await axios.post<ComplianceMCPResponse>(
            this.config.mcpConfig!.complianceMcpUrl,
            {
              productName: product.name,
              description: product.attributes.description,
              category: product.attributes.category,
              productType: product.attributes.productType,
              keywords: product.attributes.keywords
            },
            { 
              timeout: 10000, // 10 second timeout
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          // Update product with compliance data
          const data = response.data;
          product.attributes.hsCode = data.hsCode;
          product.attributes.requiredDocuments = data.requiredDocuments;
          product.attributes.tariffRates = data.tariffRates;
          product.attributes.complianceNotes = data.notes;
          product.attributes.complianceConfidence = data.confidence;

          // Update overall confidence with compliance data
          product.confidence = (product.confidence + data.confidence) / 2;

          console.info(`Enriched product ${product.name} with HS code ${data.hsCode}`);
          return { success: true, product };
        } catch (error) {
          // Handle errors for individual products
          const errorMessage = this.getErrorMessage(error);
          console.error(`Error enriching product ${product.name} with Compliance MCP: ${errorMessage}`);
          
          // Add fallback data to prevent downstream errors
          product.attributes.complianceError = errorMessage;
          product.attributes.hsCode = product.attributes.hsCode || product.attributes.potentialHSCode || '';
          product.attributes.requiredDocuments = product.attributes.requiredDocuments || [];
          product.attributes.tariffRates = product.attributes.tariffRates || {};
          product.attributes.complianceNotes = product.attributes.complianceNotes || 
            'Failed to retrieve compliance data. Using estimated values.';
          product.attributes.complianceConfidence = 0.2; // Low confidence for fallback data
          
          return { success: false, product, error };
        }
      });

      // Wait for all promises to settle
      const results = await Promise.allSettled(enrichmentPromises);
      
      // Log overall results
      const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      const failed = products.length - succeeded;
      
      if (failed > 0) {
        console.warn(`Compliance MCP enrichment completed with ${succeeded} successes and ${failed} failures`);
      } else {
        console.info(`Compliance MCP enrichment completed successfully for all ${succeeded} products`);
      }
    } catch (error) {
      // This catches errors in the overall process, not in individual API calls
      console.error(`Error in Compliance MCP enrichment process: ${this.getErrorMessage(error)}`);
      // Continue with processing - don't let this block the whole extraction
    }
  }
  
  /**
   * Enrich product entities with market intelligence
   * 
   * @param products - Product entities to enrich
   */
  private async enrichWithMarketIntelligenceMCP(products: ExtractedEntity[]): Promise<void> {
    try {
      if (!this.config.mcpConfig?.marketIntelligenceMcpUrl) {
        console.warn('Market Intelligence MCP URL not configured');
        return;
      }

      console.info('Enriching products with Market Intelligence MCP');

      // Use Promise.allSettled instead of sequential processing
      const enrichmentPromises = products.map(async (product) => {
        try {
          const response = await axios.post<MarketIntelligenceMCPResponse>(
            this.config.mcpConfig!.marketIntelligenceMcpUrl,
            {
              productName: product.name,
              description: product.attributes.description,
              category: product.attributes.category,
              productType: product.attributes.productType,
              keywords: product.attributes.keywords,
              hsCode: product.attributes.hsCode // Use HS code if available from Compliance MCP
            },
            { 
              timeout: 10000, // 10 second timeout
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          // Update product with market intelligence data
          const data = response.data;
          product.attributes.marketSize = data.marketSize;
          product.attributes.marketGrowth = data.marketGrowth;
          product.attributes.competitors = data.competitors;
          product.attributes.marketCategory = data.category;
          product.attributes.marketTrends = data.trends;
          product.attributes.marketConfidence = data.confidence;

          // Update overall confidence with market intelligence data
          product.confidence = (product.confidence + data.confidence) / 2;

          console.info(`Enriched product ${product.name} with market data`);
          return { success: true, product };
        } catch (error) {
          // Handle errors for individual products
          const errorMessage = this.getErrorMessage(error);
          console.error(`Error enriching product ${product.name} with Market Intelligence MCP: ${errorMessage}`);
          
          // Add fallback data to prevent downstream errors
          product.attributes.marketError = errorMessage;
          product.attributes.marketSize = product.attributes.marketSize || 'Unknown';
          product.attributes.marketGrowth = product.attributes.marketGrowth || 'Unknown';
          product.attributes.competitors = product.attributes.competitors || [];
          product.attributes.marketCategory = product.attributes.marketCategory || product.attributes.category || '';
          product.attributes.marketTrends = product.attributes.marketTrends || [];
          product.attributes.marketConfidence = 0.2; // Low confidence for fallback data
          
          return { success: false, product, error };
        }
      });

      // Wait for all promises to settle
      const results = await Promise.allSettled(enrichmentPromises);
      
      // Log overall results
      const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      const failed = products.length - succeeded;
      
      if (failed > 0) {
        console.warn(`Market Intelligence MCP enrichment completed with ${succeeded} successes and ${failed} failures`);
      } else {
        console.info(`Market Intelligence MCP enrichment completed successfully for all ${succeeded} products`);
      }
    } catch (error) {
      // This catches errors in the overall process, not in individual API calls
      console.error(`Error in Market Intelligence MCP enrichment process: ${this.getErrorMessage(error)}`);
      // Continue with processing - don't let this block the whole extraction
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error occurred during extraction';
  }

  /**
   * Extract partial data when JSON parsing fails
   * Attempts to find product-like information in the raw response
   */
  private extractPartialData(response: string, sourceUrl: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Add metadata about partial extraction
    entities.push({
      id: this.generateEntityId(),
      type: 'metadata',
      name: 'Extraction Quality',
      value: 'extraction-quality',
      confidence: 1.0,
      source: sourceUrl,
      verified: false,
      userModified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      attributes: {
        partialExtraction: true,
        qualityMetrics: {
          jsonParsed: false,
          fallbackMode: true,
          rawResponseLength: response.length
        }
      }
    });

    try {
      // Always create a business entity from the URL
      try {
        const url = new URL(sourceUrl);
        const domain = url.hostname;
        const businessName = domain
          .replace('www.', '')
          .split('.')
          .slice(0, -1)
          .join('.')
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        entities.push({
          id: this.generateEntityId(),
          type: 'business',
          name: businessName,
          value: businessName,
          confidence: 0.7, // Higher confidence for domain-based names in partial extraction
          source: sourceUrl,
          verified: false,
          userModified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: {
            description: `Business operating at ${sourceUrl}`,
            businessType: this.inferBusinessTypeFromURL(sourceUrl),
            needsMCPEnrichment: true,
            extractedFromURL: true,
            partialExtraction: true
          }
        });
        
        console.info(`Created business entity from URL in partial extraction: ${businessName}`);
      } catch (urlError) {
        console.error(`Error creating business entity from URL in partial extraction: ${urlError}`);
      }

      // Extract products from HTML content
      if (response.includes('<') && response.includes('>')) {
        try {
          const extractedProducts = this.extractProductsFromHTML(response);
          console.info(`Extracted ${extractedProducts.length} potential products in partial mode`);
          
          // Convert found products to entities
          extractedProducts.forEach(productName => {
            if (!this.isInvalidProductName(productName)) {
              entities.push({
                id: this.generateEntityId(),
                type: 'product',
                name: productName,
                value: productName,
                confidence: 0.4, // Reasonable confidence for selected products
                source: sourceUrl,
                verified: false,
                userModified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                attributes: {
                  description: 'Extracted in partial mode - needs verification',
                  needsMCPEnrichment: true,
                  partialExtraction: true
                }
              });
            }
          });
        } catch (error) {
          console.error(`Error extracting products from HTML: ${error}`);
        }
      }
      
      // Log extraction quality
      const businessCount = entities.filter(e => e.type === 'business').length;
      const productCount = entities.filter(e => e.type === 'product').length;
      const contactCount = entities.filter(e => e.type === 'contact').length;
      console.info(`Extraction quality: Business: ${businessCount > 0}, Products: ${productCount}, Contacts: ${contactCount}`);
      
      console.info(`Extraction quality: Business: ${businessCount > 0}, Products: ${productCount}, Contacts: ${contactCount}`);
      
    } catch (error) {
      console.error('Error in partial data extraction:', error);
    }

    return entities;
  }
  
  /**
   * Check if a product name is invalid (HTML/CSS/JS attribute or other non-product)
   */
  private isInvalidProductName(name: string): boolean {
    // Filter out HTML/CSS/JS attributes and code fragments
    const invalidPatterns = [
      /^class=/i,
      /^id=/i,
      /^style=/i,
      /^href=/i,
      /^src=/i,
      /^alt=/i,
      /^placeholder=/i,
      /^value=/i,
      /^required/i,
      /^data-/i,
      /^\$\(/i,     // jQuery selectors
      /^function/i, // JavaScript functions
      /^</i,        // HTML tags
      /^>/i,        // HTML closing tags
      /^{/i,        // JSON/code blocks
      /^}/i,        // JSON/code blocks
      /^var /i,     // JavaScript variables
      /^const /i,   // JavaScript constants
      /^let /i,     // JavaScript let declarations
      /^\.[\w-]+/i, // CSS class selectors
      /^#[\w-]+/i,  // CSS ID selectors
      /^\[[\w-]+\]/i, // CSS attribute selectors
      /^@media/i,   // CSS media queries
      /^import /i,  // JS/CSS imports
      /^export /i,  // JS exports
      /^return /i,  // JS returns
      /^if\(/i,     // JS conditionals
      /^for\(/i,    // JS loops
      /^while\(/i,  // JS loops
      /\$\{/i,      // Template literals
      /^active$/i,  // Common class names
      /^filter-/i,  // Filter attributes
      /^[<>=!][\w\s]*[<>]/i, // HTML-like tags
      /\/\/.*$/i,   // Comment lines
      /^\/\*/i,     // Block comment starts
      /\*\/$/i,     // Block comment ends
      /^null$/i,    // JavaScript null
      /^undefined$/i, // JavaScript undefined
      /^true$/i,    // JavaScript boolean
      /^false$/i,   // JavaScript boolean
      /^NaN$/i,     // JavaScript NaN
      /^Infinity$/i // JavaScript Infinity
    ];
    
    // Check against invalid patterns
    if (invalidPatterns.some(pattern => pattern.test(name.trim()))) {
      return true;
    }
    
    // Check if it's too short to be a product
    if (name.trim().length < 3) {
      return true;
    }
    
    // Check if it contains characters that suggest it's code
    if (/[<>{}()\[\]$=;]/.test(name.trim())) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract potential product names from HTML structure
   */
  private extractProductsFromHTML(html: string): string[] {
    const candidateProducts: string[] = [];
    
    try {
      // Find potential product titles within product containers
      const productContainerPatterns = [
        /<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
        /<section[^>]*class="[^"]*products?[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
        /<div[^>]*id="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
      ];
      
      // Process product containers
      productContainerPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const containerContent = match[1];
          
          // Extract product title from container
          const titleMatch = containerContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i) ||
                            containerContent.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/span>/i) ||
                            containerContent.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/div>/i);
          
          if (titleMatch && titleMatch[1]) {
            // Clean up the extracted title
            const cleanTitle = titleMatch[1]
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .trim();
              
            if (cleanTitle.length > 0 && !this.isInvalidProductName(cleanTitle)) {
              candidateProducts.push(cleanTitle);
            }
          }
        }
      });
      
      // Find product titles in menu items - often indicates categories of products
      const menuItemPatterns = [
        /<li[^>]*class="[^"]*product-category[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
        /<a[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/a>/gi
      ];
      
      menuItemPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const itemContent = match[1];
          const cleanText = itemContent.replace(/<[^>]*>/g, '').trim();
          
          if (cleanText.length > 0 && !this.isInvalidProductName(cleanText)) {
            candidateProducts.push(cleanText);
          }
        }
      });
      
      // Look for potential products in structured data (Schema.org)
      const schemaMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
      if (schemaMatches) {
        schemaMatches.forEach(schema => {
          try {
            // Extract JSON from script tag
            const jsonContent = schema.replace(/<script[^>]*>([\s\S]*?)<\/script>/i, '$1');
            const schemaData = JSON.parse(jsonContent);
            
            // Check for products in schema
            const extractProductNames = (obj: any) => {
              if (!obj) return;
              
              // Check if this is a product
              if (obj['@type'] === 'Product' && obj.name) {
                candidateProducts.push(obj.name);
              }
              
              // Check for product offers
              if (obj.offers && Array.isArray(obj.offers)) {
                obj.offers.forEach((offer: any) => {
                  if (offer.itemOffered && offer.itemOffered.name) {
                    candidateProducts.push(offer.itemOffered.name);
                  }
                });
              }
              
              // Recursively check all object properties
              if (typeof obj === 'object') {
                Object.values(obj).forEach(value => {
                  if (typeof value === 'object') {
                    extractProductNames(value);
                  }
                });
              }
            };
            
            extractProductNames(schemaData);
          } catch (e) {
            // Ignore JSON parsing errors
          }
        });
      }
      
      // Look for products in META tags
      const metaMatches = html.match(/<meta[^>]*content="([^"]*)"[^>]*>/gi);
      if (metaMatches) {
        metaMatches.forEach(meta => {
          const nameMatch = meta.match(/name="([^"]*)"/i);
          const contentMatch = meta.match(/content="([^"]*)"/i);
          
          if (nameMatch && contentMatch && 
             (nameMatch[1].includes('product') || nameMatch[1].includes('og:title'))) {
            const content = contentMatch[1].trim();
            if (content.length > 0 && !this.isInvalidProductName(content)) {
              candidateProducts.push(content);
            }
          }
        });
      }
      
      // Deduplicate and filter candidates
      const uniqueProducts = [...new Set(candidateProducts)]
        .filter(product => 
          product.length >= 3 && 
          !this.isInvalidProductName(product) && 
          !this.isLikelyNavigationElement(product)
        )
        .slice(0, 15); // Limit to 15 products to avoid overwhelming results
      
      return uniqueProducts;
    } catch (error) {
      console.error('Error extracting products from HTML:', error);
      return [];
    }
  }

  /**
   * Fetch basic HTML content as a final fallback using plain https/http module
   * Used when both Axios and Puppeteer fail
   * 
   * @param url - The URL to get content from
   * @returns HTML content of the website
   */
  private async fetchBasicHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.info(`Attempting basic HTML fetch for ${url}`);
        
        // Determine if we need http or https module
        const isHttps = url.startsWith('https://');
        const httpModule = isHttps ? require('https') : require('http');
        
        // Parse the URL
        const parsedUrl = new URL(url);
        
        // Prepare the request options
        const options = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          timeout: 20000 // 20 seconds timeout
        };
        
        // Make the request
        const req = httpModule.request(options, (res: any) => {
          // Check for redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Handle redirect
            console.info(`Following redirect to ${res.headers.location}`);
            this.fetchBasicHtml(res.headers.location).then(resolve).catch(reject);
            return;
          }
          
          // Response data will be in chunks
          let data = '';
          
          // Collect data chunks
          res.on('data', (chunk: any) => {
            data += chunk;
          });
          
          // Handle end of response
          res.on('end', () => {
            if (data.length === 0) {
              reject(new Error('Received empty content'));
              return;
            }
            
            console.info(`Basic HTML fetch successful (${data.length} bytes)`);
            resolve(data);
          });
        });
        
        // Handle request errors
        req.on('error', (error: Error) => {
          console.error(`Basic HTML fetch error: ${error.message}`);
          reject(error);
        });
        
        // Handle timeout
        req.on('timeout', () => {
          console.error('Basic HTML fetch timed out');
          req.destroy();
          reject(new Error('Request timed out'));
        });
        
        // End the request
        req.end();
        
      } catch (error) {
        console.error(`Error in basic HTML fetch: ${error instanceof Error ? error.message : String(error)}`);
        reject(error);
      }
    });
  }

  /**
   * Infer business type from URL and domain
   */
  private inferBusinessTypeFromURL(url: string): string {
    try {
      const domain = new URL(url).hostname;
      
      // Check for common TLDs that indicate business type
      if (domain.endsWith('.shop') || domain.includes('shop')) {
        return 'Retail / E-commerce';
      }
      if (domain.endsWith('.store') || domain.includes('store')) {
        return 'Retail / E-commerce';
      }
      if (domain.includes('food') || domain.includes('restaurant') || domain.includes('cafe')) {
        return 'Food & Beverage';
      }
      if (domain.includes('tech') || domain.includes('software') || domain.includes('app')) {
        return 'Technology';
      }
      if (domain.includes('travel') || domain.includes('tour') || domain.includes('vacation')) {
        return 'Travel & Tourism';
      }
      if (domain.includes('health') || domain.includes('medical') || domain.includes('care')) {
        return 'Healthcare';
      }
      
      return 'General Business';
    } catch {
      return 'General Business';
    }
  }

  private async waitForPageLoad(page: Page): Promise<void> {
    // Wait for network activity to settle
    await page.waitForSelector('body');
    // Add a small delay for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Generate a hash from a string for use as a cache key
   * 
   * @param text - The text to hash
   * @returns A hash string
   */
  private generateHashFromText(text: string): string {
    // Simple hash function for strings
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  async extractContent(html: string, url: string): Promise<WebsiteContent> {
    const systemContent = `You are an assistant that analyzes product specification webpages. 
    Your task is to extract relevant product information such as product details, features, technical specifications, 
    and any other important information. Respond with only the extracted specifications in a clear, structured format.`;
    
    const prompt = `Extract product specifications from the following webpage HTML content. 
    URL: ${url}
    
    HTML:
    ${html.substring(0, 8000)} 
    ${html.length > 8000 ? '[HTML truncated due to length]' : ''}
    
    Please extract and organize the product details, specifications, and any other relevant information. 
    Format the response clearly with appropriate headers.`;
    
    try {
      const result = await this.callAI(prompt, systemContent);
      
      return {
        title: this.extractTitle(result) || 'Unknown Product',
        description: this.extractDescription(result) || 'No description available',
        specifications: this.extractSpecifications(result),
        error: null
      };
    } catch (error: any) {
      console.error('Error extracting content:', error);
      
      return {
        title: 'Error',
        description: '',
        specifications: {},
        error: error.message || 'Unknown error occurred'
      };
    }
  }
  
  private extractTitle(content: string): string {
    // Extract title from the content
    const titleMatch = content.match(/^#\s+(.+)$|^(.+?)\n+|Title:?\s*(.+)$/im);
    return titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim() : '';
  }
  
  private extractDescription(content: string): string {
    // Extract description from the content
    const descriptionMatch = content.match(/^##\s*Description:?\s*\n+(.+)$|Description:?\s*(.+)$/im);
    if (descriptionMatch) {
      return (descriptionMatch[1] || descriptionMatch[2]).trim();
    }
    
    // Try to find a description-like paragraph
    const lines = content.split('\n');
    for (let i = 1; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && line.length > 50) {
        return line;
      }
    }
    
    return '';
  }
  
  private extractSpecifications(content: string): Record<string, string> {
    const specs: Record<string, string> = {};
    const lines = content.split('\n');
    
    let currentSection = 'General';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for a section header
      const sectionMatch = trimmedLine.match(/^#+\s+(.+?)(?::|\s*$)/);
      if (sectionMatch && !trimmedLine.toLowerCase().includes('description')) {
        currentSection = sectionMatch[1].trim();
        continue;
      }
      
      // Check for key-value pairs (Example: "Weight: 500g" or "Resolution - 1920x1080")
      const keyValueMatch = trimmedLine.match(/^([^:]+?)[\s-]*[:]\s*(.+)$/);
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();
        
        if (key && value) {
          specs[key] = value;
        }
      }
    }
    
    return specs;
  }
} 