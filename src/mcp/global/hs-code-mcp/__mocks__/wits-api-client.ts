import { 
  ClassificationMatch, 
  ProductExample,
  HSChapter,
  HSHeading,
  HSSubheading
} from '../hs-code.types';

/**
 * Mock implementation of WITSAPIClient for testing
 */
export class WITSAPIClient {
  // Mock data
  private mockChapters: HSChapter[] = [
    { code: '85', name: 'Electrical machinery', description: 'Electrical machinery and equipment' },
    { code: '84', name: 'Machinery', description: 'Nuclear reactors, boilers, machinery' },
    { code: '61', name: 'Apparel, knitted', description: 'Articles of apparel and clothing accessories, knitted or crocheted' }
  ];
  
  private mockHeadings: Record<string, HSHeading[]> = {
    '85': [
      { code: '8517', name: 'Telephones', description: 'Telephone sets, including smartphones' },
      { code: '8518', name: 'Microphones and headphones', description: 'Microphones, headphones, audio equipment' }
    ],
    '84': [
      { code: '8471', name: 'Computers', description: 'Automatic data processing machines and units' },
      { code: '8473', name: 'Computer parts', description: 'Parts and accessories for computers' }
    ]
  };
  
  private mockSubheadings: Record<string, HSSubheading[]> = {
    '8517': [
      { code: '851712', name: 'Mobile phones', description: 'Telephones for cellular networks' },
      { code: '851718', name: 'Other telephones', description: 'Other telephone sets' }
    ],
    '8471': [
      { code: '847130', name: 'Laptops', description: 'Portable automatic data processing machines' },
      { code: '847150', name: 'Processing units', description: 'Processing units for computers' }
    ]
  };
  
  private mockExamples: Record<string, ProductExample[]> = {
    '85': [
      { name: 'Smartphone', description: 'Modern touchscreen mobile device', hsCode: '851712' },
      { name: 'Headphones', description: 'Audio listening device', hsCode: '851830' }
    ],
    '8517': [
      { name: 'iPhone', description: 'Apple smartphone with touchscreen', hsCode: '851712' },
      { name: 'Office telephone', description: 'Desk telephone for business use', hsCode: '851718' }
    ],
    '851712': [
      { name: 'iPhone 13', description: 'Apple smartphone with 5G connectivity', hsCode: '851712' },
      { name: 'Samsung Galaxy S21', description: 'Android smartphone with high-resolution camera', hsCode: '851712' }
    ]
  };
  
  /**
   * Search for HS codes
   */
  async searchHSCodes(query: string): Promise<ClassificationMatch[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }
    
    const results: ClassificationMatch[] = [];
    
    if (query.toLowerCase().includes('phone') || 
        query.toLowerCase().includes('mobile') ||
        query.toLowerCase().includes('smartphone')) {
      results.push({
        hsCode: '851712',
        description: 'Mobile phones',
        confidence: 95,
        metadata: {
          chapter: {
            code: '85',
            name: 'Electrical machinery',
            description: 'Electrical machinery and equipment'
          },
          heading: {
            code: '8517',
            name: 'Telephones',
            description: 'Telephone sets, including smartphones'
          },
          subheading: {
            code: '851712',
            name: 'Mobile phones',
            description: 'Telephones for cellular networks'
          }
        }
      });
    }
    
    if (query.toLowerCase().includes('computer') ||
        query.toLowerCase().includes('laptop')) {
      results.push({
        hsCode: '847130',
        description: 'Laptops',
        confidence: 85,
        metadata: {
          chapter: {
            code: '84',
            name: 'Machinery',
            description: 'Nuclear reactors, boilers, machinery'
          },
          heading: {
            code: '8471',
            name: 'Computers',
            description: 'Automatic data processing machines and units'
          },
          subheading: {
            code: '847130',
            name: 'Laptops',
            description: 'Portable automatic data processing machines'
          }
        }
      });
    }
    
    return results;
  }
  
  /**
   * Get product examples for an HS code
   */
  async getProductExamples(hsCode: string): Promise<ProductExample[]> {
    // Look for exact match
    if (this.mockExamples[hsCode]) {
      return this.mockExamples[hsCode];
    }
    
    // Try to match by prefix
    for (const key of Object.keys(this.mockExamples)) {
      if (hsCode.startsWith(key)) {
        return this.mockExamples[key];
      }
      
      if (key.startsWith(hsCode)) {
        return this.mockExamples[key];
      }
    }
    
    return [];
  }
  
  /**
   * Get all HS chapters
   */
  async getChapters(): Promise<HSChapter[]> {
    return [...this.mockChapters];
  }
  
  /**
   * Get headings for a chapter
   */
  async getHeadings(chapterCode: string): Promise<HSHeading[]> {
    return this.mockHeadings[chapterCode] || [];
  }
  
  /**
   * Get subheadings for a heading
   */
  async getSubheadings(headingCode: string): Promise<HSSubheading[]> {
    return this.mockSubheadings[headingCode] || [];
  }
  
  /**
   * Clear cache (mock implementation)
   */
  clearCache(pattern?: string): void {
    // Mock implementation - no actual caching
  }
} 