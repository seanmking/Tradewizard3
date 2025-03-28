// TODO: Import from tradewizard-digital-footprint-analyzer/src/ai-agent/extractors/website-extractor.ts
// This is a placeholder that will be replaced with the actual implementation

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { ExtractionResult, ExtractedEntity, EntityType, ExtractionSource } from '@/types/extraction';
import { IntelligenceService } from '@/ai-agent/services/intelligence-service';
import { ContentAnalysisRequest, ContentAnalysisResponse } from '@/types/intelligence';

export class WebsiteExtractor {
  private browser: Browser | null = null;
  private intelligenceService: IntelligenceService;
  
  /**
   * Initialize the website extractor
   */
  constructor(intelligenceService: IntelligenceService) {
    this.intelligenceService = intelligenceService;
  }
  
  /**
   * Extract business and product information from a website
   * 
   * @param url - The URL of the website to extract information from
   * @returns An extraction result containing the extracted entities and metadata
   */
  public async extract(url: string): Promise<ExtractionResult> {
    // Ensure URL has a protocol
    url = this.ensureUrlHasProtocol(url);
    
    logger.info(`Starting extraction for URL: ${url}`);
    
    const startTime = Date.now();
    
    try {
      // Determine if the site is JavaScript-heavy
      const isJsHeavy = await this.isJavaScriptHeavy(url);
      
      let htmlContent: string;
      
      if (isJsHeavy) {
        logger.info(`Using Puppeteer for JavaScript-heavy site: ${url}`);
        htmlContent = await this.extractWithPuppeteer(url);
      } else {
        logger.info(`Using Cheerio for static site: ${url}`);
        htmlContent = await this.extractWithCheerio(url);
      }
      
      // Extract entities from the HTML content using AI-driven analysis
      const extractedEntities = await this.analyzeContent(htmlContent, url);
      
      const processingTime = Date.now() - startTime;
      
      return {
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
    } catch (error) {
      logger.error(`Error extracting from URL ${url}: ${error}`);
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
   * Ensures URL has a protocol (http:// or https://)
   * 
   * @param url - URL to validate
   * @returns URL with a protocol
   */
  private ensureUrlHasProtocol(url: string): string {
    url = url.trim();
    
    // Check if the URL already has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Add https:// protocol by default
      url = 'https://' + url;
    }
    
    try {
      // Validate URL format
      new URL(url);
      return url;
    } catch (error) {
      logger.error(`Invalid URL format: ${url}`);
      throw new Error('Invalid URL format. Please enter a valid website address.');
    }
  }
  
  /**
   * Determine if a website is JavaScript-heavy and requires Puppeteer
   * 
   * @param url - The URL to check
   * @returns A boolean indicating if Puppeteer should be used
   */
  private async isJavaScriptHeavy(url: string): Promise<boolean> {
    try {
      // URL is already validated and formatted in the extract method
      const response = await axios.get(url);
      const html = response.data as string;
      
      const hasFramework = 
        html.includes('react') || 
        html.includes('vue') || 
        html.includes('angular') ||
        (html.match(/<script/g) || []).length > 5;
      
      return hasFramework;
    } catch (error) {
      logger.warn(`Error checking if site is JS-heavy: ${error}`);
      return true;
    }
  }
  
  /**
   * Extract website content using Puppeteer for JavaScript-heavy sites
   * 
   * @param url - The URL to extract content from
   * @returns The HTML content of the page
   */
  private async extractWithPuppeteer(url: string): Promise<string> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await this.browser.newPage();
      
      // Set a reasonable timeout
      await page.setDefaultNavigationTimeout(30000);
      
      // Intercept and block unnecessary resources to speed up loading
      await this.setupResourceBlocker(page);
      
      // Navigate to the URL - URL is already validated in extract method
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for important content to load
      await this.waitForContentToLoad(page);
      
      // Get the page content
      const content = await page.content();
      
      return content;
    } catch (error) {
      logger.error(`Error extracting with Puppeteer: ${error}`);
      throw new Error(`Failed to extract content using Puppeteer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Setup resource blocker for Puppeteer to speed up page loading
   * 
   * @param page - Puppeteer page instance
   */
  private async setupResourceBlocker(page: Page): Promise<void> {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }
  
  /**
   * Wait for important content to load on the page
   * 
   * @param page - Puppeteer page instance
   */
  private async waitForContentToLoad(page: Page): Promise<void> {
    try {
      // Wait for common content selectors
      await page.waitForSelector('h1, h2, .content, #content, .products, .main', { timeout: 5000 });
    } catch (error) {
      // If no common selectors found, just continue - the page might have loaded enough
      logger.info('No common content selectors found, continuing with extraction');
    }
    
    // Additional waiting to ensure JavaScript execution completes
    await page.waitForTimeout(2000);
  }
  
  /**
   * Extract website content using Cheerio for static sites
   * 
   * @param url - The URL to extract content from
   * @returns The HTML content of the page
   */
  private async extractWithCheerio(url: string): Promise<string> {
    try {
      const response = await axios.get<string>(url);
      return response.data;
    } catch (error) {
      logger.error(`Error extracting with Cheerio: ${error}`);
      throw new Error(`Failed to extract content using Cheerio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Analyze HTML content using AI-driven intelligence service
   * 
   * @param html - The HTML content to analyze
   * @param sourceUrl - The URL the content was extracted from
   * @returns An array of extracted entities
   */
  private async analyzeContent(html: string, sourceUrl: string): Promise<ExtractedEntity[]> {
    // Clean and preprocess the HTML content
    const cleanedContent = this.cleanAndPreprocessHtml(html);
    
    // Prepare the request for the intelligence service
    const analysisRequest: ContentAnalysisRequest = {
      content: cleanedContent,
      sourceUrl,
      sourceType: 'website',
      entityTypes: ['business', 'product', 'location', 'contact']
    };
    
    // Send the content to the intelligence service for analysis
    const analysisResponse = await this.intelligenceService.analyzeContent(analysisRequest);
    
    // Transform the intelligence service response into extracted entities
    const extractedEntities = this.transformAnalysisToEntities(analysisResponse, sourceUrl);
    
    // Separate products from other entities
    const productEntities = extractedEntities.filter(entity => entity.type === 'product');
    const otherEntities = extractedEntities.filter(entity => entity.type !== 'product');
    
    // Validate products using LLM
    const validatedProducts = await this.validateProductsWithLLM(productEntities, html);
    
    // Combine validated products with other entities
    return [...otherEntities, ...validatedProducts];
  }
  
  /**
   * Clean and preprocess HTML content for analysis
   * 
   * @param html - The raw HTML content
   * @returns Cleaned and preprocessed content
   */
  private cleanAndPreprocessHtml(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove script and style tags
    $('script, style, iframe, noscript').remove();
    
    // Extract structured data if available
    const structuredData = this.extractStructuredData($);
    
    // Extract main content
    const mainContent = this.extractMainContent($);
    
    // Combine structured data and main content
    return JSON.stringify({
      structuredData,
      mainContent
    });
  }
  
  /**
   * Extract structured data from HTML (JSON-LD, microdata, etc.)
   * 
   * @param $ - Cheerio instance
   * @returns Extracted structured data
   */
  private extractStructuredData($: cheerio.CheerioAPI): any[] {
    const structuredData: any[] = [];
    
    // Extract JSON-LD
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonContent = $(element).html();
        if (jsonContent) {
          const parsedData = JSON.parse(jsonContent);
          structuredData.push(parsedData);
        }
      } catch (error) {
        logger.warn(`Error parsing JSON-LD: ${error}`);
      }
    });
    
    return structuredData;
  }
  
  /**
   * Extract main content from HTML
   * 
   * @param $ - Cheerio instance
   * @returns Extracted main content
   */
  private extractMainContent($: cheerio.CheerioAPI): any {
    // Extract title and heading information
    const title = $('title').text().trim();
    const h1 = $('h1').first().text().trim();
    
    // Extract main content areas
    const contentSelectors = [
      'main',
      '#content',
      '.content',
      'article',
      '.main',
      '#main'
    ];
    
    let mainContentText = '';
    
    // Try each content selector
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        mainContentText = element.text().trim();
        break;
      }
    }
    
    // If no main content found, take the body text
    if (!mainContentText) {
      mainContentText = $('body').text().trim();
    }
    
    // Extract navigation links for site structure understanding
    const navigationLinks: { text: string; href: string }[] = [];
    $('nav a, .nav a, .menu a, #menu a, header a').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');
      if (text && href) {
        navigationLinks.push({ text, href });
      }
    });
    
    // Extract contact information section if exists
    const contactSectionText = $('.contact, #contact, .contact-us, #contact-us, footer').text().trim();
    
    // Extract product section if exists
    const productSectionContent: any[] = [];
    $('.products, .product-list, [itemtype*="Product"]').each((_, element) => {
      const productElement = $(element);
      const productName = productElement.find('h2, h3, .product-title, .name').text().trim();
      const productDescription = productElement.find('.description, .product-description').text().trim();
      const productImage = productElement.find('img').attr('src');
      
      if (productName) {
        productSectionContent.push({
          name: productName,
          description: productDescription,
          image: productImage
        });
      }
    });
    
    return {
      title,
      h1,
      mainContentText,
      navigationLinks,
      contactSectionText,
      productSectionContent
    };
  }
  
  /**
   * Transform intelligence service analysis response into extracted entities
   * 
   * @param analysisResponse - The analysis response from the intelligence service
   * @param sourceUrl - The source URL
   * @returns Array of extracted entities
   */
  private transformAnalysisToEntities(
    analysisResponse: ContentAnalysisResponse, 
    sourceUrl: string
  ): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Transform identified entities from the analysis
    analysisResponse.entities.forEach(entity => {
      entities.push({
        id: this.generateEntityId(),
        type: entity.type as EntityType,
        name: entity.name,
        value: entity.name, // Use name as the primary value
        confidence: entity.confidence,
        source: sourceUrl,
        verified: false,
        userModified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        attributes: entity.attributes
      });
    });
    
    return entities;
  }
  
  /**
   * Validate extracted products using LLM to filter out non-products
   * 
   * @param potentialProducts - List of potential products extracted from DOM
   * @param html - The HTML content for context
   * @returns Validated product entities
   */
  private async validateProductsWithLLM(potentialProducts: ExtractedEntity[], html: string): Promise<ExtractedEntity[]> {
    // If no products to validate, return empty array
    if (potentialProducts.length === 0) {
      return [];
    }
    
    // Create a validation prompt
    const prompt = `
      I need you to validate which of these items are actual products or services offered by a business.

      IMPORTANT GUIDELINES:
      - Determine if each item is a real product/service or just a UI element/navigation item
      - For each item, respond with "VALID" if it's a real product or "INVALID" if it's not
      - Only mark as "VALID" if you're confident it's an actual product or service the business sells
      
      POTENTIAL PRODUCTS:
      ${potentialProducts.map((product, index) => 
        `${index+1}. ${product.name}${product.attributes.description ? ` - ${product.attributes.description}` : ''}`
      ).join('\n')}
      
      WEBSITE CONTEXT:
      ${html.substring(0, 5000)}
      
      RESPOND IN THIS EXACT FORMAT:
      {
        "validations": [
          {"index": 1, "isValid": true/false, "confidence": 0.0 to 1.0},
          {"index": 2, "isValid": true/false, "confidence": 0.0 to 1.0},
          ...
        ]
      }
    `;
    
    try {
      // Call the AI model via the intelligence service
      const response = await this.intelligenceService.validateWithLLM(prompt);
      
      // Extract validation results
      const validationResults = JSON.parse(response).validations;
      
      // Filter products based on validation results
      const validatedProducts: ExtractedEntity[] = [];
      
      interface ValidationResult {
        index: number;
        isValid: boolean;
        confidence: number;
      }
      
      validationResults.forEach((validation: ValidationResult) => {
        if (validation.isValid && validation.confidence >= 0.7) { // Only keep high-confidence products
          const productIndex = validation.index - 1;
          if (productIndex >= 0 && productIndex < potentialProducts.length) {
            // Update the confidence score based on LLM validation
            const product = potentialProducts[productIndex];
            product.confidence = validation.confidence;
            validatedProducts.push(product);
          }
        }
      });
      
      return validatedProducts;
    } catch (error) {
      logger.error(`Error validating products with LLM: ${error}`);
      // If validation fails, be conservative and return no products
      // to prevent false positives
      return [];
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
      'service': 0.2,
      'metadata': 0.1
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
} 