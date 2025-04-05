import { HSCodeHierarchyService, HSCodeRequest } from '../hsCodeHierarchy.service';
import { HSCodeTariffMCPService } from '../../../mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.service';
import { CacheService } from '../../cache-service';

// Mock dependencies
jest.mock('../../../mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.service');
jest.mock('../../cache-service');

describe('HSCodeHierarchyService', () => {
  let service: HSCodeHierarchyService;
  let mockHSCodeService: jest.Mocked<HSCodeTariffMCPService>;
  let mockCacheService: jest.Mocked<CacheService<any>>;
  
  beforeEach(() => {
    // Create mock implementations
    mockHSCodeService = {
      getTariffByHsCode: jest.fn().mockImplementation(async (hsCode: string) => {
        // Mock response for chapter info
        if (hsCode.endsWith('01')) {
          const chapterCode = hsCode.substring(0, 2);
          return [{
            hsCode,
            description: `Product with HS code ${hsCode}`,
            section: 'Test Section',
            chapter: `Chapter ${chapterCode} - Test Chapter`,
            isRestrictedGood: false,
            notes: [],
            relatedCodes: []
          }];
        }
        
        return [{
          hsCode,
          description: `Product with HS code ${hsCode}`,
          section: 'Test Section',
          chapter: 'Test Chapter',
          isRestrictedGood: false,
          notes: [],
          relatedCodes: []
        }];
      }),
      searchHSCodes: jest.fn().mockImplementation(async (request) => {
        // Mock some search results with different confidence levels
        return [
          {
            code: '2204',
            description: 'Wine of fresh grapes',
            matchConfidence: 0.95
          },
          {
            code: '2208',
            description: 'Spirits, liqueurs and other spirituous beverages',
            matchConfidence: 0.85
          },
          {
            code: '2203',
            description: 'Beer made from malt',
            matchConfidence: 0.75
          },
          {
            code: '2206',
            description: 'Other fermented beverages',
            matchConfidence: 0.65
          },
          {
            code: '1806',
            description: 'Chocolate and other food preparations containing cocoa',
            matchConfidence: 0.55
          }
        ];
      })
    } as any;
    
    mockCacheService = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      getOrSet: jest.fn().mockImplementation(async (key, callback) => callback())
    } as any;
    
    // Initialize service with mocks
    service = new HSCodeHierarchyService(
      mockHSCodeService,
      mockCacheService,
      {
        useCaching: false, // Disable caching in tests
        confidenceThreshold: 0.6
      }
    );
  });
  
  describe('getSuggestedHSCodes', () => {
    test('should return HS code suggestions for a category', async () => {
      const request: HSCodeRequest = {
        productCategory: 'beverages',
        productName: 'Red Wine',
        productDescription: 'Premium red wine from South Africa'
      };
      
      const result = await service.getSuggestedHSCodes(request);
      
      // Should return suggestions
      expect(result.length).toBeGreaterThan(0);
      
      // Should call search with the product description
      expect(mockHSCodeService.searchHSCodes).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: expect.stringContaining('Red Wine'),
          exactMatch: false
        })
      );
      
      // The top suggestion should be wine-related
      expect(result[0].code).toBe('2204');
      expect(result[0].description).toBe('Wine of fresh grapes');
      
      // Confidence should be high for the top match
      expect(result[0].confidence).toBeGreaterThan(0.9);
    });
    
    test('should filter out low-confidence suggestions', async () => {
      // Override searchHSCodes to return low confidence results
      mockHSCodeService.searchHSCodes.mockImplementationOnce(async () => [
        { code: '2204', description: 'Wine of fresh grapes', matchConfidence: 0.55 },
        { code: '2208', description: 'Spirits', matchConfidence: 0.45 }
      ]);
      
      const request: HSCodeRequest = {
        productCategory: 'beverages',
        productName: 'Red Wine',
        productDescription: 'Premium red wine from South Africa'
      };
      
      const result = await service.getSuggestedHSCodes(request);
      
      // Should only include results above the confidence threshold (0.6)
      // Since both are below, it should fall back to category-based suggestions
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(r => r.confidence >= 0.6)).toBe(true);
    });
    
    test('should boost confidence for suggestions matching preferred chapters', async () => {
      // Create a request for a product that could match multiple categories
      const request: HSCodeRequest = {
        productCategory: 'beverages',
        productName: 'Chocolate Drink',
        productDescription: 'Chocolate milk drink with cocoa'
      };
      
      const result = await service.getSuggestedHSCodes(request);
      
      // Find the beverage suggestion and the chocolate suggestion
      const beverageSuggestion = result.find(r => r.code.startsWith('22'));
      const chocolateSuggestion = result.find(r => r.code === '1806');
      
      if (beverageSuggestion && chocolateSuggestion) {
        // The beverage suggestion should have higher confidence due to boost
        expect(beverageSuggestion.confidence).toBeGreaterThan(chocolateSuggestion.confidence);
      }
    });
    
    test('should return category suggestions when no product details are provided', async () => {
      const request: HSCodeRequest = {
        productCategory: 'ready_to_wear'
      };
      
      const result = await service.getSuggestedHSCodes(request);
      
      // Should not call search since no product details
      expect(mockHSCodeService.searchHSCodes).not.toHaveBeenCalled();
      
      // Should return suggestions based on ready-to-wear category
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.code === '61')).toBe(true); // Knitted apparel
      expect(result.some(r => r.code === '62')).toBe(true); // Non-knitted apparel
      
      // Confidence should be medium for category-only suggestions
      expect(result[0].confidence).toBe(0.7);
    });
  });
  
  describe('getHSCodeChildren', () => {
    test('should get children for a chapter', async () => {
      // Mock the cache service to return chapter data
      mockCacheService.get.mockImplementation((key: string) => {
        if (key.includes('headings:22')) {
          // Return mock headings for chapter 22
          return [
            { code: '2201', description: 'Waters', level: 'heading', parent: '22' },
            { code: '2202', description: 'Sweetened waters', level: 'heading', parent: '22' },
            { code: '2203', description: 'Beer', level: 'heading', parent: '22' },
            { code: '2204', description: 'Wine', level: 'heading', parent: '22' }
          ];
        }
        return null;
      });
      
      const result = await service.getHSCodeChildren('22');
      
      // Should return child headings for chapter 22
      expect(result.length).toBe(4);
      expect(result.every(r => r.level === 'heading')).toBe(true);
      expect(result.some(r => r.code === '2204')).toBe(true);
    });
    
    test('should handle errors when fetching children', async () => {
      // Mock the service to throw an error
      mockHSCodeService.getTariffByHsCode.mockImplementationOnce(() => {
        throw new Error('API error');
      });
      
      const result = await service.getHSCodeChildren('62');
      
      // Should handle error and return empty array
      expect(result).toEqual([]);
    });
  });
  
  describe('Integration with product categories', () => {
    test('should map food_products category to appropriate HS chapters', async () => {
      const request: HSCodeRequest = {
        productCategory: 'food_products'
      };
      
      const result = await service.getSuggestedHSCodes(request);
      
      // Should include food-related chapters
      expect(result.some(r => r.code === '16')).toBe(true); // Preparations of meat
      expect(result.some(r => r.code === '19')).toBe(true); // Cereals, flour, starch
      expect(result.some(r => r.code === '20')).toBe(true); // Vegetables, fruit, nuts
    });
    
    test('should map non_prescription_health category to appropriate HS chapters', async () => {
      const request: HSCodeRequest = {
        productCategory: 'non_prescription_health'
      };
      
      const result = await service.getSuggestedHSCodes(request);
      
      // Should include health-related chapters
      expect(result.some(r => r.code === '30')).toBe(true); // Pharmaceutical products
      expect(result.some(r => r.code === '33')).toBe(true); // Essential oils and cosmetics
    });
  });
}); 