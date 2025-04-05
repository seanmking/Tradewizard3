import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { WITSApiService } from '../witsApi';
import { logger } from '../../../utils/logger';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
  }
}));

describe('WITSApiService', () => {
  let service: WITSApiService;
  const mockAxiosCreate = jest.fn().mockReturnValue({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    defaults: {},
    getUri: jest.fn(),
    request: jest.fn(),
    delete: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    all: jest.fn(),
    spread: jest.fn(),
    isAxiosError: jest.fn()
  } as unknown as AxiosInstance);

  beforeEach(() => {
    mockedAxios.create.mockImplementation(mockAxiosCreate);
    service = new WITSApiService({
      baseUrl: 'https://test.api',
      apiKey: 'test-key',
      timeout: 5000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyProduct', () => {
    const mockProduct = {
      hsCode: '080390',
      description: 'Fresh bananas',
      confidence: 0.95,
      examples: ['Cavendish bananas']
    };

    it('should successfully classify a product', async () => {
      const mockClient = mockAxiosCreate();
      mockClient.post.mockResolvedValueOnce({ data: mockProduct });

      const result = await service.classifyProduct('banana');

      expect(result).toEqual(mockProduct);
      expect(mockClient.post).toHaveBeenCalledWith('/classify', { description: 'banana' });
    });

    it('should handle classification errors', async () => {
      const mockClient = mockAxiosCreate();
      const mockError = new Error('API Error');
      mockClient.post.mockRejectedValueOnce(mockError);

      await expect(service.classifyProduct('invalid')).rejects.toThrow('WITS API error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getChapterInfo', () => {
    const mockChapter = {
      code: '08',
      description: 'Edible fruit and nuts',
      examples: ['Fruits', 'Nuts']
    };

    it('should successfully get chapter information', async () => {
      const mockClient = mockAxiosCreate();
      mockClient.get.mockResolvedValueOnce({ data: mockChapter });

      const result = await service.getChapterInfo('08');

      expect(result).toEqual(mockChapter);
      expect(mockClient.get).toHaveBeenCalledWith('/chapter/08');
    });

    it('should handle chapter info errors', async () => {
      const mockClient = mockAxiosCreate();
      const mockError = new Error('API Error');
      mockClient.get.mockRejectedValueOnce(mockError);

      await expect(service.getChapterInfo('99')).rejects.toThrow('WITS API error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSimilarProducts', () => {
    const mockSimilarProducts = {
      products: [
        {
          hsCode: '080390',
          description: 'Fresh bananas',
          confidence: 0.95,
          examples: ['Cavendish bananas']
        },
        {
          hsCode: '080310',
          description: 'Plantains',
          confidence: 0.85,
          examples: ['Cooking bananas']
        }
      ]
    };

    it('should successfully get similar products', async () => {
      const mockClient = mockAxiosCreate();
      mockClient.post.mockResolvedValueOnce({ data: mockSimilarProducts });

      const result = await service.getSimilarProducts('banana');

      expect(result).toEqual(mockSimilarProducts.products);
      expect(mockClient.post).toHaveBeenCalledWith('/similar', { description: 'banana' });
    });

    it('should handle empty response', async () => {
      const mockClient = mockAxiosCreate();
      mockClient.post.mockResolvedValueOnce({ data: {} });

      const result = await service.getSimilarProducts('unknown');

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const mockClient = mockAxiosCreate();
      const mockError = {
        message: 'Network Error',
        request: {},
        isAxiosError: true
      } as unknown as AxiosError;
      mockClient.post.mockRejectedValueOnce(mockError);

      await expect(service.classifyProduct('test')).rejects.toThrow('No response received');
    });

    it('should handle API errors with status codes', async () => {
      const mockClient = mockAxiosCreate();
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        },
        isAxiosError: true
      } as unknown as AxiosError;
      mockClient.post.mockRejectedValueOnce(mockError);

      await expect(service.classifyProduct('test')).rejects.toThrow('404 - Not Found');
    });
  });
}); 