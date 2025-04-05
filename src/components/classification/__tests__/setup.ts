import { configureStore, Action } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import { mockClassificationService } from '../__mocks__/classificationService';

// Mock the classification service
jest.mock('../../../services/classification/classificationService', () => mockClassificationService);

// Create a test store factory
export const createTestStore = () => {
  return configureStore({
    reducer: {
      classification: (state = {}, action: Action) => state
    }
  });
};

// Create a test query client factory
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 