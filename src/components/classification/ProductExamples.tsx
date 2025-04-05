import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ProductExample } from '@/mcp/global/hs-code-mcp/hs-code.types';

interface ProductExamplesProps {
  examples: ProductExample[];
  title?: string;
  initiallyExpanded?: boolean;
  maxDisplay?: number;
}

const ProductExamples: React.FC<ProductExamplesProps> = ({
  examples,
  title = 'Product Examples',
  initiallyExpanded = false,
  maxDisplay = 5
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  // No examples case
  if (!examples || examples.length === 0) {
    return null;
  }
  
  // Limit number of examples shown
  const displayExamples = examples.slice(0, maxDisplay);
  
  return (
    <div className="mt-3">
      <button 
        className="text-sm text-purple-600 font-medium flex items-center"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <>
            <ChevronDown size={16} className="mr-1" />
            Hide {title.toLowerCase()}
          </>
        ) : (
          <>
            <ChevronRight size={16} className="mr-1" />
            Show {title.toLowerCase()} ({examples.length})
          </>
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayExamples.map((example, idx) => (
            <div key={idx} className="bg-white rounded border border-gray-200 px-3 py-2 text-sm text-gray-800">
              <div className="font-medium">{example.name}</div>
              {example.description && (
                <div className="text-xs text-gray-500 mt-1">{example.description}</div>
              )}
            </div>
          ))}
          
          {examples.length > maxDisplay && (
            <div className="bg-gray-50 rounded border border-gray-200 px-3 py-2 text-sm text-gray-500 flex items-center justify-center">
              + {examples.length - maxDisplay} more examples
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductExamples; 