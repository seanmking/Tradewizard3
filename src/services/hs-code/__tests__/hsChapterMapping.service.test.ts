import { HSChapterMappingService } from '../hsChapterMapping.service';
import { ProductGroup } from '../../product/productConsolidation.service';

describe('HSChapterMappingService', () => {
  let service: HSChapterMappingService;

  beforeEach(() => {
    service = new HSChapterMappingService();
  });

  describe('mapToChapter', () => {
    it('should correctly map meat-based prepared products to chapter 16', () => {
      const group: ProductGroup = {
        baseType: 'Chicken Snacks',
        description: 'Breaded chicken snacks',
        variants: [
          { id: '1', name: 'Crispy Chicken Nuggets' },
          { id: '2', name: 'Spicy Chicken Strips' }
        ],
        attributes: {
          mainIngredient: 'Chicken',
          preparationType: 'Breaded'
        }
      };

      const result = service.mapToChapter(group);

      expect(result.chapter).toBe('16');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.needsReview).toBe(false);
    });

    it('should correctly map corn-based products to chapter 19', () => {
      const group: ProductGroup = {
        baseType: 'Corn Dogs',
        description: 'Corn-based snack products',
        variants: [
          { id: '1', name: 'Original Corn Dogs' },
          { id: '2', name: 'Mini Corn Dogs' }
        ],
        attributes: {
          mainIngredient: 'Corn',
          preparationType: 'Breaded and Fried'
        }
      };

      const result = service.mapToChapter(group);

      expect(result.chapter).toBe('19');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.needsReview).toBe(false);
    });

    it('should correctly map cheese-based products to chapter 04', () => {
      const group: ProductGroup = {
        baseType: 'Cheese Snacks',
        description: 'Cheese-based snack products',
        variants: [
          { id: '1', name: 'Mozzarella Sticks' },
          { id: '2', name: 'Cheese Bites' }
        ],
        attributes: {
          mainIngredient: 'Cheese',
          preparationType: 'Breaded'
        }
      };

      const result = service.mapToChapter(group);

      expect(result.chapter).toBe('04');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.needsReview).toBe(false);
    });

    it('should return alternative chapters when confidence is not high', () => {
      const group: ProductGroup = {
        baseType: 'Mixed Snacks',
        description: 'Mixed snack platter',
        variants: [
          { id: '1', name: 'Party Mix Platter' },
          { id: '2', name: 'Assorted Snacks' }
        ],
        attributes: {
          mainIngredient: 'Mixed',
          preparationType: 'Various'
        }
      };

      const result = service.mapToChapter(group);

      expect(result.alternativeChapters.length).toBeGreaterThan(0);
      expect(result.needsReview).toBe(true);
    });

    it('should use fallback mapping for unknown products', () => {
      const group: ProductGroup = {
        baseType: 'Unknown Product',
        description: 'New innovative snack',
        variants: [
          { id: '1', name: 'Mystery Snack' }
        ],
        attributes: {
          mainIngredient: 'Unknown',
          preparationType: 'Novel'
        }
      };

      const result = service.mapToChapter(group);

      expect(result.chapter).toBe('21'); // Miscellaneous edible preparations
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.needsReview).toBe(true);
    });

    it('should exclude products with matching exclude keywords', () => {
      const group: ProductGroup = {
        baseType: 'Fresh Chicken',
        description: 'Fresh raw chicken products',
        variants: [
          { id: '1', name: 'Fresh Chicken Pieces' }
        ],
        attributes: {
          mainIngredient: 'Chicken',
          preparationType: 'Fresh'
        }
      };

      const result = service.mapToChapter(group);

      // Should not map to chapter 16 due to 'fresh' exclude keyword
      expect(result.chapter).not.toBe('16');
      expect(result.needsReview).toBe(true);
    });
  });
}); 