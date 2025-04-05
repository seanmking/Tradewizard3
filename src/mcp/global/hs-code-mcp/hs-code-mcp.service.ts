import { Cache } from '@/utils/cache';
import { EmbeddingService } from '@/services/classification/embeddingService';
import { ProductMapper } from '@/services/classification/productMapper';
import { WITSAPIClient } from './wits-api-client';
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
  HSCodeHierarchy,
  SearchResult
} from './hs-code.types';

export class HsCodeMCPService {
  private cache: Cache<string, HsClassificationResult>;
  private embeddingService: EmbeddingService;
  private productMapper: ProductMapper;
  private witsApiClient: WITSAPIClient;
  
  constructor() {
    // Initialize cache with 1 hour TTL
    this.cache = new Cache<string, HsClassificationResult>({
      ttl: 60 * 60 * 1000, // 60 minutes
      maxSize: 1000
    });
    
    // Initialize services
    this.embeddingService = new EmbeddingService();
    this.productMapper = new ProductMapper();
    this.witsApiClient = new WITSAPIClient();
  }
  
  /**
   * Classify a product using multiple classification sources
   * @param request Classification request with product description and options
   * @returns Classification result with confidence scores
   */
  async classifyProduct(request: HsClassificationRequest): Promise<HsClassificationResult> {
    const { 
      productDescription, 
      confidenceThreshold = 0.5, 
      maxResults = 5,
      useCache = true 
    } = request;
    
    // Generate cache key based on request parameters
    const cacheKey = `hsclassify:${productDescription}:${confidenceThreshold}:${maxResults}`;
    
    // Check cache if enabled
    if (useCache) {
      const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for classification: ${productDescription.substring(0, 30)}...`);
        return cachedResult;
      }
    }
    
    try {
      // Get classifications from multiple sources and combine them
      const classifications = await this.getMultiSourceClassification(productDescription);
      
      // Filter by confidence threshold and limit results
      const filteredClassifications = classifications
        .filter(c => c.confidence >= confidenceThreshold * 100)
        .slice(0, maxResults);
      
      // Create result object
      const result: HsClassificationResult = {
        classifications: filteredClassifications,
        query: productDescription,
        timestamp: new Date().toISOString()
      };
      
      // Cache result
      if (useCache && filteredClassifications.length > 0) {
        this.cache.set(cacheKey, result);
      }
      
      // If no results found, try fallback to broad categories
      if (filteredClassifications.length === 0) {
        return this.getFallbackClassification(productDescription);
      }
      
      return result;
    } catch (error) {
      console.error('Error classifying product:', error);
      
      // Return fallback classification on error
      return this.getFallbackClassification(productDescription);
    }
  }
  
  /**
   * Get HS code classifications from multiple sources
   * @param productDescription Product description text
   * @returns Combined classification matches with metadata
   */
  private async getMultiSourceClassification(
    productDescription: string
  ): Promise<ClassificationMatch[]> {
    try {
      // 1. Get classifications from keyword-based system
      const keywordResults = await this.productMapper.getSuggestedHsCodes(productDescription);
      
      // 2. Get classifications from embedding-based system if needed
      let vectorResults: ClassificationMatch[] = [];
      if (keywordResults.length === 0 || (keywordResults.length > 0 && keywordResults[0].confidence < 80)) {
        const embeddingResults = await this.embeddingService.classifyProduct(productDescription);
        // Convert from ClassificationResult to ClassificationMatch
        vectorResults = embeddingResults.map(result => ({
          hsCode: result.hsCode,
          description: result.description,
          confidence: result.confidence,
          source: 'vector',
          metadata: {
            chapter: {
              code: result.chapter,
              name: '',
              description: ''
            },
            heading: {
              code: result.heading,
              name: '',
              description: ''
            },
            subheading: {
              code: result.hsCode,
              name: result.description,
              description: result.description
            }
          }
        }));
      }
      
      // 3. Combine results
      const combinedResults = this.combineClassificationResults(keywordResults, vectorResults);
      
      // 4. Enhance with WITS API data
      const enhancedResults = await this.enhanceClassificationResults(combinedResults, productDescription);
      
      return enhancedResults;
    } catch (error) {
      console.error('Error in multi-source classification:', error);
      
      // Try to get at least some results from WITS API directly
      try {
        return await this.witsApiClient.searchHSCodes(productDescription);
      } catch (innerError) {
        console.error('Fallback search also failed:', innerError);
        return [];
      }
    }
  }
  
  /**
   * Combine classification results from multiple sources with weighted confidence
   * @param keywordResults Results from keyword-based classification
   * @param vectorResults Results from embedding-based classification
   * @returns Combined and de-duplicated results
   */
  private combineClassificationResults(
    keywordResults: ClassificationMatch[],
    vectorResults: ClassificationMatch[]
  ): ClassificationMatch[] {
    // Create a map to track unique HS codes
    const resultsMap = new Map<string, ClassificationMatch>();
    
    // Process keyword results (higher weight)
    keywordResults.forEach(result => {
      resultsMap.set(result.hsCode, {
        ...result,
        confidence: result.confidence,
        source: 'keyword'
      });
    });
    
    // Process vector results and merge with existing results if present
    vectorResults.forEach(result => {
      if (resultsMap.has(result.hsCode)) {
        // Merge with existing result - weighted average (60/40 split favoring keyword)
        const existingResult = resultsMap.get(result.hsCode)!;
        const mergedConfidence = existingResult.source === 'keyword'
          ? existingResult.confidence * 0.6 + result.confidence * 0.4
          : existingResult.confidence * 0.4 + result.confidence * 0.6;
        
        resultsMap.set(result.hsCode, {
          ...existingResult,
          confidence: mergedConfidence,
          source: 'combined'
        });
      } else {
        // Add new result
        resultsMap.set(result.hsCode, {
          ...result,
          confidence: result.confidence,
          source: 'vector'
        });
      }
    });
    
    // Convert map to array and sort by confidence
    return Array.from(resultsMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Enhance classification results with metadata from WITS API
   * @param results Basic classification results
   * @param productDescription Original product description for similarity checks
   * @returns Enhanced classification results with metadata
   */
  private async enhanceClassificationResults(
    results: ClassificationMatch[],
    productDescription: string
  ): Promise<ClassificationMatch[]> {
    if (results.length === 0) return [];
    
    const enhancedResults: ClassificationMatch[] = [];
    
    for (const result of results) {
      try {
        // Get chapter, heading, and subheading codes
        const hsCode = result.hsCode.replace(/\./g, '');
        const chapterCode = hsCode.substring(0, 2);
        const headingCode = hsCode.substring(0, 4);
        const subheadingCode = hsCode;
        
        // Get examples to enhance confidence scores
        const examples = await this.witsApiClient.getProductExamples(hsCode);
        
        // Refine confidence using text similarity with examples
        const refinedConfidence = this.refineConfidenceWithExamples(
          result.confidence,
          examples,
          productDescription
        );
        
        // Get chapter, heading, and subheading details
        const chapters = await this.witsApiClient.getChapters();
        const chapter = chapters.find(c => c.code === chapterCode) || {
          code: chapterCode,
          name: 'Unknown Chapter',
          description: ''
        };
        
        const headings = await this.witsApiClient.getHeadings(chapterCode);
        const heading = headings.find(h => h.code === headingCode) || {
          code: headingCode,
          name: 'Unknown Heading',
          description: ''
        };
        
        const subheadings = await this.witsApiClient.getSubheadings(headingCode);
        const subheading = subheadings.find(s => s.code === subheadingCode) || {
          code: subheadingCode,
          name: 'Unknown Subheading',
          description: result.description || ''
        };
        
        // Create enhanced result with metadata
        enhancedResults.push({
          ...result,
          confidence: refinedConfidence,
          metadata: {
            chapter,
            heading,
            subheading,
            examples: examples.slice(0, 5) // Include top 5 examples
          }
        });
      } catch (error) {
        console.error(`Error enhancing result for HS code ${result.hsCode}:`, error);
        enhancedResults.push(result);
      }
    }
    
    // Re-sort by refined confidence
    return enhancedResults.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Refine confidence score based on similarity to product examples
   * @param baseConfidence Initial confidence score
   * @param examples Product examples for this HS code
   * @param productDescription Original product description
   * @returns Refined confidence score
   */
  private refineConfidenceWithExamples(
    baseConfidence: number,
    examples: ProductExample[],
    productDescription: string
  ): number {
    if (examples.length === 0) return baseConfidence;
    
    // Calculate similarity between product description and examples
    const similarities = examples.map(example => {
      return this.calculateTextSimilarity(
        productDescription.toLowerCase(),
        `${example.name} ${example.description}`.toLowerCase()
      );
    });
    
    // Get maximum similarity
    const maxSimilarity = Math.max(...similarities) * 100;
    
    // Weight: 70% base confidence + 30% example similarity
    const refinedConfidence = (baseConfidence * 0.7) + (maxSimilarity * 0.3);
    
    return Math.round(refinedConfidence);
  }
  
  /**
   * Calculate simple text similarity score between two strings
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Split into words
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
    
    // Count matches
    let matches = 0;
    for (const word of words1) {
      if (words2.has(word)) matches++;
    }
    
    // Calculate Jaccard similarity
    const union = new Set([...words1, ...words2]);
    return union.size === 0 ? 0 : matches / union.size;
  }
  
  /**
   * Get fallback classification when no results are found
   * @param productDescription Product description
   * @returns Basic classification result
   */
  private getFallbackClassification(productDescription: string): HsClassificationResult {
    // Default to common HS codes based on keywords
    const commonKeywords: Record<string, string[]> = {
      'electronics': ['8471', '8517', '8518', '8528'],
      'clothing': ['6101', '6201', '6301'],
      'food': ['1601', '1602', '1604', '2101', '2103'],
      'furniture': ['9401', '9403', '9404'],
      'toys': ['9503', '9504', '9505'],
      'cosmetics': ['3303', '3304', '3305', '3307']
    };
    
    // Look for keywords in product description
    const lowerDesc = productDescription.toLowerCase();
    for (const [category, codes] of Object.entries(commonKeywords)) {
      if (lowerDesc.includes(category)) {
        // Found a matching category
        return {
          classifications: [
            {
              hsCode: codes[0],
              description: `${category} products`,
              confidence: 30, // Low confidence for fallback
              source: 'fallback'
            }
          ],
          query: productDescription,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // Ultimate fallback: miscellaneous manufactured articles
    return {
      classifications: [
        {
          hsCode: '9602',
          description: 'Miscellaneous manufactured articles',
          confidence: 15, // Very low confidence
          source: 'fallback'
        }
      ],
      query: productDescription,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Search for HS codes by query
   * @param query Search query
   * @returns List of matching HS codes with metadata
   */
  async searchHSCodes(query: string): Promise<ClassificationMatch[]> {
    try {
      // Check cache
      const cacheKey = `hsSearch:${query}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult.classifications;
      }
      
      // Search via WITS API
      const results = await this.witsApiClient.searchHSCodes(query);
      
      // Cache results
      this.cache.set(cacheKey, {
        classifications: results,
        query,
        timestamp: new Date().toISOString()
      });
      
      return results;
    } catch (error) {
      console.error('Error searching HS codes:', error);
      return [];
    }
  }
  
  /**
   * Get HS code chapters
   * @returns List of chapters
   */
  async getChapters(): Promise<HSChapter[]> {
    try {
      return await this.witsApiClient.getChapters();
    } catch (error) {
      console.error('Error getting HS chapters:', error);
      return [];
    }
  }
  
  /**
   * Get HS code headings for a chapter
   * @param chapterCode HS chapter code (2 digits)
   * @returns List of headings
   */
  async getHeadings(chapterCode: string): Promise<HSHeading[]> {
    try {
      return await this.witsApiClient.getHeadings(chapterCode);
    } catch (error) {
      console.error(`Error getting headings for chapter ${chapterCode}:`, error);
      return [];
    }
  }
  
  /**
   * Get HS code subheadings for a heading
   * @param headingCode HS heading code (4 digits)
   * @returns List of subheadings
   */
  async getSubheadings(headingCode: string): Promise<HSSubheading[]> {
    try {
      return await this.witsApiClient.getSubheadings(headingCode);
    } catch (error) {
      console.error(`Error getting subheadings for heading ${headingCode}:`, error);
      return [];
    }
  }
  
  /**
   * Get hierarchical path for an HS code
   * @param hsCode HS code (2, 4, or 6 digits)
   * @returns Path from chapter to subheading
   */
  async getHSCodePath(hsCode: string): Promise<HSCodePath> {
    try {
      const cleanCode = hsCode.replace(/\./g, '');
      const path: HSCodePathItem[] = [];
      
      // Get chapter
      if (cleanCode.length >= 2) {
        const chapterCode = cleanCode.substring(0, 2);
        const chapters = await this.getChapters();
        const chapter = chapters.find(c => c.code === chapterCode);
        
        if (chapter) {
          path.push({
            code: chapter.code,
            name: chapter.name,
            level: 'chapter'
          });
        }
      }
      
      // Get heading
      if (cleanCode.length >= 4) {
        const chapterCode = cleanCode.substring(0, 2);
        const headingCode = cleanCode.substring(0, 4);
        const headings = await this.getHeadings(chapterCode);
        const heading = headings.find(h => h.code === headingCode);
        
        if (heading) {
          path.push({
            code: heading.code,
            name: heading.name,
            level: 'heading'
          });
        }
      }
      
      // Get subheading
      if (cleanCode.length >= 6) {
        const headingCode = cleanCode.substring(0, 4);
        const subheadingCode = cleanCode.substring(0, 6);
        const subheadings = await this.getSubheadings(headingCode);
        const subheading = subheadings.find(s => s.code === subheadingCode);
        
        if (subheading) {
          path.push({
            code: subheading.code,
            name: subheading.name,
            level: 'subheading'
          });
        }
      }
      
      return { path };
    } catch (error) {
      console.error(`Error getting HS code path for ${hsCode}:`, error);
      return { path: [] };
    }
  }
  
  /**
   * Get HS code hierarchy (all chapters, headings, subheadings)
   * @returns Complete HS code hierarchy
   */
  async getHSCodeHierarchy(): Promise<HSCodeHierarchy> {
    try {
      const chapters = await this.getChapters();
      const hierarchy: HSCodeHierarchy = {
        chapters: [],
        headings: {},
        subheadings: {}
      };
      
      // Add chapters to hierarchy
      hierarchy.chapters = chapters;
      
      // Add headings and subheadings for most common chapters
      const commonChapters = ['84', '85', '61', '62', '39'];
      
      for (const chapterCode of commonChapters) {
        const headings = await this.getHeadings(chapterCode);
        hierarchy.headings[chapterCode] = headings;
        
        for (const heading of headings) {
          const subheadings = await this.getSubheadings(heading.code);
          hierarchy.subheadings[heading.code] = subheadings;
        }
      }
      
      return hierarchy;
    } catch (error) {
      console.error('Error getting HS code hierarchy:', error);
      return { chapters: [], headings: {}, subheadings: {} };
    }
  }
  
  /**
   * Get product examples for an HS code
   * @param hsCode HS code (chapter, heading, or subheading)
   * @returns List of product examples
   */
  async getProductExamples(hsCode: string): Promise<ProductExample[]> {
    try {
      return await this.witsApiClient.getProductExamples(hsCode);
    } catch (error) {
      console.error(`Error getting examples for HS code ${hsCode}:`, error);
      return [];
    }
  }

  /**
   * Get classification options for a specific level with confidence scores
   * @param productDescription Product description to classify
   * @param level Classification level (chapter, heading, subheading)
   * @param parentCode Optional parent code for filtering
   * @returns Classification options with confidence scores
   */
  async getClassificationOptions(
    productDescription: string,
    level: 'chapter' | 'heading' | 'subheading',
    parentCode?: string
  ): Promise<ClassificationOption[]> {
    try {
      // First get classification matches
      const classificationResult = await this.classifyProduct({
        productDescription,
        confidenceThreshold: 0.1, // Lower threshold to get more options
        maxResults: 20
      });
      
      // Group matches by the specified level
      const options = new Map<string, ClassificationOption>();
      
      for (const match of classificationResult.classifications) {
        if (!match.metadata) continue;
        
        let code = '';
        let name = '';
        let description = '';
        
        if (level === 'chapter') {
          code = match.metadata.chapter.code;
          name = match.metadata.chapter.name;
          description = match.metadata.chapter.description;
        } else if (level === 'heading') {
          // Filter by parent if specified
          if (parentCode && !match.metadata.heading.code.startsWith(parentCode)) {
            continue;
          }
          
          code = match.metadata.heading.code;
          name = match.metadata.heading.name;
          description = match.metadata.heading.description;
        } else if (level === 'subheading') {
          // Filter by parent if specified
          if (parentCode && !match.metadata.subheading.code.startsWith(parentCode)) {
            continue;
          }
          
          code = match.metadata.subheading.code;
          name = match.metadata.subheading.name;
          description = match.metadata.subheading.description;
        }
        
        // Add or update option with highest confidence
        if (!options.has(code) || options.get(code)!.confidence < match.confidence) {
          options.set(code, {
            code,
            name,
            description,
            confidence: match.confidence
          });
        }
      }
      
      // If we don't have enough options, fetch all for the level
      if (options.size < 3) {
        if (level === 'chapter') {
          const chapters = await this.getChapters();
          
          for (const chapter of chapters) {
            if (!options.has(chapter.code)) {
              options.set(chapter.code, {
                code: chapter.code,
                name: chapter.name,
                description: chapter.description,
                confidence: 0
              });
            }
          }
        } else if (level === 'heading' && parentCode) {
          const headings = await this.getHeadings(parentCode);
          
          for (const heading of headings) {
            if (!options.has(heading.code)) {
              options.set(heading.code, {
                code: heading.code,
                name: heading.name,
                description: heading.description,
                confidence: 0
              });
            }
          }
        } else if (level === 'subheading' && parentCode) {
          const subheadings = await this.getSubheadings(parentCode);
          
          for (const subheading of subheadings) {
            if (!options.has(subheading.code)) {
              options.set(subheading.code, {
                code: subheading.code,
                name: subheading.name,
                description: subheading.description,
                confidence: 0
              });
            }
          }
        }
      }
      
      // Convert to array and sort by confidence
      return Array.from(options.values())
        .sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error(`Error getting classification options for level ${level}:`, error);
      return [];
    }
  }
  
  /**
   * Clear service caches
   */
  clearCaches(): void {
    this.cache.clear();
    this.witsApiClient.clearCache();
  }
} 