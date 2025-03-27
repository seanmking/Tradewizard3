import { BusinessProfile } from '../types/business-profile.types';
import { WebsiteExtractor } from '../ai-agent/extractors/website-extractor';
import { ExtractionConfig } from '../types/extraction';

export class WebsiteAnalyzerService {
  private extractor: WebsiteExtractor;

  constructor(config?: Partial<ExtractionConfig>) {
    this.extractor = new WebsiteExtractor(config);
  }

  /**
   * Extracts business information from a website
   * @param url The website URL to analyze
   * @returns A Promise containing the business profile data
   */
  async extractBusinessInfo(url: string): Promise<BusinessProfile> {
    try {
      const extractionResult = await this.extractor.extract(url);
      
      // Convert extraction result to BusinessProfile format
      return {
        name: extractionResult.businessInfo.name || 'Unknown Business',
        description: extractionResult.businessInfo.description,
        industry: extractionResult.businessInfo.industry,
        products: extractionResult.products.map(p => ({
          name: p.name,
          description: p.description,
          category: p.category,
          specifications: p.specifications
        })),
        websiteUrl: url,
        extractedAt: new Date(),
        location: extractionResult.businessInfo.location,
        contactInfo: extractionResult.businessInfo.contactInfo
      };
    } catch (error) {
      console.error('Error analyzing website:', error);
      throw new Error('Failed to analyze website');
    }
  }
} 