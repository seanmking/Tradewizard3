import { ClassificationResult } from './embeddingService';

/**
 * Service to map product descriptions to HS codes using
 * both vector similarity and rule-based approaches
 */
export class ProductMapper {
  private commonProductMappings: Map<string, string[]>;
  
  constructor() {
    // Initialize with some common product to HS code mappings
    this.commonProductMappings = new Map<string, string[]>();
    
    // Food products
    this.commonProductMappings.set('chicken', ['0207', '1602']);
    this.commonProductMappings.set('beef', ['0201', '0202', '1602']);
    this.commonProductMappings.set('corn dog', ['1602']); // Prepared meat products
    this.commonProductMappings.set('avocado', ['0804']);
    this.commonProductMappings.set('wine', ['2204']);
    
    // Electronics
    this.commonProductMappings.set('laptop', ['8471']);
    this.commonProductMappings.set('smartphone', ['8517']);
    this.commonProductMappings.set('television', ['8528']);
    
    // Clothing
    this.commonProductMappings.set('cotton shirt', ['6105', '6106']);
    this.commonProductMappings.set('wool coat', ['6201', '6202']);
  }
  
  /**
   * Get potential HS code chapters based on keywords in the product description
   */
  getChaptersByKeywords(productDescription: string): string[] {
    const normalizedDescription = productDescription.toLowerCase();
    const potentialChapters = new Set<string>();
    
    // Check each known product mapping
    for (const [keyword, hsCodes] of this.commonProductMappings.entries()) {
      if (normalizedDescription.includes(keyword)) {
        hsCodes.forEach(code => {
          // Extract chapter (first 2 digits)
          const chapter = code.substring(0, 2);
          potentialChapters.add(chapter);
        });
      }
    }
    
    return Array.from(potentialChapters);
  }
  
  /**
   * Get suggested HS codes based on keywords in the product description
   */
  getSuggestedHsCodes(productDescription: string): ClassificationResult[] {
    const normalizedDescription = productDescription.toLowerCase();
    const results: ClassificationResult[] = [];
    
    // Check each known product mapping
    for (const [keyword, hsCodes] of this.commonProductMappings.entries()) {
      if (normalizedDescription.includes(keyword)) {
        hsCodes.forEach(code => {
          // Extract chapter (first 2 digits) and heading (first 4 digits)
          const chapter = code.substring(0, 2);
          const heading = code;
          
          results.push({
            hsCode: code + '00', // Pad to create a valid HS code
            confidence: 0.7, // Medium confidence for keyword-based matches
            description: `Products containing ${keyword}`,
            chapter: chapter,
            heading: heading
          });
        });
      }
    }
    
    return results;
  }
  
  /**
   * Enrich classification results with additional information
   */
  enrichClassificationResults(
    results: ClassificationResult[], 
    productDescription: string
  ): ClassificationResult[] {
    // This would connect to a more comprehensive database
    // of HS codes and product descriptions
    return results.map(result => {
      // Add any additional information
      return {
        ...result,
        // You could add more fields here based on a database lookup
      };
    });
  }
  
  /**
   * Combine keyword-based and vector-based classification results
   */
  combineClassificationResults(
    keywordResults: ClassificationResult[],
    vectorResults: ClassificationResult[]
  ): ClassificationResult[] {
    const combinedResults = [...keywordResults];
    
    // Add vector results that don't duplicate keyword results
    for (const vectorResult of vectorResults) {
      const isDuplicate = keywordResults.some(
        kr => kr.hsCode.substring(0, 4) === vectorResult.hsCode.substring(0, 4)
      );
      
      if (!isDuplicate) {
        combinedResults.push(vectorResult);
      }
    }
    
    // Sort by confidence
    return combinedResults.sort((a, b) => b.confidence - a.confidence);
  }
}

export default new ProductMapper(); 