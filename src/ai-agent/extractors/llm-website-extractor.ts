/**
 * LLM-Website Extractor
 * 
 * This class implements an LLM-first approach to extracting business information
 * and products from websites. It sends the entire HTML content to an LLM with
 * specific prompts designed to extract only legitimate business information
 * while ignoring navigation and UI elements.
 */

import puppeteer, { Browser } from 'puppeteer';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { 
  ExtractionResult, 
  ExtractedEntity, 
  EntityType 
} from '@/types/extraction';

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

interface AIModelResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class LLMWebsiteExtractor {
  private browser: Browser | null = null;
  private config: LLMWebsiteExtractorConfig;
  
  /**
   * Initialize the LLM-first website extractor
   */
  constructor(config?: Partial<LLMWebsiteExtractorConfig>) {
    // Debug logs for environment variables
    logger.info(`OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
    logger.info(`AI_MODEL_URL: ${process.env.AI_MODEL_URL || 'not set'}`);
    logger.info(`AI_MODEL_NAME: ${process.env.AI_MODEL_NAME || 'not set'}`);
    
    // Default configuration
    this.config = {
      aiModel: {
        apiKey: process.env.OPENAI_API_KEY || '',
        url: process.env.AI_MODEL_URL || 'https://api.openai.com/v1/chat/completions',
        model: process.env.AI_MODEL_NAME || 'gpt-4',
        maxTokens: parseInt(process.env.AI_MODEL_MAX_TOKENS || '4000')
      },
      perplexityAI: {
        apiKey: process.env.PERPLEXITY_API_KEY || '',
        url: process.env.PERPLEXITY_URL || 'https://api.perplexity.ai/v1/chat/completions',
        model: process.env.PERPLEXITY_MODEL || 'sonar-medium-online'
      },
      mcpConfig: {
        complianceMcpUrl: process.env.COMPLIANCE_MCP_URL || 'http://localhost:3001/api/compliance',
        marketIntelligenceMcpUrl: process.env.MARKET_INTELLIGENCE_MCP_URL || 'http://localhost:3002/api/market-intelligence',
        enableCrossReferencing: process.env.ENABLE_CROSS_REFERENCING === 'true'
      },
      ...config
    };
    
    // Log API key configuration
    const hasOpenAI = !!this.config.aiModel.apiKey;
    const hasPerplexity = !!this.config.perplexityAI?.apiKey;
    
    logger.info(`LLM-Website Extractor initialized with API keys - OpenAI: ${hasOpenAI ? 'YES' : 'NO'}, Perplexity: ${hasPerplexity ? 'YES' : 'NO'}`);
    logger.info(`Initialized LLMWebsiteExtractor with model: ${this.config.aiModel.model}`);
    logger.info(`API URL: ${this.config.aiModel.url}`);
    
    // Validate API key format and URL compatibility
    const isChatGPTKey = this.config.aiModel.apiKey.startsWith('sk-proj-');
    const isChatGPTUrl = this.config.aiModel.url.includes('api.chatgpt.com');
    
    if (isChatGPTKey && !isChatGPTUrl) {
      logger.warn('ChatGPT API key detected but URL is not set to api.chatgpt.com. This will be corrected at runtime.');
    } else if (!isChatGPTKey && isChatGPTUrl) {
      logger.warn('URL is set to ChatGPT API but key does not match ChatGPT format (sk-proj-). This might cause authentication errors.');
    }
  }
  
  /**
   * Extract business and product information from a website using LLM-first approach
   * 
   * @param url - The URL of the website to extract information from
   * @returns An extraction result containing the extracted entities and metadata
   */
  public async extract(url: string): Promise<ExtractionResult> {
    logger.info(`Starting LLM-first extraction for URL: ${url}`);
    
    const startTime = Date.now();
    let htmlContent = '';
    let extractionAttempts = 0;
    const maxAttempts = 3;
    
    try {
      // First try to fetch content using simpler, more reliable methods before Puppeteer
      logger.info(`Attempting to fetch content from ${url} using direct HTTP request`);
      
      try {
        // Try direct HTTP request first (faster and more reliable for many sites)
        htmlContent = await this.fetchContentWithAxios(url);
        logger.info(`Successfully fetched content with direct HTTP request (${htmlContent.length} bytes)`);
      } catch (axiosError) {
        logger.warn(`Direct HTTP request failed: ${axiosError instanceof Error ? axiosError.message : String(axiosError)}`);
        
        // If direct request fails, try with Puppeteer as a fallback
        logger.info(`Falling back to Puppeteer for content extraction`);
        
        // Initialize browser for headless scraping with retry logic
        while (extractionAttempts < maxAttempts) {
          try {
            this.browser = await puppeteer.launch({
              headless: 'new',
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--disable-extensions',
                '--disable-gpu'
              ],
              timeout: 60000, // Increase timeout to 60 seconds
              ignoreHTTPSErrors: true
            });
            
            // Get the HTML content from the website
            htmlContent = await this.getWebsiteContent(url);
            break; // Success - exit retry loop
            
          } catch (error) {
            extractionAttempts++;
            
            // Improved error logging with proper serialization
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              errorMessage = `${error.name}: ${error.message}`;
              if (error.stack) {
                logger.debug(`Stack trace: ${error.stack}`);
              }
            } else if (error && typeof error === 'object') {
              try {
                errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
              } catch (e) {
                errorMessage = 'Error object could not be stringified';
              }
            } else if (error !== undefined && error !== null) {
              errorMessage = String(error);
            }
            
            logger.warn(`Puppeteer attempt ${extractionAttempts} failed: ${errorMessage}`);
            
            if (this.browser) {
              await this.browser.close().catch(closeError => {
                logger.error(`Error closing browser: ${closeError}`);
              });
              this.browser = null;
            }
            
            if (extractionAttempts === maxAttempts) {
              logger.warn(`Failed to extract content after ${maxAttempts} Puppeteer attempts, trying basic HTML fetching as final fallback`);
              
              try {
                // Try basic HTML fetching as a final fallback
                htmlContent = await this.fetchBasicHtml(url);
                logger.info(`Successfully fetched content with basic HTML fallback (${htmlContent.length} bytes)`);
              } catch (fallbackError) {
                logger.error(`Basic HTML fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                throw new Error(`All content extraction methods failed: ${errorMessage}`);
              }
            } else {
              // Wait before retrying with exponential backoff
              const backoffTime = 2000 * Math.pow(2, extractionAttempts - 1);
              logger.info(`Waiting ${backoffTime}ms before retry ${extractionAttempts + 1}...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
          }
        }
      }
      
      // Extract all entities directly using the LLM
      let extractedEntities = await this.extractEntitiesWithLLM(htmlContent, url);
      
      // If no products found, try partial extraction
      if (!extractedEntities.some(entity => entity.type === 'product')) {
        logger.info('No products found in primary extraction, attempting partial extraction');
        const partialEntities = await this.extractPartialData(htmlContent, url);
        if (partialEntities.length > 0) {
          extractedEntities = [...extractedEntities, ...partialEntities];
        }
      }
      
      // Validate with Perplexity AI if configured
      if (this.config.perplexityAI?.apiKey) {
        extractedEntities = await this.validateWithPerplexity(extractedEntities, htmlContent, url);
      }
      
      // Enrich extracted data with MCP Layer
      const enrichedEntities = await this.enrichWithMCPLayer(extractedEntities, url);
      
      const processingTime = Date.now() - startTime;
      
      // Return success even with no products, but include quality metrics
      return {
        id: this.generateExtractionId(),
        sourceUrl: url,
        sourceType: 'website',
        rawContent: htmlContent,
        extractedEntities: enrichedEntities,
        confidence: this.calculateOverallConfidence(enrichedEntities),
        processingTime,
        status: enrichedEntities.length > 0 ? 'completed' : 'partial',
        qualityMetrics: {
          extractionAttempts,
          hasProducts: enrichedEntities.some(e => e.type === 'product'),
          hasBusiness: enrichedEntities.some(e => e.type === 'business'),
          partialExtraction: enrichedEntities.some(e => e.attributes?.partialExtraction)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
    } catch (error) {
      logger.error(`Error in LLM-first extraction from URL ${url}:`, error);
      const errorMessage = this.getErrorMessage(error);
      
      // Try partial extraction even on error
      let partialEntities: ExtractedEntity[] = [];
      if (htmlContent) {
        try {
          partialEntities = await this.extractPartialData(htmlContent, url);
        } catch (partialError) {
          logger.error('Failed partial extraction attempt:', partialError);
        }
      }
      
      return {
        id: this.generateExtractionId(),
        sourceUrl: url,
        sourceType: 'website',
        rawContent: htmlContent,
        extractedEntities: partialEntities,
        confidence: partialEntities.length > 0 ? 0.3 : 0,
        processingTime: Date.now() - startTime,
        status: partialEntities.length > 0 ? 'partial' : 'failed',
        error: errorMessage,
        qualityMetrics: {
          extractionAttempts,
          hasProducts: partialEntities.some(e => e.type === 'product'),
          hasBusiness: partialEntities.some(e => e.type === 'business'),
          partialExtraction: true,
          errorType: error instanceof Error ? error.name : 'Unknown'
        },
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
        logger.warn(`Unexpected content type: ${contentType}, proceeding anyway`);
      }
      
      // Ensure the response data is a string
      const htmlContent = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
      
      return htmlContent;
    } catch (error) {
      logger.error(`Error in HTTP fetch: ${error instanceof Error ? error.message : String(error)}`);
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
      logger.info(`Navigating to ${url}...`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Wait for content to load
      logger.info('Waiting for content to load...');
      await page.waitForTimeout(3000);
      
      // Get the page content
      logger.info('Getting page content...');
      const content = await page.content();
      
      if (!content || content.trim().length === 0) {
        throw new Error('Received empty content from page');
      }
      
      logger.info(`Successfully retrieved content (${content.length} bytes)`);
      
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error getting website content: ${errorMessage}`);
      
      // Try to get whatever content is available even if navigation failed
      try {
        const partialContent = await page.content();
        if (partialContent && partialContent.trim().length > 0) {
          logger.info(`Retrieved partial content (${partialContent.length} bytes)`);
          return partialContent;
        }
      } catch (secondaryError) {
        logger.error(`Failed to get partial content: ${secondaryError}`);
      }
      
      throw error; // Re-throw the original error
    } finally {
      await page.close().catch(e => logger.error(`Error closing page: ${e}`));
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
    const response = await this.callAIModel(prompt);
    
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
   * Parse the extraction response from the AI model
   * 
   * @param response - The AI model response
   * @param sourceUrl - The source URL
   * @returns Extracted entities
   */
  private parseExtractionResponse(response: string, sourceUrl: string): ExtractedEntity[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in extraction response, attempting to extract partial data');
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
          
          logger.info(`Created business entity from URL: ${businessName}`);
        } catch (urlError) {
          logger.error(`Error creating business entity from URL: ${urlError}`);
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
              logger.info(`Filtering out likely navigation element: ${product.name}`);
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
      logger.error(`Error parsing extraction response: ${error}`);
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
   * Call AI model with a prompt
   * 
   * @param prompt - The prompt to send to the AI model
   * @returns The AI model response
   */
  private async callAIModel(prompt: string): Promise<string> {
    try {
      if (!this.config.aiModel.apiKey) {
        throw new Error('AI model API key is not configured');
      }
      
      // Log API key info without exposing full key
      const apiKeyPrefix = this.config.aiModel.apiKey.substring(0, 10);
      const apiKeySuffix = this.config.aiModel.apiKey.substring(this.config.aiModel.apiKey.length - 4);
      logger.info(`Using API key ${apiKeyPrefix}...${apiKeySuffix} for model ${this.config.aiModel.model}`);
      
      // Determine if this is an OpenAI Project API key
      const isProjectKey = this.config.aiModel.apiKey.startsWith('sk-proj-');
      
      // Always use the standard OpenAI API endpoint
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      logger.info(`Using OpenAI API endpoint: ${apiUrl}`);
      
      // For Project API keys, we use a different authentication header format
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (isProjectKey) {
        // For Project API keys
        headers['OpenAI-Project-Key'] = this.config.aiModel.apiKey;
        logger.info('Using OpenAI Project API authentication');
      } else {
        // For standard API keys
        headers['Authorization'] = `Bearer ${this.config.aiModel.apiKey}`;
        logger.info('Using standard OpenAI API authentication');
      }
      
      const response = await axios.post<AIModelResponse>(
        apiUrl,
        {
          model: this.config.aiModel.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.aiModel.maxTokens,
          temperature: 0.1,
        },
        { headers }
      );
      
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid response format from AI model');
      }
      
      return content;
    } catch (error) {
      // Enhanced error logging
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as any;
        logger.error(`API request failed: ${axiosError.message}`);
        if (axiosError.response) {
          logger.error(`Status: ${axiosError.response.status}`);
          logger.error(`Response data: ${JSON.stringify(axiosError.response.data || {})}`);
        }
        logger.error(`Request URL: ${axiosError.config?.url}`);
        logger.error(`Request headers: ${JSON.stringify(axiosError.config?.headers)}`);
        
        // Try an alternative authentication approach if the first one fails
        const isProjectKey = this.config.aiModel.apiKey.startsWith('sk-proj-');
        if (axiosError.response?.status === 401 && isProjectKey) {
          try {
            logger.info('First authentication attempt failed. Trying alternative Project API authentication...');
            
            // Try with a different header format
            const altHeaders = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.config.aiModel.apiKey}`
            };
            
            const apiUrl = 'https://api.openai.com/v1/chat/completions';
            const retryResponse = await axios.post<AIModelResponse>(
              apiUrl,
              {
                model: this.config.aiModel.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: this.config.aiModel.maxTokens,
                temperature: 0.1,
              },
              { headers: altHeaders }
            );
            
            const retryContent = retryResponse.data?.choices?.[0]?.message?.content;
            if (!retryContent) {
              throw new Error('Invalid response format from retry attempt');
            }
            
            logger.info('Alternative authentication successful');
            return retryContent;
          } catch (retryError: any) {
            logger.error('Alternative authentication also failed');
            if (retryError && typeof retryError === 'object' && 'isAxiosError' in retryError) {
              logger.error(`Retry Status: ${retryError.response?.status}`);
              logger.error(`Retry Response data: ${JSON.stringify(retryError.response?.data || {})}`);
            }
          }
        }
      } else {
        logger.error(`Non-Axios error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Fall back to HTML-based extraction if all API calls fail
      logger.warn('All API attempts failed, falling back to HTML-based extraction');
      throw new Error(`Failed to call AI model: ${error instanceof Error ? error.message : String(error)}`);
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
   * 
   * @param entities - Entities extracted by the primary LLM
   * @param html - Original HTML content
   * @param sourceUrl - The source URL
   * @returns Validated entities
   */
  private async validateWithPerplexity(entities: ExtractedEntity[], html: string, sourceUrl: string): Promise<ExtractedEntity[]> {
    try {
      logger.info(`Validating extracted data with Perplexity AI for ${sourceUrl}`);
      
      // Extract product entities for focused validation
      const productEntities = entities.filter(entity => entity.type === 'product');
      const businessEntities = entities.filter(entity => entity.type === 'business');
      
      // Skip validation if no products or business entities found
      if (productEntities.length === 0 && businessEntities.length === 0) {
        return entities;
      }
      
      // Build validation prompt
      const validationPrompt = this.buildPerplexityValidationPrompt(entities, sourceUrl);
      
      // Call Perplexity AI for validation
      const validationResponse = await this.callPerplexityAI(validationPrompt);
      
      // Parse validation response and update entities
      return this.processPerplexityValidation(entities, validationResponse);
    } catch (error) {
      logger.warn(`Error validating with Perplexity AI: ${error}`);
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
      const jsonMatch = validationResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in Perplexity validation response');
        return entities;
      }
      
      const validationData = JSON.parse(jsonMatch[0]);
      const updatedEntities = [...entities];
      
      // Update product entities if validations exist
      if (validationData.productValidations && Array.isArray(validationData.productValidations)) {
        const productEntities = updatedEntities.filter(entity => entity.type === 'product');
        
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
            product.confidence = webPresenceScore + marketDataScore + industryStandardScore;
            
            // Update name if correction provided and valid
            if (validation.correctedName && validation.isValid) {
              product.name = validation.correctedName;
              product.value = validation.correctedName;
            }
            
            // Instead of removing invalid products, mark them as low confidence
            product.verified = validation.isValid;
            if (!validation.isValid) {
              product.attributes.lowConfidence = true;
              product.attributes.validationWarning = validation.notes || 'Low confidence in product validation';
            }
            
            // Add validation notes and market data
            product.attributes.validationNotes = validation.notes;
            product.attributes.marketPresence = validation.marketPresence;
            product.attributes.competitorProducts = validation.competitorProducts;
          }
        });
      }
      
      // Keep all products but mark unverified ones as low confidence
      logger.info(`Processed ${updatedEntities.length} products with Perplexity validation`);
      
      return updatedEntities;
      
    } catch (error) {
      logger.error(`Error processing Perplexity validation: ${error}`);
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
      
      logger.info('Calling Perplexity API for validation');
      
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
      
      logger.info('Successfully received Perplexity API response');
      
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
      logger.error(`Error calling Perplexity AI: ${error.message || String(error)}`);
      
      // Check if it's an axios error with response
      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data || {})}`);
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
      logger.info(`Enriching extracted data from ${sourceUrl} with MCP Layer`);
      
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
      logger.warn(`Error enriching data with MCP Layer: ${error}`);
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
      logger.info('Performing cross-reference validation between MCP data sources');
      
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
          logger.warn(`Inconsistency detected for product ${product.name}: HS code ${hsCode} doesn't match category ${marketCategory}`);
          
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
      logger.warn(`Error in MCP cross-reference validation: ${error}`);
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
        logger.warn('Compliance MCP URL not configured');
        return;
      }

      logger.info('Enriching products with Compliance MCP');

      for (const product of products) {
        try {
          const response = await axios.post<ComplianceMCPResponse>(
            this.config.mcpConfig.complianceMcpUrl,
            {
              productName: product.name,
              description: product.attributes.description,
              category: product.attributes.category,
              productType: product.attributes.productType,
              keywords: product.attributes.keywords
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

          logger.info(`Enriched product ${product.name} with HS code ${data.hsCode}`);
        } catch (error) {
          logger.error(`Error enriching product ${product.name} with Compliance MCP: ${error}`);
        }
      }
    } catch (error) {
      logger.error(`Error in Compliance MCP enrichment: ${error}`);
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
        logger.warn('Market Intelligence MCP URL not configured');
        return;
      }

      logger.info('Enriching products with Market Intelligence MCP');

      for (const product of products) {
        try {
          const response = await axios.post<MarketIntelligenceMCPResponse>(
            this.config.mcpConfig.marketIntelligenceMcpUrl,
            {
              productName: product.name,
              description: product.attributes.description,
              category: product.attributes.category,
              productType: product.attributes.productType,
              keywords: product.attributes.keywords,
              hsCode: product.attributes.hsCode // Use HS code if available from Compliance MCP
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

          logger.info(`Enriched product ${product.name} with market data`);
        } catch (error) {
          logger.error(`Error enriching product ${product.name} with Market Intelligence MCP: ${error}`);
        }
      }
    } catch (error) {
      logger.error(`Error in Market Intelligence MCP enrichment: ${error}`);
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
        
        logger.info(`Created business entity from URL in partial extraction: ${businessName}`);
      } catch (urlError) {
        logger.error(`Error creating business entity from URL in partial extraction: ${urlError}`);
      }

      // Extract products from HTML content
      if (response.includes('<') && response.includes('>')) {
        try {
          const extractedProducts = this.extractProductsFromHTML(response);
          logger.info(`Extracted ${extractedProducts.length} potential products in partial mode`);
          
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
          logger.error(`Error extracting products from HTML: ${error}`);
        }
      }
      
      // Log extraction quality
      const businessCount = entities.filter(e => e.type === 'business').length;
      const productCount = entities.filter(e => e.type === 'product').length;
      const contactCount = entities.filter(e => e.type === 'contact').length;
      logger.info(`Extraction quality: Business: ${businessCount > 0}, Products: ${productCount}, Contacts: ${contactCount}`);
      
    } catch (error) {
      logger.error('Error in partial data extraction:', error);
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
      logger.error('Error extracting products from HTML:', error);
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
        logger.info(`Attempting basic HTML fetch for ${url}`);
        
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
            logger.info(`Following redirect to ${res.headers.location}`);
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
            
            logger.info(`Basic HTML fetch successful (${data.length} bytes)`);
            resolve(data);
          });
        });
        
        // Handle request errors
        req.on('error', (error: Error) => {
          logger.error(`Basic HTML fetch error: ${error.message}`);
          reject(error);
        });
        
        // Handle timeout
        req.on('timeout', () => {
          logger.error('Basic HTML fetch timed out');
          req.destroy();
          reject(new Error('Request timed out'));
        });
        
        // End the request
        req.end();
        
      } catch (error) {
        logger.error(`Error in basic HTML fetch: ${error instanceof Error ? error.message : String(error)}`);
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
} 