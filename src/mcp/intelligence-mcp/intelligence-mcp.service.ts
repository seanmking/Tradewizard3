import axios from 'axios';
import { logger } from '@/utils/logger';
import { 
  IntelligenceMCP, 
  IntelligenceEnrichmentRequest, 
  IntelligenceEnrichmentResponse 
} from './intelligence-mcp.interface';
import { ExtractedEntity } from '@/types/extraction';
import { productCategories } from '@/data/product-categories.data';

interface CacheEntry {
  response: string;
  timestamp: number;
}

export class IntelligenceMCPService implements IntelligenceMCP {
  private perplexityApiKey: string;
  private perplexityUrl: string;
  private responseCache: Map<string, CacheEntry>;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
    this.perplexityUrl = 'https://api.perplexity.ai/chat/completions';
    this.responseCache = new Map();
    
    if (!this.perplexityApiKey) {
      logger.warn('Perplexity API key not configured');
    }
    
    // Clean expired cache entries periodically
    setInterval(() => this.cleanExpiredCache(), this.CACHE_TTL);
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    Array.from(this.responseCache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.responseCache.delete(key);
      }
    });
  }
  
  private getCacheKey(prompt: string): string {
    // Create a deterministic hash of the prompt
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `perplexity_${hash}`;
  }
  
  public async enrichBusinessData(request: IntelligenceEnrichmentRequest): Promise<IntelligenceEnrichmentResponse> {
    const startTime = Date.now();
    
    try {
      // Extract business and product entities
      const businessEntities = request.extractedEntities.filter(e => e.type === 'business');
      const productEntities = request.extractedEntities.filter(e => e.type === 'product');
      
      // Enrich with Perplexity if API key is available
      let enrichedEntities = [...request.extractedEntities];
      let perplexityUsed = false;
      
      if (this.perplexityApiKey) {
        // Validate and enrich business information
        if (businessEntities.length > 0) {
          enrichedEntities = await this.enrichBusinessEntities(
            enrichedEntities,
            businessEntities,
            request.sourceUrl
          );
        }
        
        // Validate and enrich product information
        if (productEntities.length > 0) {
          enrichedEntities = await this.enrichProductEntities(
            enrichedEntities,
            productEntities,
            request.sourceUrl
          );
        }
        
        perplexityUsed = true;
      }

      // For products that failed enrichment, assign default categories
      enrichedEntities = enrichedEntities.map(entity => {
        if (entity.type === 'product' && !entity.attributes.category) {
          return {
            ...entity,
            attributes: {
              ...entity.attributes,
              category: 'Uncategorized',
              suggestedCategories: this.suggestCategories(entity.name, entity.attributes.description || ''),
              needsUserCategorization: true,
              enrichmentStatus: 'needs_review',
              validationStatus: entity.attributes.lowConfidence ? 'low_confidence' : 'validated'
            }
          };
        }
        return entity;
      });
      
      return {
        enrichedEntities,
        confidence: this.calculateOverallConfidence(enrichedEntities),
        metadata: {
          perplexityUsed,
          scrapingMethod: request.rawContent ? 'axios-cheerio' : 'puppeteer',
          validationScore: this.calculateValidationScore(enrichedEntities),
          processingTime: Date.now() - startTime,
          enrichmentStatus: 'completed_with_suggestions'
        }
      };
      
    } catch (error) {
      logger.error(`Error in enrichBusinessData: ${error}`);
      return {
        enrichedEntities: request.extractedEntities,
        confidence: 0.5,
        metadata: {
          perplexityUsed: false,
          scrapingMethod: 'failed',
          validationScore: 0.5,
          processingTime: Date.now() - startTime,
          enrichmentStatus: 'failed'
        }
      };
    }
  }
  
  private async enrichBusinessEntities(
    allEntities: ExtractedEntity[],
    businessEntities: ExtractedEntity[],
    sourceUrl: string
  ): Promise<ExtractedEntity[]> {
    const enriched = [...allEntities];
    
    for (const entity of businessEntities) {
      try {
        const prompt = `
          Validate and enrich this business information from ${sourceUrl}:
          
          Business Name: ${entity.name}
          Description: ${entity.attributes.description || 'N/A'}
          Type: ${entity.attributes.businessType || 'N/A'}
          
          Please provide:
          1. Verification of business name and type
          2. Additional business details found online
          3. Confidence score (0-1) for the information
          
          Return as JSON with properties: verified, enrichedName, enrichedType, additionalDetails, confidence
        `;
        
        const response = await this.callPerplexityAPI(prompt);
        const enrichment = this.parsePerplexityResponse(response);
        
        // Update entity with enriched information
        if (enrichment.verified) {
          entity.name = enrichment.enrichedName || entity.name;
          entity.attributes.businessType = enrichment.enrichedType || entity.attributes.businessType;
          entity.attributes.additionalDetails = enrichment.additionalDetails;
          entity.confidence = (entity.confidence + enrichment.confidence) / 2;
          entity.verified = true;
        }
      } catch (error) {
        logger.warn(`Error enriching business entity ${entity.name}: ${error}`);
      }
    }
    
    return enriched;
  }
  
  private async enrichProductEntities(
    allEntities: ExtractedEntity[],
    productEntities: ExtractedEntity[],
    sourceUrl: string
  ): Promise<ExtractedEntity[]> {
    const enriched = [...allEntities];
    
    for (const entity of productEntities) {
      try {
        // Get category suggestions first
        const suggestions = this.suggestCategories(entity.name, entity.attributes.description || '');
        
        // Use the suggestions to enhance the Perplexity prompt
        const prompt = `
          You are analyzing a product from ${sourceUrl}. 
          
          Product Details:
          Name: ${entity.name}
          Description: ${entity.attributes.description || 'N/A'}
          Suggested Categories: ${suggestions.join(', ')}
          
          Available Categories:
          1. Food Products
             - Frozen/Canned Goods (frozen vegetables, canned fruits, frozen meals, seafood)
             - Processed Foods (snacks, confectionery, baked goods, dry mixes)
             - Ready Meals (pre-prepared meals, convenience foods)
             - Snacks (chips, crisps, nuts, dried fruits)
          2. Beverages
             - Alcoholic Beverages (wine, beer, spirits, cider)
             - Non-Alcoholic Beverages (fruit juices, soft drinks, water, tea products)
          
          IMPORTANT GUIDELINES:
          - Consider ALL product variants and flavors as valid products
          - Include products that might be seasonal or limited editions
          - Accept products that are similar to known offerings
          - Be inclusive of product variations and regional names
          - Consider the suggested categories as strong indicators
          
          Task:
          1. Determine if this is a real product (not a category/navigation element)
          2. Identify product specifications:
             - Main category (from the categories above)
             - Specific subcategory
             - Product characteristics
             - Storage requirements
          3. Assign confidence score (0-1)
          
          Return JSON with properties:
          {
            "isRealProduct": true/false,
            "enrichedName": "standardized product name",
            "mainCategory": "exact category name from list",
            "subcategory": "exact subcategory name from list",
            "characteristics": {
              "storageType": "frozen/chilled/ambient",
              "ingredients": ["ingredient1", "ingredient2"]
            },
            "confidence": 0.0-1.0
          }
        `;
        
        const response = await this.callPerplexityAPI(prompt);
        const enrichment = this.parsePerplexityResponse(response);
        
        // Update entity with enriched information
        if (enrichment.isRealProduct !== false) {
          entity.name = enrichment.enrichedName || entity.name;
          entity.attributes.description = entity.attributes.description || '';
          entity.attributes.mainCategory = enrichment.mainCategory;
          entity.attributes.subcategory = enrichment.subcategory;
          
          if (enrichment.characteristics) {
            entity.attributes.storageType = enrichment.characteristics.storageType;
            entity.attributes.ingredients = enrichment.characteristics.ingredients;
          }
          
          // Find the matching category and subcategory
          const category = productCategories.find(
            cat => cat.name.toLowerCase() === enrichment.mainCategory.toLowerCase()
          );
          
          if (category) {
            const subcategory = category.subcategories.find(
              sub => sub.name.toLowerCase() === enrichment.subcategory.toLowerCase()
            );
            
            if (subcategory) {
              entity.attributes.hsCode = subcategory.hsCode;
              entity.attributes.requirements = subcategory.requirements;
              entity.attributes.examples = subcategory.examples;
              entity.attributes.categoryDescription = subcategory.description;
            }
          }
          
          entity.confidence = Math.max((entity.confidence + enrichment.confidence) / 2, 0.6);
          entity.verified = true;
        } else {
          // Keep the product but mark it as needing review
          entity.verified = true;
          entity.confidence = 0.6;
          entity.attributes.needsReview = true;
          entity.attributes.suggestedCategories = suggestions;
        }
      } catch (error) {
        logger.warn(`Error enriching product entity ${entity.name}: ${error}`);
        // On error, keep the product and mark for review
        entity.verified = true;
        entity.confidence = 0.5;
        entity.attributes.needsReview = true;
        entity.attributes.suggestedCategories = this.suggestCategories(entity.name, entity.attributes.description || '');
      }
    }
    
    // Keep all products but mark those needing review
    return enriched;
  }
  
  private async callPerplexityAPI(prompt: string, maxRetries = 3): Promise<string> {
    // Check cache first
    const cacheKey = this.getCacheKey(prompt);
    const cachedEntry = this.responseCache.get(cacheKey);
    
    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.CACHE_TTL) {
      logger.info('Using cached Perplexity response');
      return cachedEntry.response;
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post<{
          choices: Array<{
            message: {
              content: string;
            };
          }>;
        }>(
          this.perplexityUrl,
          {
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a precise business intelligence assistant. Validate and enrich business information with high accuracy. Return all responses in JSON format.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000
          },
          {
            headers: {
              'Authorization': `Bearer ${this.perplexityApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const content = response.data.choices[0].message.content;
        
        // Cache the successful response
        this.responseCache.set(cacheKey, {
          response: content,
          timestamp: Date.now()
        });
        
        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Perplexity API call attempt ${attempt} failed: ${lastError.message}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All Perplexity API call attempts failed');
  }
  
  private parsePerplexityResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error(`Error parsing Perplexity response: ${error}`);
      return {};
    }
  }
  
  private calculateOverallConfidence(entities: ExtractedEntity[]): number {
    if (entities.length === 0) return 0;
    
    const confidenceSum = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return confidenceSum / entities.length;
  }
  
  private calculateValidationScore(entities: ExtractedEntity[]): number {
    const verifiedEntities = entities.filter(e => e.verified).length;
    return entities.length > 0 ? verifiedEntities / entities.length : 0;
  }

  private suggestCategories(productName: string, description: string): string[] {
    const combinedText = `${productName} ${description}`.toLowerCase();
    const suggestions: string[] = [];

    // Enhanced category mapping with more specific food keywords
    const categoryKeywords: Record<string, string[]> = {
      'Food Products': [
        'food', 'snack', 'meal', 'burger', 'chicken', 'meat', 'corn', 'cheese',
        'pops', 'nuggets', 'patties', 'dogs', 'sausages', 'boerie', 'adventure',
        'pocket', 'wrap', 'roll', 'bite', 'crispy', 'crunchy', 'melty'
      ],
      'Frozen Foods': [
        'frozen', 'ice cream', 'cold', 'freezer', 'chilled', 
        'frozen meal', 'frozen snack', 'frozen food'
      ],
      'Snacks': [
        'snack', 'chips', 'crisps', 'pops', 'bites', 'nibbles', 
        'treats', 'munchies', 'pocket', 'popcorn', 'crackers'
      ],
      'Ready Meals': [
        'ready', 'meal', 'prepared', 'instant', 'quick', 'easy',
        'heat and eat', 'microwave', 'convenience'
      ],
      'Processed Foods': [
        'processed', 'packaged', 'preserved', 'convenience',
        'ready-to-eat', 'pre-cooked', 'pre-prepared'
      ]
    };

    // Enhanced matching logic
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      // Check for exact matches first
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        suggestions.push(category);
        return;
      }

      // Check for partial matches
      const words = combinedText.split(/\s+/);
      for (const word of words) {
        if (keywords.some(keyword => {
          // Check if the word is similar to any keyword
          return keyword.includes(word) || word.includes(keyword) ||
                 this.levenshteinDistance(word, keyword) <= 2; // Allow small typos
        })) {
          suggestions.push(category);
          return;
        }
      }
    });

    // If no matches found, use product characteristics to suggest categories
    if (suggestions.length === 0) {
      if (combinedText.includes('frozen') || combinedText.includes('cold') || 
          combinedText.includes('chill') || combinedText.includes('ice')) {
        suggestions.push('Frozen Foods');
      }
      if (combinedText.includes('quick') || combinedText.includes('easy') || 
          combinedText.includes('instant') || combinedText.includes('ready')) {
        suggestions.push('Ready Meals');
      }
      if (combinedText.includes('pack') || combinedText.includes('box') || 
          combinedText.includes('wrapped')) {
        suggestions.push('Processed Foods');
      }
    }

    // Always include 'Food Products' as a fallback
    if (suggestions.length === 0) {
      suggestions.push('Food Products');
    }

    // Remove duplicates and return
    return Array.from(new Set(suggestions));
  }

  // Helper function to calculate Levenshtein distance for fuzzy matching
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }
} 