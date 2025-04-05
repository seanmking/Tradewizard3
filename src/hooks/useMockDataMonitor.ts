import { useEffect } from 'react';
import { useMockData } from '@/contexts/mock-data-context';

/**
 * Hook that monitors console for mock data warnings and updates the mock data context
 * This is useful for detecting when services fall back to mock data
 */
export function useMockDataMonitor() {
  const { updateMockDataDetails } = useMockData();

  useEffect(() => {
    // Store the original console.warn function
    const originalWarn = console.warn;
    
    // Override console.warn to detect mock data warnings
    console.warn = function(...args: any[]) {
      // Check if this is a mock data warning
      const message = args.join(' ');
      
      if (message.includes('HS Code API key not configured')) {
        updateMockDataDetails('hsCode', true);
      }
      
      if (message.includes('WITS API key not configured')) {
        updateMockDataDetails('witsApi', true);
      }
      
      // Call the original console.warn with all arguments
      originalWarn.apply(console, args);
    };
    
    // Add timestamp to console warnings for debugging
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const timestamp = new Date().toISOString();
      originalConsoleWarn.apply(console, [`[${timestamp}]`, ...args]);
    };
    
    // Add color to console warnings
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const timestamp = new Date().toISOString();
      originalConsoleError.apply(console, [
        `%c[${timestamp}]`,
        'color: #d63031; font-weight: bold;',
        ...args
      ]);
    };
    
    // Return a cleanup function to restore the original console functions
    return () => {
      console.warn = originalWarn;
    };
  }, [updateMockDataDetails]);
} 