import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyApiKeys } from '@/utils/api-key-verification';

interface MockDataContextType {
  isMockDataActive: boolean;
  setMockDataActive: (isActive: boolean) => void;
  mockDataDetails: {
    hsCode: boolean;
    witsApi: boolean;
    productData: boolean;
  };
  updateMockDataDetails: (type: keyof MockDataContextType['mockDataDetails'], value: boolean) => void;
  forceReload: () => void;
}

const defaultContext: MockDataContextType = {
  isMockDataActive: false,
  setMockDataActive: () => {},
  mockDataDetails: {
    hsCode: false,
    witsApi: false,
    productData: false
  },
  updateMockDataDetails: () => {},
  forceReload: () => {}
};

const MockDataContext = createContext<MockDataContextType>(defaultContext);

export const useMockData = () => useContext(MockDataContext);

interface MockDataProviderProps {
  children: ReactNode;
}

// Check client-side env vars directly for better reliability
const isApiKeyValidClient = (key: string | undefined): boolean => {
  return !!key && key.length > 10;
};

export function MockDataProvider({ children }: MockDataProviderProps) {
  const [isMockDataActive, setMockDataActive] = useState(false);
  const [mockDataDetails, setMockDataDetails] = useState({
    hsCode: false,
    witsApi: false,
    productData: false
  });

  const updateMockDataDetails = (
    type: keyof typeof mockDataDetails, 
    value: boolean
  ) => {
    setMockDataDetails(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Force reload page - useful when environment variables change
  const forceReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Update the overall mock data state whenever any of the details change
  useEffect(() => {
    const anyMockActive = Object.values(mockDataDetails).some(value => value);
    setMockDataActive(anyMockActive);
  }, [mockDataDetails]);

  // On initial load, verify API keys and set mock data state
  useEffect(() => {
    const checkApiKeyConfiguration = () => {
      try {
        const result = verifyApiKeys();
        const useMockData = false; // Always use real data
        setMockDataDetails({
          hsCode: !result.hsCodeApi.isValid,
          witsApi: !result.witsApi.isValid,
          productData: false
        });
        
        if (typeof window !== 'undefined') {
          const debug = window.localStorage.getItem('DEBUG_API_KEYS') === 'true' || 
                        process.env.NEXT_PUBLIC_DEBUG_API_KEYS === 'true';
          
          if (debug) {
            console.log('🔍 MockDataContext - API key check complete');
            console.log(`🔍 Using ${useMockData ? 'mock' : 'real'} data`);
            console.log(`🔍 Direct client check - HS_CODE_API_KEY: ${result.hsCodeApi.isValid ? 'valid' : 'invalid'}`);
            console.log(`🔍 Direct client check - WITS_API_KEY: ${result.witsApi.isValid ? 'valid' : 'invalid'}`);
          }
          
          // Force mock data if explicitly set
          if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
            updateMockDataDetails('hsCode', true);
            updateMockDataDetails('witsApi', true);
            updateMockDataDetails('productData', true);
            if (debug) console.log('🔍 Using mock data due to NEXT_PUBLIC_USE_MOCK_DATA=true');
          }
        }
      } catch (error) {
        console.error('Error checking API key configuration:', error);
      }
    };
    
    checkApiKeyConfiguration();
  }, []);

  return (
    <MockDataContext.Provider 
      value={{ 
        isMockDataActive, 
        setMockDataActive,
        mockDataDetails,
        updateMockDataDetails,
        forceReload
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
} 