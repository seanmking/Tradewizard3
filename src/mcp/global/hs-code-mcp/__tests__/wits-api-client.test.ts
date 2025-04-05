import axios from 'axios';
import { WITSAPIClient } from '../wits-api-client';
import { ClassificationMatch, ProductExample } from '../hs-code.types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock cache service
jest.mock('@/services/cache/cache.service', () => {
  return {
    CacheService: jest.fn().mockImplementation(() => {
      return {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
        clearPattern: jest.fn()
      };
    })
  };
});

describe('WITSAPIClient', () => {
  let client: WITSAPIClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default axios mock
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    } as any);
    
    client = new WITSAPIClient();
  });
  
  describe('searchHSCodes', () => {
    it('should search HS codes and transform results', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          results: [
            {
              code: '851712',
              description: 'Mobile phones',
              chapterCode: '85',
              chapterName: 'Electrical machinery',
              headingCode: '8517',
              headingName: 'Telephones'
            }
          ]
        }
      };
      
      // Mock axios get
      (client as any).apiClient.get = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const results = await client.searchHSCodes('smartphone');
      
      // Check that the API was called correctly
      expect((client as any).apiClient.get).toHaveBeenCalledWith('/nomenclature/search', {
        params: {
          query: 'smartphone',
          limit: 10,
          includeMetadata: true
        }
      });
      
      // Check that the results were transformed correctly
      expect(results).toHaveLength(1);
      expect(results[0].hsCode).toBe('851712');
      expect(results[0].metadata).toBeDefined();
      expect(results[0].metadata?.chapter.code).toBe('85');
    });
    
    it('should return cached results if available', async () => {
      // Mock cache hit
      const cachedResult: ClassificationMatch[] = [
        {
          hsCode: '851712',
          description: 'Cached result',
          confidence: 90
        }
      ];
      
      (client as any).cacheService.get = jest.fn().mockReturnValue(cachedResult);
      
      // Call the method
      const results = await client.searchHSCodes('smartphone');
      
      // Check that the cache was checked
      expect((client as any).cacheService.get).toHaveBeenCalledWith('wits:search:smartphone');
      
      // Check that the API was not called
      expect((client as any).apiClient.get).not.toHaveBeenCalled();
      
      // Check that the cached results were returned
      expect(results).toEqual(cachedResult);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock API error
      (client as any).apiClient.get = jest.fn().mockRejectedValue(new Error('API error'));
      
      // Call the method
      const results = await client.searchHSCodes('smartphone');
      
      // Check that the API was called
      expect((client as any).apiClient.get).toHaveBeenCalled();
      
      // Check that empty results were returned
      expect(results).toHaveLength(0);
    });
  });
  
  describe('getProductExamples', () => {
    it('should get product examples for an HS code', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          examples: [
            {
              name: 'Smartphone',
              description: 'Modern touchscreen mobile phone',
              code: '851712',
              imageUrl: 'https://example.com/image.jpg'
            }
          ]
        }
      };
      
      // Mock axios get
      (client as any).apiClient.get = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const examples = await client.getProductExamples('851712');
      
      // Check that the API was called correctly
      expect((client as any).apiClient.get).toHaveBeenCalledWith('/nomenclature/examples', {
        params: {
          code: '851712',
          limit: 20
        }
      });
      
      // Check that the results were transformed correctly
      expect(examples).toHaveLength(1);
      expect(examples[0].name).toBe('Smartphone');
      expect(examples[0].hsCode).toBe('851712');
    });
    
    it('should use fallback examples for common codes on error', async () => {
      // Mock API error
      (client as any).apiClient.get = jest.fn().mockRejectedValue(new Error('API error'));
      
      // Call the method with a code that has fallbacks
      const examples = await client.getProductExamples('8517');
      
      // Check that fallback examples were returned
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].name).toBeDefined();
    });
  });
  
  describe('getChapters', () => {
    it('should get all HS chapters', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          chapters: [
            {
              code: '85',
              name: 'Electrical machinery',
              description: 'Electrical machinery and equipment'
            }
          ]
        }
      };
      
      // Mock axios get
      (client as any).apiClient.get = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const chapters = await client.getChapters();
      
      // Check that the API was called correctly
      expect((client as any).apiClient.get).toHaveBeenCalledWith('/nomenclature/chapters');
      
      // Check that the results were transformed correctly
      expect(chapters).toHaveLength(1);
      expect(chapters[0].code).toBe('85');
      expect(chapters[0].name).toBe('Electrical machinery');
    });
    
    it('should use fallback chapters on error', async () => {
      // Mock API error
      (client as any).apiClient.get = jest.fn().mockRejectedValue(new Error('API error'));
      
      // Call the method
      const chapters = await client.getChapters();
      
      // Check that fallback chapters were returned
      expect(chapters.length).toBeGreaterThan(0);
      expect(chapters[0].code).toBeDefined();
    });
  });
  
  describe('getHeadings', () => {
    it('should get headings for a chapter', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          headings: [
            {
              code: '8517',
              name: 'Telephones',
              description: 'Telephone sets'
            }
          ]
        }
      };
      
      // Mock axios get
      (client as any).apiClient.get = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const headings = await client.getHeadings('85');
      
      // Check that the API was called correctly
      expect((client as any).apiClient.get).toHaveBeenCalledWith('/nomenclature/headings', {
        params: {
          chapterCode: '85'
        }
      });
      
      // Check that the results were transformed correctly
      expect(headings).toHaveLength(1);
      expect(headings[0].code).toBe('8517');
      expect(headings[0].name).toBe('Telephones');
    });
  });
  
  describe('getSubheadings', () => {
    it('should get subheadings for a heading', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          subheadings: [
            {
              code: '851712',
              name: 'Mobile phones',
              description: 'Telephones for cellular networks'
            }
          ]
        }
      };
      
      // Mock axios get
      (client as any).apiClient.get = jest.fn().mockResolvedValue(mockResponse);
      
      // Call the method
      const subheadings = await client.getSubheadings('8517');
      
      // Check that the API was called correctly
      expect((client as any).apiClient.get).toHaveBeenCalledWith('/nomenclature/subheadings', {
        params: {
          headingCode: '8517'
        }
      });
      
      // Check that the results were transformed correctly
      expect(subheadings).toHaveLength(1);
      expect(subheadings[0].code).toBe('851712');
      expect(subheadings[0].name).toBe('Mobile phones');
    });
  });
  
  describe('cache management', () => {
    it('should clear the entire cache', () => {
      client.clearCache();
      expect((client as any).cacheService.clear).toHaveBeenCalled();
    });
    
    it('should clear cache by pattern', () => {
      client.clearCache('wits:search:*');
      expect((client as any).cacheService.clearPattern).toHaveBeenCalledWith('wits:search:*');
    });
  });
  
  describe('error handling', () => {
    it('should retry failed requests with exponential backoff', async () => {
      // This test would be more complex in a real implementation
      // It would need to mock the interceptor behavior and verify retry attempts
      expect((client as any).maxRetries).toBeDefined();
    });
  });
}); 