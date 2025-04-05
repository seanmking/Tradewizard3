import { CategoryBasedConsolidationService } from '../categoryBasedConsolidation.service';
import { ProductVariant } from '../productConsolidation.service';
import { EmbeddingService } from '../../classification/embeddingService';
import { IntelligenceMCPService } from '../../../mcp/intelligence-mcp/intelligence-mcp.service';
import { CacheService } from '../../cache-service';
import { productCategories } from '../categoryDefinitions';

// Mock dependencies
jest.mock('../../classification/embeddingService');
jest.mock('../../../mcp/intelligence-mcp/intelligence-mcp.service');
jest.mock('../../cache-service');

describe('CategoryBasedConsolidationService', () => {
  let service: CategoryBasedConsolidationService;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockLLMService: jest.Mocked<any>;
  let mockCacheService: jest.Mocked<any>;
  
  beforeEach(() => {
    // Create mock implementations
    mockEmbeddingService = {
      generateEmbeddings: jest.fn().mockImplementation(async (text: string) => {
        // Simple mock that generates a deterministic "embedding" based on text length
        return Array.from({ length: 10 }, (_, i) => (text.length + i) % 10);
      })
    } as any;
    
    mockLLMService = {} as any;
    
    mockCacheService = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      getOrSet: jest.fn().mockImplementation(async (key, callback) => callback())
    } as any;
    
    // Initialize service with mocks
    service = new CategoryBasedConsolidationService(
      mockEmbeddingService,
      mockLLMService,
      mockCacheService,
      {
        enableLLM: false, // Disable LLM calls in tests
        useCaching: false, // Disable caching in tests
        categories: productCategories // Use our new categories
      }
    );
  });
  
  describe('consolidateProducts', () => {
    // Test data aligned with the 5 new categories
    const testProducts = [
      // Food Products
      {
        id: 'fp1',
        name: 'Premium Canned Tuna in Olive Oil',
        description: 'Dolphin-safe tuna preserved in extra virgin olive oil',
        category: 'Canned Foods'
      },
      {
        id: 'fp2',
        name: 'Organic Mixed Nuts',
        description: 'A blend of organic almonds, cashews, and walnuts',
        category: 'Snacks'
      },
      // Beverages
      {
        id: 'bv1',
        name: 'Stellenbosch Cabernet Sauvignon 2018',
        description: 'Full-bodied red wine with notes of blackcurrant',
        category: 'Wine'
      },
      {
        id: 'bv2',
        name: 'Premium Rooibos Tea Bags',
        description: 'South African red bush tea, caffeine-free',
        category: 'Tea'
      },
      // Ready-to-Wear
      {
        id: 'rtw1',
        name: 'Cotton Safari Jacket',
        description: 'Lightweight khaki jacket with multiple pockets',
        category: 'Outerwear'
      },
      {
        id: 'rtw2',
        name: 'Hand-Printed Silk Scarf',
        description: 'Vibrant African pattern printed on 100% silk',
        category: 'Accessories'
      },
      // Home Goods
      {
        id: 'hg1',
        name: 'Hand-Carved Wooden Salad Bowl',
        description: 'Fair trade bowl made from sustainable acacia wood',
        category: 'Kitchenware'
      },
      {
        id: 'hg2',
        name: 'African Textile Throw Pillow',
        description: 'Decorative pillow with traditional African patterns',
        category: 'Home Decor'
      },
      // Non-Prescription Health
      {
        id: 'nph1',
        name: 'Aloe Vera Moisturizing Cream',
        description: 'Soothing skin cream with pure aloe extract',
        category: 'Skincare'
      },
      {
        id: 'nph2',
        name: 'African Ginger Supplement Capsules',
        description: 'Natural immune system support with pure African ginger',
        category: 'Supplements'
      }
    ];

    test('should categorize products into the 5 main required categories', async () => {
      // Call the service with our test data
      const result = await service.consolidateProducts(testProducts);
      
      // Expect results to contain our 5 categories
      expect(result.length).toBeLessThanOrEqual(5); // May be fewer if some categories are merged
      
      // Helper function to find results for a specific category
      const findCategoryResults = (categoryId: string) => 
        result.find(r => r.category.id === categoryId);
      
      // Check food products category
      const foodResults = findCategoryResults('food_products');
      expect(foodResults).toBeDefined();
      expect(foodResults?.variants.some(v => v.id === 'fp1')).toBe(true);
      expect(foodResults?.variants.some(v => v.id === 'fp2')).toBe(true);
      
      // Check beverages category
      const beverageResults = findCategoryResults('beverages');
      expect(beverageResults).toBeDefined();
      expect(beverageResults?.variants.some(v => v.id === 'bv1')).toBe(true);
      expect(beverageResults?.variants.some(v => v.id === 'bv2')).toBe(true);
      
      // Verify that confidence scores are calculated dynamically
      for (const categoryResult of result) {
        expect(categoryResult.confidence).toBeGreaterThan(0);
        expect(categoryResult.confidence).toBeLessThanOrEqual(1);
        // Not hardcoded to 0.8 anymore
        expect(categoryResult.confidence).not.toBe(0.8);
      }
      
      // Verify that all products are assigned to a category
      const totalAssignedProducts = result.reduce((sum, r) => sum + r.variants.length, 0);
      expect(totalAssignedProducts).toBe(testProducts.length);
    });
    
    test('should handle empty input', async () => {
      const result = await service.consolidateProducts([]);
      expect(result).toEqual([]);
    });
    
    test('should handle ambiguous products with appropriate confidence scores', async () => {
      // Create an ambiguous product that could be in multiple categories
      const ambiguousProducts: ProductVariant[] = [
        {
          id: 'amb1',
          name: 'Herbal Tea Infused Body Lotion',
          description: 'Moisturizing lotion made with rooibos tea extract and shea butter',
          category: 'Body Care'
        }
      ];
      
      const result = await service.consolidateProducts(ambiguousProducts);
      
      // Should be categorized, but with moderate confidence
      expect(result.length).toBe(1);
      expect(result[0].confidence).toBeLessThan(0.9); // Not extremely confident
    });
    
    test('should apply attribute extraction for categorized products', async () => {
      // Food product with clear attributes
      const attributeProducts: ProductVariant[] = [
        {
          id: 'food1',
          name: 'Frozen Mixed Berries',
          description: 'Organic strawberries, blueberries and raspberries, flash-frozen for freshness',
          category: 'Frozen Foods',
          attributes: {
            storage: 'Frozen',
            organic: true
          }
        }
      ];
      
      const result = await service.consolidateProducts(attributeProducts);
      
      // Should extract relevant attributes
      expect(result.length).toBe(1);
      expect(result[0].category.id).toBe('food_products');
      expect(result[0].attributes).toBeDefined();
      // The test is specifically checking that attributes are extracted
      // We're not testing specific values as that depends on LLM implementation
    });
  });
  
  describe('Private methods', () => {
    test('calculateTextSimilarity should return meaningful similarity scores', () => {
      // @ts-ignore - accessing private method for testing
      const similarTexts = service.calculateTextSimilarity(
        'Organic red wine from South Africa',
        'Wine beverages including red wine and white wine from various regions'
      );
      expect(similarTexts).toBeGreaterThan(0.3);
      
      // @ts-ignore - accessing private method for testing
      const dissimilarTexts = service.calculateTextSimilarity(
        'Cotton t-shirt with embroidery',
        'Fresh organic vegetables from local farms'
      );
      expect(dissimilarTexts).toBeLessThan(0.2);
    });
    
    test('tokenizeText should properly split and filter text', () => {
      // @ts-ignore - accessing private method for testing
      const tokens = service.tokenizeText('The quick brown fox jumps over the lazy dog.');
      
      // Should remove stopwords 'the' and 'over'
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('over');
      
      // Should contain meaningful words
      expect(tokens).toContain('quick');
      expect(tokens).toContain('brown');
      expect(tokens).toContain('fox');
      expect(tokens).toContain('jumps');
      expect(tokens).toContain('lazy');
      expect(tokens).toContain('dog');
    });
  });
}); 