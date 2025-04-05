import { 
  useQuery, 
  useMutation, 
  UseQueryResult, 
  UseMutationResult,
  QueryKey
} from '@tanstack/react-query';
import { 
  ClassificationResult, 
  HSCode, 
  ClassificationMetrics,
  ClassificationErrorType
} from '../../types/classification.types';
import { useDispatch } from 'react-redux';
import { 
  addMetrics, 
  setError, 
  setSelectedHSCode 
} from '../../store/classification/classificationSlice';

// Performance monitoring
const measurePerformance = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; metrics: ClassificationMetrics }> => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  
  return {
    result,
    metrics: {
      responseTime: endTime - startTime,
      confidenceScore: (result as any).confidence || 0,
      userCorrected: false,
      finalClassification: (result as any).hsCode?.code || ''
    }
  };
};

// Error handling
const handleClassificationError = (error: unknown): { 
  type: ClassificationErrorType; 
  message: string;
} => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { status: number }; message?: string };
    
    if (err.response?.status === 404) {
      return {
        type: 'no_match_found',
        message: 'No matching HS code found for the given product description'
      };
    }
    
    if (err.message?.includes('confidence')) {
      return {
        type: 'low_confidence',
        message: 'Classification confidence below threshold'
      };
    }
  }
  
  return {
    type: 'service_error',
    message: 'An error occurred during classification'
  };
};

// Classification service
export const useClassificationService = () => {
  const dispatch = useDispatch();

  // Classify product
  const classifyProduct = async (description: string): Promise<ClassificationResult> => {
    const { result, metrics } = await measurePerformance(async () => {
      // Call your classification API here
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.statusText}`);
      }

      return response.json();
    });

    // Track metrics
    dispatch(addMetrics(metrics));

    return result;
  };

  // Get suggestions for low confidence results
  const getSuggestions = async (description: string): Promise<HSCode[]> => {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      throw new Error(`Failed to get suggestions: ${response.statusText}`);
    }

    return response.json();
  };

  // React Query hooks
  const useClassification = (
    description: string
  ): UseQueryResult<ClassificationResult, Error> => {
    return useQuery<ClassificationResult, Error, ClassificationResult, QueryKey>(
      ['classification', description],
      () => classifyProduct(description),
      {
        onError: (error: Error) => {
          const { type, message } = handleClassificationError(error);
          dispatch(setError({ type, message }));
        },
        onSuccess: (data: ClassificationResult) => {
          if (data.confidence >= 0.8) {
            dispatch(setSelectedHSCode(data.hsCode));
          } else {
            getSuggestions(description)
              .then(suggestions => {
                dispatch(setError({
                  type: 'low_confidence',
                  message: 'Please review the classification',
                  suggestions
                }));
              });
          }
        },
        retry: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 30 // 30 minutes
      }
    );
  };

  // Manual classification mutation
  const useManualClassification = (): UseMutationResult<HSCode, Error, HSCode> => {
    return useMutation<HSCode, Error, HSCode>(
      (hsCode: HSCode) => {
        dispatch(setSelectedHSCode(hsCode));
        return Promise.resolve(hsCode);
      },
      {
        onSuccess: (hsCode: HSCode) => {
          dispatch(addMetrics({
            responseTime: 0,
            confidenceScore: 1,
            userCorrected: true,
            finalClassification: hsCode.code
          }));
        }
      }
    );
  };

  return {
    useClassification,
    useManualClassification
  };
};

// Export singleton instance
export const classificationService = useClassificationService(); 