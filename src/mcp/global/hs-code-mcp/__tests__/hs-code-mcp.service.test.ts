import { HsCodeMCPService } from '../hs-code-mcp.service';
import { WITSAPIClient } from '../wits-api-client';
import { ClassificationMatch, ProductExample, HSChapter, HSHeading, HSSubheading } from '../hs-code.types';

// Mock dependencies
jest.mock('../wits-api-client');
jest.mock('@/services/cache/cache');
jest.mock('@/services/ai/embedding.service');
jest.mock('@/services/product/product-mapper.service');

describe('HsCodeMCPService', () => {
  let service: HsCodeMCPService;
  let mockWitsApiClient: jest.Mocked<WITSAPIClient>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Initialize the service
    service = new HsCodeMCPService();
    
    // Get mock instance
    mockWitsApiClient = WITSAPIClient as unknown as jest.Mocked<WITSAPIClient>;
    
    // Set up default mock implementations
    mockWitsApiClient.searchHSCodes.mockResolvedValue([
      {
        hsCode: '8517.12',
        description: 'Mobile phones',
        confidence: 95,
        metadata: {
          chapter: { code: '85', name: 'Electrical machinery', description: 'Electrical machinery and equipment' },
          heading: { code: '8517', name: 'Telephones', description: 'Telephone sets' },
          subheading: { code: '851712', name: 'Mobile phones', description: 'Telephones for cellular networks' }
        }
      }
    ]);
    
    mockWitsApiClient.getProductExamples.mockResolvedValue([
      {
        name: 'Smartphone',
        description: 'Modern touchscreen mobile phone',
        hsCode: '851712'
      }
    ]);
    
    mockWitsApiClient.getChapters.mockResolvedValue([
      {
        code: '85',
        name: 'Electrical machinery',
        description: 'Electrical machinery and equipment'
      }
    ]);
    
    mockWitsApiClient.getHeadings.mockResolvedValue([
      {
        code: '8517',
        name: 'Telephones',
        description: 'Telephone sets'
      }
    ]);
    
    mockWitsApiClient.getSubheadings.mockResolvedValue([
      {
        code: '851712',
        name: 'Mobile phones',
        description: 'Telephones for cellular networks'
      }
    ]);
  });
  
  describe('classifyProduct', () => {
    it('should classify products correctly', async () => {
      // Mock the private method using any
      (service as any).getMultiSourceClassification = jest.fn().mockResolvedValue([
        {
          hsCode: '851712',
          description: 'Mobile phones',
          confidence: 95
        }
      ]);
      
      const result = await service.classifyProduct({
        productDescription: 'iPhone 13 smartphone with 5G connectivity'
      });
      
      expect(result).toBeDefined();
      expect(result.classifications).toHaveLength(1);
      expect(result.classifications[0].hsCode).toBe('851712');
      expect(result.classifications[0].confidence).toBe(95);
      expect(result.query).toBe('iPhone 13 smartphone with 5G connectivity');
    });
    
    it('should return fallback classification when no results found', async () => {
      // Mock to return empty results
      (service as any).getMultiSourceClassification = jest.fn().mockResolvedValue([]);
      
      const result = await service.classifyProduct({
        productDescription: 'Unknown product that cannot be classified'
      });
      
      expect(result).toBeDefined();
      expect(result.classifications).toHaveLength(1);
      expect(result.classifications[0].confidence).toBeLessThan(50); // Fallback should have low confidence
    });
    
    it('should respect confidenceThreshold parameter', async () => {
      // Mock results with different confidence scores
      (service as any).getMultiSourceClassification = jest.fn().mockResolvedValue([
        { hsCode: '851712', description: 'Mobile phones', confidence: 90 },
        { hsCode: '847130', description: 'Laptops', confidence: 70 },
        { hsCode: '851830', description: 'Headphones', confidence: 40 }
      ]);
      
      const result = await service.classifyProduct({
        productDescription: 'Electronic devices',
        confidenceThreshold: 0.6 // 60%
      });
      
      expect(result.classifications).toHaveLength(2); // Only the items with confidence >= 60% should be included
      expect(result.classifications.map(c => c.hsCode)).toContain('851712');
      expect(result.classifications.map(c => c.hsCode)).toContain('847130');
      expect(result.classifications.map(c => c.hsCode)).not.toContain('851830');
    });
    
    it('should respect maxResults parameter', async () => {
      // Mock many results
      (service as any).getMultiSourceClassification = jest.fn().mockResolvedValue([
        { hsCode: '851712', description: 'Mobile phones', confidence: 95 },
        { hsCode: '847130', description: 'Laptops', confidence: 90 },
        { hsCode: '851830', description: 'Headphones', confidence: 85 },
        { hsCode: '852580', description: 'Cameras', confidence: 80 },
        { hsCode: '852110', description: 'Video recorders', confidence: 75 }
      ]);
      
      const result = await service.classifyProduct({
        productDescription: 'Electronic devices',
        maxResults: 3
      });
      
      expect(result.classifications).toHaveLength(3); // Should limit to 3 results
      expect(result.classifications[0].hsCode).toBe('851712'); // Should still be sorted
    });
    
    it('should use cache when available', async () => {
      // Mock cache methods
      const mockCacheGet = jest.fn().mockReturnValue({
        classifications: [{ hsCode: '851712', description: 'Mobile phones', confidence: 95 }],
        query: 'Cached query',
        timestamp: new Date().toISOString()
      });
      
      // Override cache methods
      (service as any).cache.get = mockCacheGet;
      
      const result = await service.classifyProduct({
        productDescription: 'iPhone 13',
        useCache: true
      });
      
      expect(mockCacheGet).toHaveBeenCalled();
      expect(result.classifications[0].hsCode).toBe('851712');
      expect(result.query).toBe('Cached query');
      
      // getMultiSourceClassification should not be called when cache hit
      expect((service as any).getMultiSourceClassification).not.toHaveBeenCalled();
    });
  });
  
  describe('searchHSCodes', () => {
    it('should search HS codes correctly', async () => {
      const searchResults = await service.searchHSCodes('smartphone');
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].hsCode).toBe('8517.12');
      expect(mockWitsApiClient.searchHSCodes).toHaveBeenCalledWith('smartphone');
    });
    
    it('should return empty array on error', async () => {
      // Mock API error
      mockWitsApiClient.searchHSCodes.mockRejectedValue(new Error('API error'));
      
      const searchResults = await service.searchHSCodes('smartphone');
      
      expect(searchResults).toHaveLength(0);
    });
  });
  
  describe('getProductExamples', () => {
    it('should get product examples for an HS code', async () => {
      const examples = await service.getProductExamples('851712');
      
      expect(examples).toHaveLength(1);
      expect(examples[0].name).toBe('Smartphone');
      expect(mockWitsApiClient.getProductExamples).toHaveBeenCalledWith('851712');
    });
    
    it('should return empty array on error', async () => {
      // Mock API error
      mockWitsApiClient.getProductExamples.mockRejectedValue(new Error('API error'));
      
      const examples = await service.getProductExamples('851712');
      
      expect(examples).toHaveLength(0);
    });
  });
  
  describe('getClassificationOptions', () => {
    it('should get chapter options correctly', async () => {
      // Mock classification for testing getClassificationOptions
      jest.spyOn(service, 'classifyProduct').mockResolvedValue({
        classifications: [
          {
            hsCode: '851712',
            description: 'Mobile phones',
            confidence: 95,
            metadata: {
              chapter: { code: '85', name: 'Electrical machinery', description: 'Electrical machinery' },
              heading: { code: '8517', name: 'Telephones', description: 'Telephone sets' },
              subheading: { code: '851712', name: 'Mobile phones', description: 'Mobile phones' }
            }
          }
        ],
        query: 'smartphone',
        timestamp: new Date().toISOString()
      });
      
      const options = await service.getClassificationOptions('smartphone', 'chapter');
      
      expect(options).toHaveLength(1);
      expect(options[0].code).toBe('85');
      expect(options[0].confidence).toBe(95);
    });
    
    it('should get heading options correctly with parent filter', async () => {
      // Mock classification
      jest.spyOn(service, 'classifyProduct').mockResolvedValue({
        classifications: [
          {
            hsCode: '851712',
            description: 'Mobile phones',
            confidence: 95,
            metadata: {
              chapter: { code: '85', name: 'Electrical machinery', description: 'Electrical machinery' },
              heading: { code: '8517', name: 'Telephones', description: 'Telephone sets' },
              subheading: { code: '851712', name: 'Mobile phones', description: 'Mobile phones' }
            }
          }
        ],
        query: 'smartphone',
        timestamp: new Date().toISOString()
      });
      
      const options = await service.getClassificationOptions('smartphone', 'heading', '85');
      
      expect(options).toHaveLength(1);
      expect(options[0].code).toBe('8517');
    });
    
    it('should fetch all options if not enough from classification', async () => {
      // Mock classification with no results
      jest.spyOn(service, 'classifyProduct').mockResolvedValue({
        classifications: [],
        query: 'unknown product',
        timestamp: new Date().toISOString()
      });
      
      const options = await service.getClassificationOptions('unknown product', 'chapter');
      
      // Should fallback to fetching all chapters
      expect(mockWitsApiClient.getChapters).toHaveBeenCalled();
      expect(options).toHaveLength(1); // Our mock returns 1 chapter
      expect(options[0].confidence).toBe(0); // Should have zero confidence
    });
  });
  
  describe('getHSCodePath', () => {
    it('should create path for a complete HS code', async () => {
      const path = await service.getHSCodePath('851712');
      
      expect(path.path).toHaveLength(3); // chapter, heading, subheading
      expect(path.path[0].level).toBe('chapter');
      expect(path.path[1].level).toBe('heading');
      expect(path.path[2].level).toBe('subheading');
      expect(path.path[0].code).toBe('85');
      expect(path.path[1].code).toBe('8517');
      expect(path.path[2].code).toBe('851712');
    });
    
    it('should create partial path for chapter only', async () => {
      const path = await service.getHSCodePath('85');
      
      expect(path.path).toHaveLength(1); // chapter only
      expect(path.path[0].level).toBe('chapter');
      expect(path.path[0].code).toBe('85');
    });
  });
  
  describe('getHSCodeHierarchy', () => {
    it('should build a hierarchy of HS codes', async () => {
      const hierarchy = await service.getHSCodeHierarchy();
      
      expect(hierarchy.chapters).toHaveLength(1);
      expect(hierarchy.headings['85']).toHaveLength(1);
      expect(hierarchy.subheadings['8517']).toHaveLength(1);
    });
  });
  
  // Helper function tests
  describe('private methods', () => {
    it('should calculate text similarity correctly', () => {
      const similarity = (service as any).calculateTextSimilarity(
        'smartphone with touchscreen',
        'modern smartphone device'
      );
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
    
    it('should provide fallback classification for common keywords', () => {
      const fallback = (service as any).getFallbackClassification('electronic device');
      
      expect(fallback.classifications).toHaveLength(1);
      expect(fallback.classifications[0].hsCode).toContain('8');
      expect(fallback.classifications[0].source).toBe('fallback');
    });
  });
}); 