import { HSCodeSuggestion } from '../../data/hs-codes/types';
import { HSCodeCache } from '../../utils/hsCodeCache';
import { HsCodeMCPService } from '../../mcp/global/hs-code-mcp/hs-code-mcp.service';
import { ClassificationResult, HSCode } from '../../types/classification.types';

interface ClassificationOptions {
  additionalInfo?: string;
  category?: string;
  useCache?: boolean;
}

/**
 * Service for handling HS code API calls and caching
 */
export class HSCodeApiService {
  private cache = HSCodeCache.getInstance();
  private hsCodeMCPService: HsCodeMCPService;
  
  constructor() {
    this.hsCodeMCPService = new HsCodeMCPService();
  }
  
  /**
   * Classify a product by description
   */
  async classifyProduct(
    description: string, 
    options: ClassificationOptions = {}
  ): Promise<HSCodeSuggestion[]> {
    const { additionalInfo = '', category = '', useCache = true } = options;
    
    // Generate cache key based on all provided information
    const cacheKey = `${description}:${additionalInfo}:${category}`.toLowerCase();
    
    // Check cache first if enabled
    if (useCache) {
      const cachedSuggestions = this.cache.getCachedSuggestions(cacheKey);
      if (cachedSuggestions) {
        console.log('Cache hit for classification:', cacheKey);
        return cachedSuggestions;
      }
    }
    
    try {
      // Use the MCP service for classification
      const result = await this.hsCodeMCPService.classifyProduct(description);
      
      // Transform MCP result to our internal suggestion format
      const suggestions: HSCodeSuggestion[] = this.transformClassificationToSuggestions(result);
      
      // Cache the results if caching is enabled
      if (useCache) {
        this.cache.setCachedSuggestions(cacheKey, suggestions);
      }
      
      return suggestions;
    } catch (error) {
      console.error('Product classification error:', error);
      throw new Error('Failed to classify product. Please try again later.');
    }
  }
  
  /**
   * Transform ClassificationResult to our internal suggestion format
   */
  private transformClassificationToSuggestions(result: ClassificationResult): HSCodeSuggestion[] {
    const suggestions: HSCodeSuggestion[] = [];
    
    // Add the main result as the first suggestion
    if (result.selectedSubheading) {
      suggestions.push({
        code: result.selectedSubheading.code,
        confidence: result.confidence,
        description: result.selectedSubheading.description,
        path: [
          result.chapter.code,
          result.selectedHeading?.code || '',
          result.selectedSubheading.code
        ]
      });
    }
    
    // Add alternatives if available
    if (result.alternatives && result.alternatives.length > 0) {
      result.alternatives.forEach(alt => {
        // Construct path based on HS code type
        let path: string[] = [];
        
        if (alt.level === 'chapter') {
          path = [alt.code, '', ''];
        } else if (alt.level === 'heading') {
          path = [alt.parentChapter, alt.code, ''];
        } else if (alt.level === 'subheading') {
          path = [alt.parentHeading.substring(0, 2), alt.parentHeading, alt.code];
        }
        
        suggestions.push({
          code: alt.code,
          confidence: alt.confidence,
          description: alt.description,
          path
        });
      });
    }
    
    return suggestions;
  }
  
  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.cache.clear();
  }
} 