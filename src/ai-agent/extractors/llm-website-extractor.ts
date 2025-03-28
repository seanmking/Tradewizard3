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
    model: string;
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

export class LLMWebsiteExtractor {
  private browser: Browser | null = null;
  private config: LLMWebsiteExtractorConfig;
  
  /**
   * Initialize the LLM-first website extractor
   */
  constructor(config?: Partial<LLMWebsiteExtractorConfig>) {
    // Default configuration
    this.config = {
      aiModel: {
        apiKey: process.env.AI_MODEL_API_KEY || '',
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
    
    try {
      // Initialize browser for headless scraping
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Get the HTML content from the website
      const htmlContent = await this.getWebsiteContent(url);
      
      // Extract all entities directly using the LLM
      let extractedEntities = await this.extractEntitiesWithLLM(htmlContent, url);
      
      // Validate with Perplexity AI if configured
      if (this.config.perplexityAI?.apiKey) {
        extractedEntities = await this.validateWithPerplexity(extractedEntities, htmlContent, url);
      }
      
      // Enrich extracted data with MCP Layer
      const enrichedEntities = await this.enrichWithMCPLayer(extractedEntities, url);
      
      const processingTime = Date.now() - startTime;
      
      return {
        id: this.generateExtractionId(),
        sourceUrl: url,
        sourceType: 'website',
        rawContent: htmlContent,
        extractedEntities: enrichedEntities,
        confidence: this.calculateOverallConfidence(enrichedEntities),
        processingTime,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error in LLM-first extraction from URL ${url}: ${error}`);
      return {
        id: this.generateExtractionId(),
        sourceUrl: url,
        sourceType: 'website',
        rawContent: '',
        extractedEntities: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        status: 'failed',
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
   * Get the website content using Puppeteer
   * 
   * @param url - The URL to get content from
   * @returns HTML content of the website
   */
  private async getWebsiteContent(url: string): Promise<string> {
    const page = await this.browser!.newPage();
    
    // Set a reasonable timeout and viewport
    await page.setDefaultNavigationTimeout(30000);
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for content to load (additional waiting to ensure JavaScript execution)
    await page.waitForTimeout(2000);
    
    // Get the page content
    const content = await page.content();
    
    await page.close();
    
    return content;
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
      - Focus ONLY on actual business information and REAL products/services
      - CRITICALLY IMPORTANT: Ignore navigation elements, menu items, UI components, and generic website text
      - DO NOT include website section headers or navigational links as products
      - Only extract products that the business actually sells or manufactures
      - For each entity extracted, provide a confidence level (0-1)
      - For products, extract as much detail as possible to help the MCPs
      - If you find potential product categories but not specific products, note them for MCP analysis
      - Flag any information that might need MCP enrichment with a "needsMCPEnrichment": true property
      
      WHAT TO EXCLUDE:
      - Do NOT extract menu items or navigation elements like "Home", "About Us", "Contact", etc.
      - Do NOT include page section titles as products
      - Do NOT include generic service descriptions unless they're specific offerings
      - Exclude any items that are clearly UI elements rather than actual products
      - If you're unsure if something is a real product, assign a lower confidence score (<0.6)
      
      WEBSITE URL: ${sourceUrl}
      
      WEBSITE CONTENT:
      ${textContent}
      
      EXTRACT THE FOLLOWING AND RETURN AS JSON:
      1. Business Information: Name, description, type, years in operation
      2. Location Information: Address, city, province, country, postal code
      3. Contact Information: Phone numbers, email addresses, website
      4. Social Media: Platform names and URLs
      5. Products/Services: Name, description, price, category, specifications
         - Include "productType" and "keywords" fields to help MCPs classify products
         - Note potential HS code categories if you can recognize them
      
      RETURN A JSON OBJECT WITH THIS EXACT STRUCTURE:
      {
        "business": {
          "name": {"value": "", "confidence": 0.0},
          "description": {"value": "", "confidence": 0.0},
          "businessType": {"value": "", "confidence": 0.0},
          "yearsInOperation": {"value": "", "confidence": 0.0},
          "needsMCPEnrichment": true/false
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
            "description": "",
            "price": "",
            "category": "",
            "productType": "",  // High-level type (electronics, textile, food, etc.)
            "keywords": [],     // Keywords for MCP classification
            "potentialHSCode": "", // If you can guess a potential HS code category
            "specifications": {},
            "confidence": 0.0,
            "url": "",
            "needsMCPEnrichment": true/false,
            "mcpEnrichmentNotes": "" // Any specific notes for MCPs (e.g., "Appears to be an electronic device that may require certifications")
          }
        ],
        "mcpEnrichmentFlags": {
          "needsComplianceData": true/false,
          "needsMarketIntelligence": true/false,
          "priorityProducts": [0, 1] // Indices of products that should be prioritized for MCP enrichment
        }
      }
      
      Only include information that is clearly stated on the website. ONLY include products that you are highly confident are real products that the business sells, not website navigation or UI elements. Do not include any field if you're not confident in the extraction.
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
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in extraction response');
        return [];
      }
      
      const data = JSON.parse(jsonMatch[0]) as Record<string, any>;
      const entities: ExtractedEntity[] = [];
      const confidenceThreshold = 0.6; // Minimum confidence to include an entity
      const productConfidenceThreshold = 0.75; // Higher threshold for products to filter out navigation elements
      
      // Process business entity
      if (data.business && data.business.name && 
          data.business.name.value && 
          data.business.name.confidence >= confidenceThreshold) {
        entities.push({
          id: this.generateEntityId(),
          type: 'business',
          name: data.business.name.value,
          value: data.business.name.value,
          confidence: data.business.name.confidence,
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
   * 
   * @param name - The name to check
   * @returns Whether the name is likely a navigation element
   */
  private isLikelyNavigationElement(name: string): boolean {
    // Common navigation element patterns
    const navigationPatterns = [
      /^home$/i, 
      /^about(?: us)?$/i, 
      /^contact(?: us)?$/i,
      /^shop$/i,
      /^cart$/i,
      /^account$/i,
      /^login$/i,
      /^register$/i,
      /^blog$/i,
      /^faq$/i,
      /^support$/i,
      /^search$/i,
      /^menu$/i,
      /^categories$/i,
      /^products$/i,
      /^services$/i,
      /^page \d+$/i,
      /^next$/i,
      /^previous$/i,
      /^sitemap$/i
    ];
    
    // Check against common navigation patterns
    if (navigationPatterns.some(pattern => pattern.test(name.trim()))) {
      return true;
    }
    
    // Check for very short names (less than 3 characters)
    if (name.trim().length < 3) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Call AI model with a prompt
   * 
   * @param prompt - The prompt to send to the AI model
   * @returns The AI model response
   */
  private async callAIModel(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.config.aiModel.url,
        {
          model: this.config.aiModel.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.aiModel.maxTokens,
          temperature: 0.1, // Low temperature for more deterministic outputs
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.aiModel.apiKey}`
          }
        }
      );
      
      // Type assertion for response data
      const responseData = response.data as any;
      return responseData.choices[0].message.content;
    } catch (error) {
      logger.error(`Error calling AI model: ${error}`);
      throw new Error(`AI model call failed: ${error}`);
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
    // Extract business and product information for validation
    const businessEntity = entities.find(entity => entity.type === 'business');
    const productEntities = entities.filter(entity => entity.type === 'product');
    
    // Build the prompt
    let prompt = `
      I need you to validate information extracted from this website: ${sourceUrl}
      
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
      
      VALIDATION TASK:
      1. Verify if the business information is accurate based on your knowledge
      2. CRITICAL: For each product, determine if it's genuinely a real product this business sells (not a UI element, navigation item, or website section)
      3. Set isValid = false for any items that are navigation elements (like "Home", "About Us"), UI components, or generic website sections
      4. For each entity, provide a confidence score (0-1) about the accuracy of the extraction
      
      RESPOND IN THIS EXACT JSON FORMAT:
      {
        "businessValidation": {
          "isValid": true/false,
          "correctedName": "Business Name",
          "confidence": 0.0,
          "notes": "Any validation notes"
        },
        "productValidations": [
          {
            "index": 0,
            "isValid": true/false, 
            "correctedName": "Product Name",
            "confidence": 0.0,
            "notes": "Any validation notes"
          },
          ...
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
      // Extract JSON from response
      const jsonMatch = validationResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in Perplexity validation response');
        return entities;
      }
      
      const validationData = JSON.parse(jsonMatch[0]);
      const updatedEntities = [...entities];
      
      // Update business entity if validation exists
      if (validationData.businessValidation) {
        const businessEntity = updatedEntities.find(entity => entity.type === 'business');
        if (businessEntity) {
          // Update confidence based on validation
          businessEntity.confidence = 
            (businessEntity.confidence * 0.5) + (validationData.businessValidation.confidence * 0.5);
          
          // Update name if correction provided and valid
          if (validationData.businessValidation.correctedName && 
              validationData.businessValidation.isValid) {
            businessEntity.name = validationData.businessValidation.correctedName;
            businessEntity.value = validationData.businessValidation.correctedName;
          }
          
          // Update verified status
          businessEntity.verified = validationData.businessValidation.isValid;
          
          // Add validation notes
          businessEntity.attributes.validationNotes = validationData.businessValidation.notes;
        }
      }
      
      // Update product entities if validations exist
      if (validationData.productValidations && Array.isArray(validationData.productValidations)) {
        // Get product entities
        const productEntities = updatedEntities.filter(entity => entity.type === 'product');
        
        // Process each validation
        validationData.productValidations.forEach((validation: { 
          index: number; 
          isValid: boolean; 
          correctedName?: string; 
          confidence: number;
          notes?: string;
        }) => {
          const index = validation.index;
          if (index >= 0 && index < productEntities.length) {
            const product = productEntities[index];
            
            // Update confidence
            product.confidence = (product.confidence * 0.5) + (validation.confidence * 0.5);
            
            // Update name if correction provided and valid
            if (validation.correctedName && validation.isValid) {
              product.name = validation.correctedName;
              product.value = validation.correctedName;
            }
            
            // Update verified status
            product.verified = validation.isValid;
            
            // Add validation notes
            product.attributes.validationNotes = validation.notes;
          }
        });
      }
      
      // Remove products that were marked as invalid by Perplexity
      const filteredEntities = updatedEntities.filter(entity => {
        if (entity.type === 'product' && entity.verified === false) {
          logger.info(`Removing invalid product: ${entity.name}`);
          return false;
        }
        return true;
      });
      
      logger.info(`Removed ${updatedEntities.length - filteredEntities.length} invalid products after Perplexity validation`);
      
      return filteredEntities;
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
        this.config.perplexityAI.url || 'https://api.perplexity.ai/v1/chat/completions',
        {
          model: this.config.perplexityAI.model || 'sonar-medium-online',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
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
   * @param productEntities - Product entities to enrich
   */
  private async enrichWithComplianceMCP(productEntities: ExtractedEntity[]): Promise<void> {
    try {
      for (const product of productEntities) {
        // Skip products with insufficient information
        if (!product.name) continue;
        
        // Prepare inputs for Compliance MCP
        const complianceInput = {
          productName: product.name,
          description: product.attributes.description || '',
          category: product.attributes.category || '',
          productType: product.attributes.productType || '',
          keywords: product.attributes.keywords || [],
          potentialHSCode: product.attributes.potentialHSCode || ''
        };
        
        // Call Compliance MCP to get compliance data
        const complianceData = await this.callComplianceMCP(complianceInput);
        
        // Enrich product attributes with compliance data
        if (complianceData) {
          // Add compliance data to product attributes
          product.attributes = {
            ...product.attributes,
            hsCode: complianceData.hsCode || '',
            requiredDocuments: complianceData.requiredDocuments || [],
            tariffRates: complianceData.tariffRates || {},
            regulatoryNotes: complianceData.regulatoryNotes || '',
            complianceSource: complianceData.source || 'Compliance MCP'
          };
          
          // Adjust confidence based on MCP data quality
          if (complianceData.confidence) {
            // Weighted average of original confidence and MCP confidence
            product.confidence = (product.confidence * 0.7) + (complianceData.confidence * 0.3);
          }
        }
      }
    } catch (error) {
      logger.warn(`Error enriching with Compliance MCP: ${error}`);
    }
  }
  
  /**
   * Enrich product entities with market intelligence
   * 
   * @param productEntities - Product entities to enrich
   */
  private async enrichWithMarketIntelligenceMCP(productEntities: ExtractedEntity[]): Promise<void> {
    try {
      for (const product of productEntities) {
        // Skip products with insufficient information
        if (!product.name) continue;
        
        // Prepare inputs for Market Intelligence MCP
        const marketInput = {
          productName: product.name,
          category: product.attributes.category || '',
          productType: product.attributes.productType || '',
          keywords: product.attributes.keywords || [],
          hsCode: product.attributes.hsCode || '',  // Use HS code if already enriched by Compliance MCP
          marketSizing: true,
          competitorAnalysis: true
        };
        
        // Call Market Intelligence MCP
        const marketData = await this.callMarketIntelligenceMCP(marketInput);
        
        // Enrich product attributes with market data
        if (marketData) {
          // Add market intelligence data to product attributes
          product.attributes = {
            ...product.attributes,
            marketSize: marketData.marketSize || '',
            growthRate: marketData.growthRate || '',
            topMarkets: marketData.topMarkets || [],
            competitorProfiles: marketData.competitorProfiles || [],
            demandTrends: marketData.demandTrends || [],
            marketCategory: marketData.category || '',
            marketSource: marketData.source || 'Market Intelligence MCP'
          };
          
          // Adjust confidence based on MCP data quality
          if (marketData.confidence) {
            // Weighted average of original confidence and MCP confidence
            product.confidence = (product.confidence * 0.7) + (marketData.confidence * 0.3);
          }
        }
      }
    } catch (error) {
      logger.warn(`Error enriching with Market Intelligence MCP: ${error}`);
    }
  }
  
  /**
   * Call the Compliance MCP to get regulatory and compliance data
   * 
   * @param input - Input for the Compliance MCP
   * @returns Compliance data or null if unavailable
   */
  private async callComplianceMCP(input: any): Promise<any> {
    try {
      const url = this.config.mcpConfig?.complianceMcpUrl || '';
      
      if (!url) {
        logger.warn('Compliance MCP URL not configured, using Perplexity fallback');
        return this.getComplianceDataWithPerplexity(input);
      }
      
      // Call the Compliance MCP API
      const response = await axios.post(url, input, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Safe type handling
      if (response.data && typeof response.data === 'object') {
        return response.data;
      }
      
      // If no valid data from MCP, use Perplexity as fallback
      logger.info('No valid data from Compliance MCP, using Perplexity fallback');
      return this.getComplianceDataWithPerplexity(input);
    } catch (error) {
      logger.error(`Error calling Compliance MCP: ${error}`);
      logger.info('Using Perplexity for compliance data due to MCP error');
      return this.getComplianceDataWithPerplexity(input);
    }
  }
  
  /**
   * Get compliance data using Perplexity AI as a fallback
   * 
   * @param input - Product information
   * @returns Compliance data from Perplexity
   */
  private async getComplianceDataWithPerplexity(input: any): Promise<any> {
    try {
      if (!this.config.perplexityAI?.apiKey) {
        logger.error('Perplexity API key not configured for compliance fallback');
        return null;
      }
      
      const prompt = `
        I need accurate trade compliance information for this product:
        
        Product Name: ${input.productName}
        Description: ${input.description || 'N/A'}
        Category: ${input.category || 'N/A'}
        Product Type: ${input.productType || 'N/A'}
        Keywords: ${input.keywords?.join(', ') || 'N/A'}
        
        Please provide the following trade compliance information:
        1. Most likely HS Code (Harmonized System Code)
        2. Required documents for export
        3. Typical tariff rates for major markets (US, EU, China)
        4. Any regulatory notes or certifications needed
        
        Return your response in this exact JSON format:
        {
          "hsCode": "string",
          "requiredDocuments": ["string"],
          "tariffRates": {
            "US": "string",
            "EU": "string",
            "China": "string"
          },
          "regulatoryNotes": "string",
          "confidence": 0.0,
          "source": "Perplexity Compliance"
        }
        
        Be as accurate as possible with the HS code. If you're not sure, provide your best estimate but indicate lower confidence.
      `;
      
      const response = await this.callPerplexityAI(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in Perplexity compliance response');
        return null;
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error(`Error getting compliance data with Perplexity: ${error}`);
      return null;
    }
  }
  
  /**
   * Call the Market Intelligence MCP to get market data
   * 
   * @param input - Input for the Market Intelligence MCP
   * @returns Market intelligence data or null if unavailable
   */
  private async callMarketIntelligenceMCP(input: any): Promise<any> {
    try {
      const url = this.config.mcpConfig?.marketIntelligenceMcpUrl || '';
      
      if (!url) {
        logger.warn('Market Intelligence MCP URL not configured, using Perplexity fallback');
        return this.getMarketDataWithPerplexity(input);
      }
      
      // Call the Market Intelligence MCP API
      const response = await axios.post(url, input, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Safe type handling
      if (response.data && typeof response.data === 'object') {
        return response.data;
      }
      
      // If no valid data from MCP, use Perplexity as fallback
      logger.info('No valid data from Market Intelligence MCP, using Perplexity fallback');
      return this.getMarketDataWithPerplexity(input);
    } catch (error) {
      logger.error(`Error calling Market Intelligence MCP: ${error}`);
      logger.info('Using Perplexity for market data due to MCP error');
      return this.getMarketDataWithPerplexity(input);
    }
  }
  
  /**
   * Get market intelligence data using Perplexity AI as a fallback
   * 
   * @param input - Product information
   * @returns Market intelligence data from Perplexity
   */
  private async getMarketDataWithPerplexity(input: any): Promise<any> {
    try {
      if (!this.config.perplexityAI?.apiKey) {
        logger.error('Perplexity API key not configured for market intelligence fallback');
        return null;
      }
      
      const prompt = `
        I need accurate market intelligence for this product:
        
        Product Name: ${input.productName}
        Category: ${input.category || 'N/A'}
        Product Type: ${input.productType || 'N/A'}
        HS Code (if available): ${input.hsCode || 'N/A'}
        
        Please provide the following market intelligence:
        1. Global market size (most recent estimate)
        2. Growth rate forecast (CAGR)
        3. Top markets globally
        4. Major competitor companies and their approximate market shares
        5. Key demand trends in this market
        
        Return your response in this exact JSON format:
        {
          "marketSize": "string",
          "growthRate": "string",
          "topMarkets": ["string"],
          "competitorProfiles": [
            { 
              "name": "string", 
              "marketShare": "string", 
              "strengths": ["string"] 
            }
          ],
          "demandTrends": ["string"],
          "confidence": 0.0,
          "category": "string",
          "source": "Perplexity Market Intelligence"
        }
        
        Use the most recent and accurate data available. Be specific about the product category.
      `;
      
      const response = await this.callPerplexityAI(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in Perplexity market intelligence response');
        return null;
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error(`Error getting market data with Perplexity: ${error}`);
      return null;
    }
  }
} 