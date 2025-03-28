import { BusinessProfile } from '../types/business-profile.types';
import { LLMWebsiteExtractor } from '../ai-agent/extractors/llm-website-extractor';
import { ExtractionResult } from '../types/extraction';
import { logger } from '../utils/logger';

export class WebsiteAnalyzerService {
  private llmExtractor: LLMWebsiteExtractor;

  constructor() {
    // Initialize the LLM extractor with default configuration
    const defaultConfig = {
      aiModel: {
        apiKey: process.env.OPENAI_API_KEY || '',
        url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
        model: process.env.OPENAI_API_MODEL || 'gpt-4o',
        maxTokens: 4000
      },
      perplexityAI: {
        apiKey: process.env.PERPLEXITY_API_KEY || '',
        url: process.env.PERPLEXITY_API_URL || 'https://api.perplexity.ai/v1/chat/completions',
        model: process.env.PERPLEXITY_API_MODEL || 'sonar-medium-online'
      }
    };
    this.llmExtractor = new LLMWebsiteExtractor(defaultConfig);
  }

  /**
   * Extracts business information from a website using LLM analysis
   * @param url The website URL to analyze
   * @returns A Promise containing the business profile data
   */
  async extractBusinessInfo(url: string): Promise<BusinessProfile> {
    try {
      // Properly format the URL to ensure it has a protocol
      const formattedUrl = this.formatUrl(url);
      logger.info(`Formatted URL for extraction with LLM: ${formattedUrl}`);
      
      // Use the LLM extractor to get detailed website information
      const extractionResult: ExtractionResult = await this.llmExtractor.extract(formattedUrl);
      
      // Convert the extraction result to a BusinessProfile
      const businessProfile = this.convertToBusinessProfile(extractionResult, formattedUrl);
      
      return businessProfile;
    } catch (error) {
      logger.error('Error analyzing website with LLM:', error);
      
      // Return fallback data in case of error
      return this.createFallbackBusinessProfile(url);
    }
  }
  
  /**
   * Convert the LLM extraction result to a BusinessProfile
   * @param result ExtractionResult from LLM
   * @param url Original URL
   * @returns BusinessProfile
   */
  private convertToBusinessProfile(result: ExtractionResult, url: string): BusinessProfile {
    // Get business entity
    const businessEntity = result.extractedEntities.find(entity => entity.type === 'business');
    
    // Get product entities
    const productEntities = result.extractedEntities.filter(entity => entity.type === 'product');
    
    // Get location entity
    const locationEntity = result.extractedEntities.find(entity => entity.type === 'location');
    
    // Get contact entities
    const contactEntities = result.extractedEntities.filter(entity => entity.type === 'contact');
    
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
      if (contact.name === 'email' || contact.name === 'Email') {
        contactInfo.email = contact.value;
      } else if (contact.name === 'phone' || contact.name === 'Phone') {
        contactInfo.phone = contact.value;
      } else if (contact.name === 'address' || contact.name === 'Address') {
        contactInfo.address = contact.value;
      }
    });
    
    // Create business profile
    return {
      name: businessEntity?.name || 'Unknown Business',
      description: businessEntity?.attributes.description || 'No description available',
      industry: businessEntity?.attributes.businessType || '',
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
  
  /**
   * Create a fallback business profile when extraction fails
   * @param url The website URL
   * @returns A basic business profile with minimal information
   */
  private createFallbackBusinessProfile(url: string): BusinessProfile {
    // Extract domain name for business name
    let domain = '';
    try {
      const formattedUrl = this.formatUrl(url);
      domain = new URL(formattedUrl).hostname;
    } catch {
      domain = url.split('/')[0];
    }
    
    // Remove TLD and format domain as business name
    const businessName = domain
      .split('.')
      .slice(0, -1)
      .join('.')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return {
      name: businessName || 'Unknown Business',
      description: 'Error: Could not extract information from this website.',
      industry: '',
      products: [], // Return empty products array to trigger error handling
      websiteUrl: url,
      extractedAt: new Date(),
      location: {},
      contactInfo: {}
    };
  }
} 