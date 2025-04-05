import { BusinessProfile } from '../types/business-profile.types';
import { LLMWebsiteExtractor } from '@/ai-agent/extractors/llm-website-extractor';
import { ExtractionResult } from '../types/extraction';
import { logger } from '../utils/logger';
import { validateAndCorrectApiEndpoint } from '@/utils/api-endpoint-manager';
// Import our initialization to be sure it's applied
import '@/ai-agent/services/initialize-api';

export class WebsiteAnalyzerService {
  private llmExtractor: LLMWebsiteExtractor;

  constructor() {
    // Get API key and determine correct endpoint
    const apiKey = process.env.OPENAI_API_KEY || '';
    const isProjectKey = apiKey.startsWith('sk-proj-');
    
    // Ensure we're using the correct URL for the API key format
    const correctApiUrl = isProjectKey
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    logger.info(`API configured: Using ${correctApiUrl}`);

    // Initialize the LLM extractor with correct configuration
    this.llmExtractor = new LLMWebsiteExtractor({
      aiModel: {
        apiKey: apiKey,
        url: correctApiUrl,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        maxTokens: 4000
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
      }
    });
  }

  /**
   * Analyze a website and extract business information
   * @param url The URL of the website to analyze
   * @returns A Promise containing the business profile data
   */
  async extractBusinessInfo(url: string): Promise<BusinessProfile> {
    try {
      // Format the URL to ensure it has a protocol
      const formattedUrl = this.formatUrl(url);
      
      // Use the LLM extractor to get detailed website information
      const extractionResult: ExtractionResult = await this.llmExtractor.extract(formattedUrl);
      
      // Convert the extraction result to a BusinessProfile
      const businessProfile = this.convertToBusinessProfile(extractionResult, formattedUrl);
      
      return businessProfile;
    } catch (error) {
      logger.error('Error analyzing website with LLM:', error);
      
      // Return minimal data from URL instead of fallback mock data
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const businessName = domain
        .split('.')
        .slice(0, -1)
        .join('.')
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      return {
        name: businessName || 'Unknown Business',
        description: `Website extraction error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or enter business details manually.`,
        industry: 'Unknown',
        products: [], // Empty products array, but not mocked data
        websiteUrl: url,
        extractedAt: new Date(),
        location: {},
        contactInfo: {}
      };
    }
  }
  
  /**
   * Convert the LLM extraction result to a BusinessProfile
   * @param result ExtractionResult from LLM
   * @param url Original URL
   * @returns BusinessProfile
   */
  private convertToBusinessProfile(result: ExtractionResult, url: string): BusinessProfile {
    // Ensure extractedEntities exists and is an array
    const entities = Array.isArray(result.extractedEntities) ? result.extractedEntities : [];
    
    // Get business entity
    const businessEntity = entities.find(entity => entity.type === 'business');
    
    // Get product entities
    const productEntities = entities.filter(entity => entity.type === 'product');
    
    // Get location entity
    const locationEntity = entities.find(entity => entity.type === 'location');
    
    // Get contact entities
    const contactEntities = entities.filter(entity => entity.type === 'contact');
    
    // Log extraction quality
    logger.info(`Extraction quality: Business: ${Boolean(businessEntity)}, Products: ${productEntities.length}, Contacts: ${contactEntities.length}`);
    
    // Format products
    const products = productEntities.map(product => ({
      name: product.name,
      description: product.attributes.description || '',
      category: product.attributes.category || 'Uncategorized',
      specifications: product.attributes.specifications || {}
    }));
    
    // Format contact info
    const contactInfo: any = {};
    contactEntities.forEach(contact => {
      if (contact.name.toLowerCase().includes('email')) {
        contactInfo.email = contact.value;
      } else if (contact.name.toLowerCase().includes('phone')) {
        contactInfo.phone = contact.value;
      } else if (contact.name.toLowerCase().includes('address')) {
        contactInfo.address = contact.value;
      }
    });
    
    // Create business profile - should always have a business entity now
    return {
      name: businessEntity?.name || 'Unknown Business',
      description: businessEntity?.attributes?.description || `Business operating at ${url}`,
      industry: businessEntity?.attributes?.businessType || 'General Business',
      products: products,
      websiteUrl: url,
      extractedAt: new Date(),
      location: locationEntity?.attributes || {},
      contactInfo: contactInfo
    };
  }
  
  /**
   * Format URL to ensure it has a protocol
   * @param url Input URL which may be missing protocol
   * @returns Properly formatted URL with protocol
   */
  private formatUrl(url: string): string {
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
} 