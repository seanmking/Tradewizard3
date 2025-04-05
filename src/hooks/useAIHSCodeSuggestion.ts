import { useState, useEffect, useMemo } from 'react';
import { HSCodeSuggestion } from '../data/hs-codes/types';
import { HSCodeApiService } from '../services/hs-code/hsCodeApi.service';

interface ProductDetails {
  name: string;
  description?: string;
  category?: string;
}

interface UseAIHSCodeSuggestionReturn {
  suggestions: HSCodeSuggestion[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for getting AI-powered HS code suggestions
 */
export function useAIHSCodeSuggestion(
  productDetails: ProductDetails
): UseAIHSCodeSuggestionReturn {
  const [suggestions, setSuggestions] = useState<HSCodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const hsCodeApiService = useMemo(() => new HSCodeApiService(), []);
  
  const fetchSuggestions = async () => {
    if (!productDetails.name) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await hsCodeApiService.classifyProduct(productDetails.name, {
        additionalInfo: productDetails.description,
        category: productDetails.category
      });
      
      setSuggestions(result);
    } catch (err) {
      console.error('Error getting HS code suggestions:', err);
      setError(err instanceof Error ? err : new Error('Failed to get suggestions'));
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch suggestions when product details change
  useEffect(() => {
    // Debounce the API call slightly to prevent excessive calls
    const timer = setTimeout(() => {
      if (productDetails.name) {
        fetchSuggestions();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [
    productDetails.name, 
    productDetails.description, 
    productDetails.category
  ]);
  
  return {
    suggestions,
    isLoading,
    error,
    refetch: fetchSuggestions
  };
} 