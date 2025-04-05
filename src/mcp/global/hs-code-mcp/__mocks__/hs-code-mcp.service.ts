import { 
  ClassificationMatch, 
  HsClassificationResult,
  HsClassificationRequest,
  ProductExample,
  ClassificationOption,
  HSChapter,
  HSHeading,
  HSSubheading,
  HSCodePath,
  HSCodePathItem,
  HSCodeHierarchy
} from '../hs-code.types';

/**
 * Mock implementation of HsCodeMCPService for testing
 */
export class HsCodeMCPService {
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
   * Classify a product
   */
  async classifyProduct(request: HsClassificationRequest): Promise<HsClassificationResult> {
    const { productDescription, confidenceThreshold = 0.5, maxResults = 5 } = request;
    
    // Create mock classifications based on product description
    let classifications: ClassificationMatch[] = [];
    
    if (productDescription.toLowerCase().includes('phone') || 
        productDescription.toLowerCase().includes('mobile') ||
        productDescription.toLowerCase().includes('smartphone')) {
      classifications.push({
        hsCode: '851712',
        description: 'Mobile phones',
        confidence: 95,
        metadata: {
          chapter: this.mockChapters[0],
          heading: this.mockHeadings['85'][0],
          subheading: this.mockSubheadings['8517'][0],
          examples: this.mockExamples['851712']
        }
      });
    }
    
    if (productDescription.toLowerCase().includes('computer') ||
        productDescription.toLowerCase().includes('laptop') ||
        productDescription.toLowerCase().includes('notebook')) {
      classifications.push({
        hsCode: '847130',
        description: 'Laptops',
        confidence: 90,
        metadata: {
          chapter: this.mockChapters[1],
          heading: this.mockHeadings['84'][0],
          subheading: this.mockSubheadings['8471'][0]
        }
      });
    }
    
    // Filter by threshold and limit results
    classifications = classifications
      .filter(c => c.confidence >= confidenceThreshold * 100)
      .slice(0, maxResults);
    
    // Return fallback if no results
    if (classifications.length === 0) {
      return {
        classifications: [{
          hsCode: '847170',
          description: 'Other storage units',
          confidence: 30,
          source: 'fallback'
        }],
        query: productDescription,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      classifications,
      query: productDescription,
      timestamp: new Date().toISOString()
    };
  }
  
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
          chapter: this.mockChapters[0],
          heading: this.mockHeadings['85'][0],
          subheading: this.mockSubheadings['8517'][0]
        }
      });
    }
    
    if (query.toLowerCase().includes('computer') ||
        query.toLowerCase().includes('laptop')) {
      results.push({
        hsCode: '847130',
        description: 'Laptops',
        confidence: 90,
        metadata: {
          chapter: this.mockChapters[1],
          heading: this.mockHeadings['84'][0],
          subheading: this.mockSubheadings['8471'][0]
        }
      });
    }
    
    return results;
  }
  
  /**
   * Get chapters
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
   * Get product examples for an HS code
   */
  async getProductExamples(hsCode: string): Promise<ProductExample[]> {
    return this.mockExamples[hsCode] || [];
  }
  
  /**
   * Get path for an HS code
   */
  async getHSCodePath(hsCode: string): Promise<HSCodePath> {
    const cleanCode = hsCode.replace(/\./g, '');
    const path: HSCodePathItem[] = [];
    
    // Add chapter
    if (cleanCode.length >= 2) {
      const chapterCode = cleanCode.substring(0, 2);
      const chapter = this.mockChapters.find(c => c.code === chapterCode);
      
      if (chapter) {
        path.push({
          code: chapter.code,
          name: chapter.name,
          level: 'chapter' as const
        });
      }
    }
    
    // Add heading
    if (cleanCode.length >= 4) {
      const chapterCode = cleanCode.substring(0, 2);
      const headingCode = cleanCode.substring(0, 4);
      const headings = this.mockHeadings[chapterCode] || [];
      const heading = headings.find(h => h.code === headingCode);
      
      if (heading) {
        path.push({
          code: heading.code,
          name: heading.name,
          level: 'heading' as const
        });
      }
    }
    
    // Add subheading
    if (cleanCode.length >= 6) {
      const headingCode = cleanCode.substring(0, 4);
      const subheadingCode = cleanCode;
      const subheadings = this.mockSubheadings[headingCode] || [];
      const subheading = subheadings.find(s => s.code === subheadingCode);
      
      if (subheading) {
        path.push({
          code: subheading.code,
          name: subheading.name,
          level: 'subheading' as const
        });
      }
    }
    
    return { path };
  }
  
  /**
   * Get HS code hierarchy
   */
  async getHSCodeHierarchy(): Promise<HSCodeHierarchy> {
    return {
      chapters: this.mockChapters,
      headings: this.mockHeadings,
      subheadings: this.mockSubheadings
    };
  }
  
  /**
   * Get classification options
   */
  async getClassificationOptions(
    productDescription: string,
    level: 'chapter' | 'heading' | 'subheading',
    parentCode?: string
  ): Promise<ClassificationOption[]> {
    const options: ClassificationOption[] = [];
    
    if (level === 'chapter') {
      this.mockChapters.forEach(chapter => {
        const confidence = this.calculateMockConfidence(productDescription, chapter.name);
        options.push({
          code: chapter.code,
          name: chapter.name,
          description: chapter.description,
          confidence,
          isRecommended: confidence > 80
        });
      });
    } else if (level === 'heading' && parentCode) {
      const headings = this.mockHeadings[parentCode] || [];
      headings.forEach(heading => {
        const confidence = this.calculateMockConfidence(productDescription, heading.name);
        options.push({
          code: heading.code,
          name: heading.name,
          description: heading.description,
          confidence,
          isRecommended: confidence > 80
        });
      });
    } else if (level === 'subheading' && parentCode) {
      const subheadings = this.mockSubheadings[parentCode] || [];
      subheadings.forEach(subheading => {
        const confidence = this.calculateMockConfidence(productDescription, subheading.name);
        options.push({
          code: subheading.code,
          name: subheading.name,
          description: subheading.description,
          confidence,
          isRecommended: confidence > 80
        });
      });
    }
    
    return options.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Clear caches (mock implementation)
   */
  clearCaches(): void {
    // Mock implementation - no actual caching
  }
  
  /**
   * Calculate mock confidence based on text similarity
   */
  private calculateMockConfidence(text1: string, text2: string): number {
    const normalized1 = text1.toLowerCase();
    const normalized2 = text2.toLowerCase();
    
    // Simple word matching for mock
    const words = normalized2.split(/\s+/);
    let matches = 0;
    
    for (const word of words) {
      if (word.length > 3 && normalized1.includes(word)) {
        matches++;
      }
    }
    
    // Calculate a confidence score
    const score = words.length > 0 ? (matches / words.length) * 100 : 0;
    
    // Ensure score stays within 0-100
    return Math.min(Math.max(Math.round(score), 0), 100);
  }
} 