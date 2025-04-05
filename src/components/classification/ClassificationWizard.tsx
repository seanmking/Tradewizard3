import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  HSCode, 
  ClassificationResult, 
  ClassificationStatus 
} from '../../types/classification.types';
import { classificationService } from '../../services/classification/classificationService';
import { selectHSCodeById } from '../../store/classification/classificationSlice';

interface ClassificationWizardProps {
  initialDescription?: string;
  onClassificationComplete?: (result: ClassificationResult) => void;
  onError?: (error: Error) => void;
}

export const ClassificationWizard: React.FC<ClassificationWizardProps> = ({
  initialDescription = '',
  onClassificationComplete,
  onError
}) => {
  // State
  const [description, setDescription] = useState(initialDescription);
  const [selectedCode, setSelectedCode] = useState<HSCode | null>(null);
  
  // Refs for keyboard navigation
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionListRef = useRef<HTMLUListElement>(null);
  
  // Classification hooks
  const { useClassification, useManualClassification } = classificationService;
  const { data, isLoading, error } = useClassification(description);
  const { mutate: selectManually } = useManualClassification();

  // Effect to handle successful classification
  useEffect(() => {
    if (data && !error) {
      onClassificationComplete?.(data);
    }
  }, [data, error, onClassificationComplete]);

  // Effect to handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' && suggestionListRef.current) {
      event.preventDefault();
      const firstSuggestion = suggestionListRef.current.querySelector('li');
      (firstSuggestion?.querySelector('button') as HTMLButtonElement)?.focus();
    }
  };

  // ARIA live region for status updates
  const getStatusMessage = (): string => {
    if (isLoading) return 'Classifying your product...';
    if (error) return 'Error occurred during classification. Please try again.';
    if (data) return `Product classified as ${data.hsCode.description}`;
    return '';
  };

  return (
    <div 
      className="classification-wizard"
      role="region"
      aria-label="Product Classification"
    >
      {/* Product Description Input */}
      <div className="input-group">
        <label htmlFor="product-description" className="label">
          Product Description
        </label>
        <input
          ref={inputRef}
          id="product-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-describedby="description-help"
          className="input"
          placeholder="Enter your product description"
        />
        <p id="description-help" className="help-text">
          Provide a detailed description of your product for accurate classification
        </p>
      </div>

      {/* Status Messages */}
      <div 
        role="status" 
        aria-live="polite" 
        className="status-message"
      >
        {getStatusMessage()}
      </div>

      {/* Classification Results */}
      {data && (
        <div 
          className="classification-result"
          role="region"
          aria-label="Classification Result"
        >
          <h3>Suggested Classification</h3>
          <div className="hs-code-display">
            <span className="code">{data.hsCode.code}</span>
            <span className="description">{data.hsCode.description}</span>
            <span 
              className="confidence"
              role="meter"
              aria-label="Classification confidence"
              aria-valuenow={data.confidence * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {Math.round(data.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      )}

      {/* Alternative Suggestions */}
      {data?.alternatives && data.alternatives.length > 0 && (
        <div 
          className="alternatives"
          role="region"
          aria-label="Alternative Classifications"
        >
          <h3>Alternative Classifications</h3>
          <ul 
            ref={suggestionListRef}
            role="listbox"
            aria-label="Alternative classifications"
            className="suggestions-list"
          >
            {data.alternatives.map((alt, index) => (
              <li 
                key={alt.code}
                role="option"
                aria-selected={selectedCode?.code === alt.code}
              >
                <button
                  onClick={() => selectManually(alt)}
                  className="suggestion-button"
                  aria-label={`Select ${alt.description} (HS Code ${alt.code})`}
                >
                  <span className="code">{alt.code}</span>
                  <span className="description">{alt.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          role="alert"
          className="error-message"
        >
          <p>{error.message}</p>
          <button 
            onClick={() => setDescription(description)}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassificationWizard; 