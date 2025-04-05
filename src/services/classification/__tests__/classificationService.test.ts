'use client';

import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ClassificationResult, HSCode } from '../../types/classification.types';
import { classificationReducer } from '../../store/classification/classificationSlice';
import { classificationService } from '../classificationService';

// Create a mock store
const store = configureStore({
  reducer: {
    classification: classificationReducer
  }
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('classificationService', () => {
  const queryClient = new QueryClient();
  
  // Define wrapper component with both providers
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  );

  const mockClassificationResult: ClassificationResult = {
    hsCode: {
      code: '123456',
      description: 'Test Product'
    },
    confidence: 0.85
  };

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useClassification', () => {
    it('should classify a product successfully', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockClassificationResult)
        })
      );

      const { result } = renderHook(
        () => classificationService.useClassification('test product'),
        { wrapper: Wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(result.current.data).toEqual(mockClassificationResult);
      expect(global.fetch).toHaveBeenCalledWith('/api/classify', expect.any(Object));
    });

    it('should handle empty product descriptions', async () => {
      const { result } = renderHook(
        () => classificationService.useClassification(''),
        { wrapper: Wrapper }
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found'
        })
      );

      const { result } = renderHook(
        () => classificationService.useClassification('test product'),
        { wrapper: Wrapper }
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useManualClassification', () => {
    it('should handle manual HS code selection', async () => {
      const mockHsCode: HSCode = {
        code: '123456',
        description: 'Test Product'
      };

      const { result } = renderHook(
        () => classificationService.useManualClassification(),
        { wrapper: Wrapper }
      );

      await result.current.mutate(mockHsCode);

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockHsCode);
    });
  });
}); 