import React, { useState, useEffect } from 'react';
import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp';
import { HsClassificationResult, ClassificationResult } from '@/mcp/global/hs-code-mcp/hs-code-mcp.interface';

interface ProductClassifierProps {
  initialValue?: string;
  onClassification?: (classification: HsClassificationResult) => void;
  onHsCodeSelect?: (hsCode: string, description: string) => void;
}

export const ProductClassifier: React.FC<ProductClassifierProps> = ({ 
  initialValue = '', 
  onClassification,
  onHsCodeSelect
}) => {
  const [productDescription, setProductDescription] = useState(initialValue);
  const [classificationResult, setClassificationResult] = useState<HsClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHsCode, setSelectedHsCode] = useState<string>('');
  const [selectedDescription, setSelectedDescription] = useState<string>('');
  
  // Categories based on HS chapters
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedHeading, setSelectedHeading] = useState<string>('');
  
  // Get unique chapters from classification results
  const getUniqueChapters = (classifications: ClassificationResult[]): { code: string; description: string }[] => {
    const chapters = new Map<string, string>();
    
    classifications.forEach(classification => {
      const chapterCode = classification.hsCode.substring(0, 2);
      if (!chapters.has(chapterCode)) {
        chapters.set(chapterCode, `Chapter ${chapterCode}`);
      }
    });
    
    return Array.from(chapters.entries()).map(([code, description]) => ({ code, description }));
  };
  
  // Get headings within a chapter
  const getHeadingsForChapter = (classifications: ClassificationResult[], chapter: string): { code: string; description: string }[] => {
    const headings = new Map<string, string>();
    
    classifications
      .filter(classification => classification.hsCode.startsWith(chapter))
      .forEach(classification => {
        const headingCode = classification.hsCode.substring(0, 4);
        if (!headings.has(headingCode)) {
          headings.set(headingCode, `Heading ${headingCode}`);
        }
      });
    
    return Array.from(headings.entries()).map(([code, description]) => ({ code, description }));
  };
  
  // Get products within a heading
  const getProductsForHeading = (classifications: ClassificationResult[], heading: string): ClassificationResult[] => {
    return classifications.filter(classification => classification.hsCode.startsWith(heading));
  };
  
  // Handle product description input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductDescription(e.target.value);
    // Reset selections when input changes
    setSelectedChapter('');
    setSelectedHeading('');
    setSelectedHsCode('');
    setSelectedDescription('');
    setClassificationResult(null);
  };
  
  // Handle classification request
  const handleClassify = async () => {
    if (!productDescription.trim()) {
      setError('Please enter a product description');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const hsCodeMCP = new GlobalHsCodeMCPService();
      const result = await hsCodeMCP.classifyProduct(productDescription);
      
      setClassificationResult(result);
      
      // Notify parent component
      if (onClassification) {
        onClassification(result);
      }
      
      // If we have results, pre-select the first chapter
      if (result.classifications.length > 0) {
        const firstChapter = result.classifications[0].hsCode.substring(0, 2);
        setSelectedChapter(firstChapter);
      }
    } catch (err) {
      setError('Error classifying product. Please try again.');
      console.error('Classification error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle chapter selection
  const handleChapterSelect = (chapter: string) => {
    setSelectedChapter(chapter);
    setSelectedHeading('');
    setSelectedHsCode('');
    setSelectedDescription('');
    
    // Pre-select first heading
    if (classificationResult) {
      const headings = getHeadingsForChapter(classificationResult.classifications, chapter);
      if (headings.length > 0) {
        setSelectedHeading(headings[0].code);
      }
    }
  };
  
  // Handle heading selection
  const handleHeadingSelect = (heading: string) => {
    setSelectedHeading(heading);
    setSelectedHsCode('');
    setSelectedDescription('');
    
    // Pre-select first product
    if (classificationResult) {
      const products = getProductsForHeading(classificationResult.classifications, heading);
      if (products.length > 0) {
        setSelectedHsCode(products[0].hsCode);
        setSelectedDescription(products[0].description);
      }
    }
  };
  
  // Handle product selection
  const handleProductSelect = (hsCode: string, description: string) => {
    setSelectedHsCode(hsCode);
    setSelectedDescription(description);
    
    // Notify parent component
    if (onHsCodeSelect) {
      onHsCodeSelect(hsCode, description);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClassify();
  };
  
  // Effect for initialValue changes
  useEffect(() => {
    if (initialValue && initialValue !== productDescription) {
      setProductDescription(initialValue);
    }
  }, [initialValue]);
  
  return (
    <div className="product-classifier">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="productDescription" className="text-sm font-medium text-gray-700">
            Product Description
          </label>
          <div className="flex space-x-2">
            <input
              id="productDescription"
              type="text"
              value={productDescription}
              onChange={handleInputChange}
              placeholder="Enter product description (e.g., 'Cotton t-shirt')"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Classifying...' : 'Classify'}
            </button>
          </div>
        </div>
      </form>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {classificationResult && classificationResult.classifications.length > 0 && (
        <div className="classification-results">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Classification Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Chapter Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HS Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => handleChapterSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Chapter</option>
                {getUniqueChapters(classificationResult.classifications).map(chapter => (
                  <option key={chapter.code} value={chapter.code}>
                    {chapter.description}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Heading Selection */}
            {selectedChapter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HS Heading
                </label>
                <select
                  value={selectedHeading}
                  onChange={(e) => handleHeadingSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Heading</option>
                  {getHeadingsForChapter(classificationResult.classifications, selectedChapter).map(heading => (
                    <option key={heading.code} value={heading.code}>
                      {heading.description}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Product Selection */}
            {selectedHeading && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={selectedHsCode}
                  onChange={(e) => {
                    const product = getProductsForHeading(classificationResult.classifications, selectedHeading)
                      .find(p => p.hsCode === e.target.value);
                    if (product) {
                      handleProductSelect(product.hsCode, product.description);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Product</option>
                  {getProductsForHeading(classificationResult.classifications, selectedHeading).map(product => (
                    <option key={product.hsCode} value={product.hsCode}>
                      {product.hsCode} - {product.description.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Selected HS Code Details */}
          {selectedHsCode && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-2">Selected HS Code</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">HS Code:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedHsCode}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Description:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedDescription}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Chapter:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedChapter}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Heading:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedHeading}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};