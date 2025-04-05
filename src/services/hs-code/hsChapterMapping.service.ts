import { logger } from '../../utils/logger';
import { ProductGroup } from '../product/productConsolidation.service';

export interface HSChapterMapping {
  chapter: string;
  description: string;
  confidence: number;
  keywords: string[];
  excludeKeywords?: string[];
  requiresAttributes?: Array<keyof ProductGroup['attributes']>;
}

export interface MappingResult {
  chapter: string;
  confidence: number;
  description: string;
  alternativeChapters: Array<{
    chapter: string;
    confidence: number;
    description: string;
  }>;
  needsReview: boolean;
}

interface HSCodeSuggestion {
  code: string;
  confidence: number;
}

interface ProductDetails {
  name: string;
  description: string;
  mainIngredient: string;
  preparationMethod: string;
  packagingType: string;
  productState: string;
  netWeight?: string;
  shelfLife?: string;
  storageRequirements?: string;
  additionalIngredients?: string;
}

export class HSChapterMappingService {
  private readonly chapterMappings: HSChapterMapping[] = [
    {
      chapter: '16',
      description: 'Preparations of meat, fish or crustaceans, molluscs or other aquatic invertebrates',
      confidence: 0.9,
      keywords: ['meat', 'fish', 'prepared', 'breaded', 'fried', 'chicken', 'beef', 'pork'],
      requiresAttributes: ['mainIngredient'],
      excludeKeywords: ['live', 'fresh', 'chilled', 'frozen']
    },
    {
      chapter: '19',
      description: 'Preparations of cereals, flour, starch or milk; pastrycooks products',
      confidence: 0.85,
      keywords: ['corn', 'flour', 'bread', 'pastry', 'dough', 'cereal'],
      excludeKeywords: ['raw', 'unprocessed']
    },
    {
      chapter: '21',
      description: 'Miscellaneous edible preparations',
      confidence: 0.7,
      keywords: ['snack', 'prepared', 'food', 'mixed'],
      excludeKeywords: ['beverage', 'drink']
    },
    {
      chapter: '04',
      description: 'Dairy produce; birds eggs; natural honey',
      confidence: 0.85,
      keywords: ['cheese', 'dairy', 'milk', 'cream'],
      excludeKeywords: ['plant-based', 'vegan']
    }
  ];

  private readonly confidenceThresholds = {
    high: 0.8,
    medium: 0.5,
    low: 0.3
  };

  /**
   * Map a product group to its most likely HS chapter
   */
  mapToChapter(group: ProductGroup): MappingResult {
    try {
      const matches = this.findMatchingChapters(group);
      const [bestMatch, ...alternatives] = matches;

      if (!bestMatch) {
        logger.warn(`No chapter mapping found for product group: ${group.baseType}`);
        return this.getFallbackMapping(group);
      }

      return {
        chapter: bestMatch.chapter,
        confidence: bestMatch.confidence,
        description: bestMatch.description,
        alternativeChapters: alternatives.map(alt => ({
          chapter: alt.chapter,
          confidence: alt.confidence,
          description: alt.description
        })),
        needsReview: bestMatch.confidence < this.confidenceThresholds.high
      };
    } catch (error) {
      logger.error('Error mapping product to HS chapter:', error);
      return this.getFallbackMapping(group);
    }
  }

  /**
   * Find matching chapters for a product group, sorted by confidence
   */
  private findMatchingChapters(group: ProductGroup): Array<HSChapterMapping & { confidence: number }> {
    return this.chapterMappings
      .map(mapping => {
        const confidence = this.calculateMappingConfidence(group, mapping);
        return { ...mapping, confidence };
      })
      .filter(mapping => mapping.confidence >= this.confidenceThresholds.low)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for a mapping based on keywords and attributes
   */
  private calculateMappingConfidence(group: ProductGroup, mapping: HSChapterMapping): number {
    let score = 0;
    const searchText = this.getSearchableText(group);

    // Check required attributes
    if (mapping.requiresAttributes) {
      const hasRequiredAttributes = mapping.requiresAttributes.every(attr => 
        group.attributes[attr] !== undefined
      );
      if (!hasRequiredAttributes) {
        return 0;
      }
    }

    // Check exclude keywords
    if (mapping.excludeKeywords?.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    )) {
      return 0;
    }

    // Calculate keyword matches
    const matchedKeywords = mapping.keywords.filter(keyword =>
      searchText.includes(keyword.toLowerCase())
    );

    score = (matchedKeywords.length / mapping.keywords.length) * mapping.confidence;

    // Boost score based on attributes
    if (group.attributes.mainIngredient) {
      const ingredientMatch = mapping.keywords.some(keyword =>
        group.attributes.mainIngredient?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (ingredientMatch) {
        score *= 1.2;
      }
    }

    // Cap score at original confidence
    return Math.min(score, mapping.confidence);
  }

  /**
   * Get searchable text from product group
   */
  private getSearchableText(group: ProductGroup): string {
    const texts = [
      group.baseType,
      group.description,
      group.attributes.mainIngredient,
      group.attributes.preparationType,
      ...group.variants.map(v => v.name)
    ];

    return texts
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  /**
   * Get fallback mapping for when no good match is found
   */
  private getFallbackMapping(group: ProductGroup): MappingResult {
    return {
      chapter: '21', // Miscellaneous edible preparations
      confidence: this.confidenceThresholds.low,
      description: 'Miscellaneous edible preparations',
      alternativeChapters: [],
      needsReview: true
    };
  }

  suggestHsCode(productDetails: ProductDetails): HSCodeSuggestion | null {
    const { mainIngredient, preparationMethod, productState } = productDetails;
    
    // Example logic for suggesting HS codes based on product details
    if (mainIngredient === 'Meat') {
      if (preparationMethod === 'Frozen') {
        return { code: '0207.12', confidence: 0.9 }; // Frozen poultry
      }
      if (preparationMethod === 'Cooked') {
        return { code: '1602.32', confidence: 0.85 }; // Prepared poultry
      }
    }
    
    if (mainIngredient === 'Fish') {
      if (preparationMethod === 'Fresh') {
        return { code: '0302.99', confidence: 0.9 }; // Fresh fish
      }
      if (preparationMethod === 'Frozen') {
        return { code: '0303.89', confidence: 0.9 }; // Frozen fish
      }
    }
    
    if (mainIngredient === 'Vegetables') {
      if (preparationMethod === 'Fresh') {
        return { code: '0709.99', confidence: 0.85 }; // Fresh vegetables
      }
      if (preparationMethod === 'Frozen') {
        return { code: '0710.90', confidence: 0.9 }; // Frozen vegetables
      }
    }
    
    if (mainIngredient === 'Dairy') {
      return { code: '0406.90', confidence: 0.8 }; // Cheese and curd
    }
    
    if (mainIngredient === 'Cereals') {
      if (productState === 'Ready-to-eat') {
        return { code: '1904.10', confidence: 0.85 }; // Prepared cereals
      }
      return { code: '1104.19', confidence: 0.7 }; // Worked cereals
    }
    
    // Default fallback for mixed or unknown products
    return { code: '2106.90', confidence: 0.4 }; // Food preparations not elsewhere specified
  }
} 