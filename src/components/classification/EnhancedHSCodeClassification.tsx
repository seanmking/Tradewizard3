import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft, 
  Loader, 
  X 
} from 'lucide-react';
import { HsCodeMCPService } from '@/mcp/global/hs-code-mcp/hs-code-mcp.service';
import { 
  ClassificationMatch, 
  ClassificationOption,
  ProductExample,
  HSChapter,
  HSHeading,
  HSSubheading
} from '@/mcp/global/hs-code-mcp/hs-code.types';
import ConfidenceIndicator from './ConfidenceIndicator';
import ProductExamples from './ProductExamples';

interface EnhancedHSCodeClassificationProps {
  productName: string;
  productDescription: string;
  onClassificationComplete: (hsCode: string, confidence: number) => void;
}

const EnhancedHSCodeClassification: React.FC<EnhancedHSCodeClassificationProps> = ({
  productName,
  productDescription,
  onClassificationComplete
}) => {
  // State for UI tabs
  const [activeTab, setActiveTab] = useState<'guided' | 'search'>('guided');
  
  // State for guided selection
  const [classificationStep, setClassificationStep] = useState<number>(0);
  const [selectedChapter, setSelectedChapter] = useState<HSChapter | null>(null);
  const [selectedHeading, setSelectedHeading] = useState<HSHeading | null>(null);
  const [selectedSubheading, setSelectedSubheading] = useState<HSSubheading | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [showExamples, setShowExamples] = useState<boolean>(false);
  
  // State for chapters, headings, and subheadings
  const [chapters, setChapters] = useState<ClassificationOption[]>([]);
  const [headings, setHeadings] = useState<ClassificationOption[]>([]);
  const [subheadings, setSubheadings] = useState<ClassificationOption[]>([]);
  const [chapterExamples, setChapterExamples] = useState<ProductExample[]>([]);
  const [headingExamples, setHeadingExamples] = useState<ProductExample[]>([]);
  const [subheadingExamples, setSubheadingExamples] = useState<ProductExample[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState<{ chapters: boolean; headings: boolean; subheadings: boolean }>({
    chapters: false,
    headings: false,
    subheadings: false
  });
  
  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ClassificationMatch[]>([]);
  
  // Initialize service
  const hsCodeService = new HsCodeMCPService();
  
  // Initialize with product description
  useEffect(() => {
    if (productDescription) {
      setSearchQuery(productDescription);
      loadInitialClassification();
    }
  }, [productDescription]);
  
  // Load initial classification
  const loadInitialClassification = async () => {
    setLoading(prev => ({ ...prev, chapters: true }));
    try {
      // Get chapters with confidence scores based on product description
      const chapterOptions = await hsCodeService.getClassificationOptions(
        `${productName} ${productDescription}`,
        'chapter'
      );
      
      setChapters(chapterOptions);
      
      // If there's a high confidence match, pre-select it
      const highConfidenceChapter = chapterOptions.find(chapter => chapter.confidence && chapter.confidence >= 85);
      if (highConfidenceChapter) {
        await selectChapter({
          code: highConfidenceChapter.code,
          name: highConfidenceChapter.name,
          description: highConfidenceChapter.description
        });
      }
    } catch (error) {
      console.error('Error loading initial classification:', error);
    } finally {
      setLoading(prev => ({ ...prev, chapters: false }));
    }
  };
  
  // Handle chapter selection
  const selectChapter = async (chapter: HSChapter) => {
    setSelectedChapter(chapter);
    setClassificationStep(1);
    
    // Find confidence score from chapters
    const chapterOption = chapters.find(c => c.code === chapter.code);
    if (chapterOption) {
      setConfidenceScore(chapterOption.confidence || 0);
    }
    
    // Load headings for this chapter
    setLoading(prev => ({ ...prev, headings: true }));
    try {
      const headingOptions = await hsCodeService.getClassificationOptions(
        `${productName} ${productDescription}`,
        'heading',
        chapter.code
      );
      
      setHeadings(headingOptions);
      
      // Get examples for this chapter
      const examples = await hsCodeService.getProductExamples(chapter.code);
      setChapterExamples(examples);
      
      // If there's a high confidence match, pre-select it
      const highConfidenceHeading = headingOptions.find(heading => heading.confidence && heading.confidence >= 85);
      if (highConfidenceHeading) {
        await selectHeading({
          code: highConfidenceHeading.code,
          name: highConfidenceHeading.name,
          description: highConfidenceHeading.description
        });
      }
    } catch (error) {
      console.error(`Error loading headings for chapter ${chapter.code}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, headings: false }));
    }
  };
  
  // Handle heading selection
  const selectHeading = async (heading: HSHeading) => {
    setSelectedHeading(heading);
    setClassificationStep(2);
    
    // Find confidence score from headings
    const headingOption = headings.find(h => h.code === heading.code);
    if (headingOption) {
      setConfidenceScore(headingOption.confidence || 0);
    }
    
    // Load subheadings for this heading
    setLoading(prev => ({ ...prev, subheadings: true }));
    try {
      const subheadingOptions = await hsCodeService.getClassificationOptions(
        `${productName} ${productDescription}`,
        'subheading',
        heading.code
      );
      
      setSubheadings(subheadingOptions);
      
      // Get examples for this heading
      const examples = await hsCodeService.getProductExamples(heading.code);
      setHeadingExamples(examples);
      
      // If there's a high confidence match, pre-select it
      const highConfidenceSubheading = subheadingOptions.find(subheading => subheading.confidence && subheading.confidence >= 85);
      if (highConfidenceSubheading) {
        selectSubheading({
          code: highConfidenceSubheading.code,
          name: highConfidenceSubheading.name,
          description: highConfidenceSubheading.description
        });
      }
    } catch (error) {
      console.error(`Error loading subheadings for heading ${heading.code}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, subheadings: false }));
    }
  };
  
  // Handle subheading selection
  const selectSubheading = async (subheading: HSSubheading) => {
    setSelectedSubheading(subheading);
    setClassificationStep(3);
    
    // Find confidence score from subheadings
    const subheadingOption = subheadings.find(s => s.code === subheading.code);
    if (subheadingOption) {
      setConfidenceScore(subheadingOption.confidence || 0);
    }
    
    // Get examples for this subheading
    const examples = await hsCodeService.getProductExamples(subheading.code);
    setSubheadingExamples(examples);
    
    // After a short delay, set to complete
    setTimeout(() => {
      setClassificationStep(4);
      // Notify parent of selection
      onClassificationComplete(subheading.code, confidenceScore);
    }, 500);
  };
  
  // Reset classification
  const resetClassification = () => {
    setClassificationStep(0);
    setSelectedChapter(null);
    setSelectedHeading(null);
    setSelectedSubheading(null);
    setConfidenceScore(0);
  };
  
  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) return;
    
    setIsSearching(true);
    try {
      const results = await hsCodeService.searchHSCodes(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching for HS codes:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search result selection
  const selectSearchResult = async (result: ClassificationMatch) => {
    try {
      // Extract chapter, heading, and subheading codes
      const chapterCode = result.hsCode.substring(0, 2);
      const headingCode = result.hsCode.substring(0, 4);
      const subheadingCode = result.hsCode;
      
      // Find or fetch chapter
      const chapterData = chapters.find(c => c.code === chapterCode) || 
        await hsCodeService.getChapters().then(
          chapters => chapters.find(c => c.code === chapterCode)
        );
      
      if (chapterData) {
        // Select chapter
        await selectChapter({
          code: chapterData.code,
          name: chapterData.name,
          description: chapterData.description
        });
        
        // Find or fetch heading
        const headingData = headings.find(h => h.code === headingCode) || 
          await hsCodeService.getHeadings(chapterCode).then(
            headings => headings.find(h => h.code === headingCode)
          );
        
        if (headingData) {
          // Select heading
          await selectHeading({
            code: headingData.code,
            name: headingData.name,
            description: headingData.description
          });
          
          // Find or fetch subheading
          const subheadingData = subheadings.find(s => s.code === subheadingCode) || 
            await hsCodeService.getSubheadings(headingCode).then(
              subheadings => subheadings.find(s => s.code === subheadingCode)
            );
          
          if (subheadingData) {
            // Select subheading
            selectSubheading({
              code: subheadingData.code,
              name: subheadingData.name,
              description: subheadingData.description
            });
            
            // Switch to guided view
            setActiveTab('guided');
          }
        }
      }
      
      // Update confidence score
      setConfidenceScore(result.confidence);
    } catch (error) {
      console.error('Error selecting search result:', error);
    }
  };
  
  // Format HS code with dots
  const formatHSCode = (code: string): string => {
    if (!code) return '';
    const cleanCode = code.replace(/\./g, '');
    if (cleanCode.length <= 2) return cleanCode;
    if (cleanCode.length <= 4) return `${cleanCode.substring(0, 2)}.${cleanCode.substring(2)}`;
    return `${cleanCode.substring(0, 2)}.${cleanCode.substring(2, 4)}.${cleanCode.substring(4)}`;
  };
  
  // Get confidence level class
  const getConfidenceClass = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  // Get confidence icon
  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle size={16} className="text-green-600" />;
    return <AlertTriangle size={16} className="text-yellow-600" />;
  };
  
  // Effect for search
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const delaySearch = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(delaySearch);
    }
  }, [searchQuery]);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">HS Code Classification</h2>
        <p className="text-gray-600 mt-1">
          Classify your product to determine applicable tariffs and regulations for export
        </p>
      </div>
      
      {/* Product being classified */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">{productName}</h3>
            
            {classificationStep === 4 && (
              <div className={`ml-3 px-3 py-1 rounded-full flex items-center text-xs font-medium ${getConfidenceClass(confidenceScore)}`}>
                {getConfidenceIcon(confidenceScore)}
                <span className="ml-1">
                  HS Code: {formatHSCode(selectedSubheading?.code || '')}
                </span>
                <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs">
                  {Math.round(confidenceScore)}% match
                </span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{productDescription}</p>
        </div>
      </div>
      
      {/* Classification method tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Classification Methods">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guided'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('guided')}
          >
            Guided Selection
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('search')}
          >
            Smart Search
          </button>
        </nav>
      </div>
      
      {/* Main content based on active tab */}
      {activeTab === 'guided' ? (
        /* Guided Classification UI */
        <div>
          {/* Progress indicator */}
          <div className="flex items-center mb-8">
            <div className={`h-2 w-16 rounded-full ${classificationStep >= 1 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className="h-px w-4 bg-gray-200"></div>
            <div className={`h-2 w-16 rounded-full ${classificationStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className="h-px w-4 bg-gray-200"></div>
            <div className={`h-2 w-16 rounded-full ${classificationStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className="h-px w-4 bg-gray-200"></div>
            <div className={`h-2 w-16 rounded-full ${classificationStep >= 4 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
          </div>
          
          {classificationStep < 4 ? (
            <>
              {/* Step 1: Chapter Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step 1: Select Chapter (2-digit)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <select 
                    className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                    value={selectedChapter?.code || ''}
                    onChange={(e) => {
                      const chapter = chapters.find(c => c.code === e.target.value);
                      if (chapter) {
                        selectChapter({
                          code: chapter.code,
                          name: chapter.name,
                          description: chapter.description
                        });
                      } else {
                        // Reset to step 0 if no chapter is selected
                        setSelectedChapter(null);
                        setSelectedHeading(null);
                        setSelectedSubheading(null);
                        setClassificationStep(0);
                      }
                    }}
                    disabled={loading.chapters}
                  >
                    <option value="">Select a chapter...</option>
                    {chapters.map(chapter => (
                      <option 
                        key={chapter.code} 
                        value={chapter.code}
                      >
                        {chapter.code} - {chapter.name}
                        {chapter.confidence && chapter.confidence > 80 ? " (Recommended)" : ""}
                      </option>
                    ))}
                  </select>
                  {loading.chapters && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Loader size={16} className="text-purple-500 animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Chapter details when selected */}
                {selectedChapter && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {selectedChapter.code} - {selectedChapter.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedChapter.description}</p>
                      </div>
                      <ConfidenceIndicator 
                        score={confidenceScore}
                        size="sm"
                        showLabel={false}
                        showTooltip={true}
                      />
                    </div>
                    
                    <ProductExamples
                      examples={chapterExamples}
                      title="Chapter Examples"
                      initiallyExpanded={false}
                    />
                  </div>
                )}
              </div>
              
              {/* Step 2: Heading Selection */}
              {classificationStep >= 1 && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 2: Select Heading (4-digit)
                  </label>
                  <select 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    value={selectedHeading?.code || ''}
                    onChange={(e) => {
                      const heading = headings.find(h => h.code === e.target.value);
                      if (heading) {
                        selectHeading({
                          code: heading.code,
                          name: heading.name,
                          description: heading.description
                        });
                      } else {
                        // Reset to step 1 if no heading is selected
                        setSelectedHeading(null);
                        setSelectedSubheading(null);
                        setClassificationStep(1);
                      }
                    }}
                    disabled={loading.headings}
                  >
                    <option value="">Select a heading...</option>
                    {headings.map(heading => (
                      <option 
                        key={heading.code} 
                        value={heading.code}
                      >
                        {heading.code} - {heading.name}
                        {heading.confidence && heading.confidence > 80 ? " (Recommended)" : ""}
                      </option>
                    ))}
                  </select>
                  {loading.headings && (
                    <div className="flex justify-center py-2">
                      <Loader size={16} className="text-purple-500 animate-spin" />
                    </div>
                  )}
                  
                  {/* Heading details when selected */}
                  {selectedHeading && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {selectedHeading.code} - {selectedHeading.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{selectedHeading.description}</p>
                        </div>
                        <ConfidenceIndicator 
                          score={confidenceScore}
                          size="sm"
                          showLabel={false}
                          showTooltip={true}
                        />
                      </div>
                      
                      <ProductExamples
                        examples={headingExamples}
                        title="Heading Examples"
                        initiallyExpanded={false}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 3: Subheading Selection */}
              {classificationStep >= 2 && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 3: Select Subheading (6-digit)
                  </label>
                  <select 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    value={selectedSubheading?.code || ''}
                    onChange={(e) => {
                      const subheading = subheadings.find(s => s.code === e.target.value);
                      if (subheading) {
                        selectSubheading({
                          code: subheading.code,
                          name: subheading.name,
                          description: subheading.description
                        });
                      } else {
                        // Reset to step 2 if no subheading is selected
                        setSelectedSubheading(null);
                        setClassificationStep(2);
                      }
                    }}
                    disabled={loading.subheadings}
                  >
                    <option value="">Select a subheading...</option>
                    {subheadings.map(subheading => (
                      <option 
                        key={subheading.code} 
                        value={subheading.code}
                      >
                        {subheading.code} - {subheading.name}
                        {subheading.confidence && subheading.confidence > 80 ? " (Recommended)" : ""}
                      </option>
                    ))}
                  </select>
                  {loading.subheadings && (
                    <div className="flex justify-center py-2">
                      <Loader size={16} className="text-purple-500 animate-spin" />
                    </div>
                  )}
                  
                  {/* Subheading details when selected */}
                  {selectedSubheading && classificationStep === 3 && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {selectedSubheading.code} - {selectedSubheading.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{selectedSubheading.description}</p>
                        </div>
                        <ConfidenceIndicator 
                          score={confidenceScore}
                          size="sm"
                          showLabel={false}
                          showTooltip={true}
                        />
                      </div>
                      
                      <ProductExamples
                        examples={subheadingExamples}
                        title="Subheading Examples"
                        initiallyExpanded={false}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-sm text-gray-500 italic mb-4">
                Not sure where to start? Just pick what feels closest — you can change it later.
              </div>
            </>
          ) : (
            // Success State (Step 4)
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Classification Complete!</h3>
              <p className="text-gray-600 mb-4">
                You've classified {productName} as:
              </p>
              <div className="inline-block bg-gray-100 rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                    {selectedChapter?.code}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                  <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                    {selectedHeading?.code.substring(2)}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                  <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                    {selectedSubheading?.code.substring(4)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {selectedChapter?.name} &gt; {selectedHeading?.name} &gt; {selectedSubheading?.name}
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <ConfidenceIndicator 
                  score={confidenceScore}
                  size="md"
                  showLabel={true}
                  showTooltip={true}
                />
              </div>
              <button 
                className="text-purple-600 font-medium flex items-center justify-center mx-auto"
                onClick={resetClassification}
              >
                <ChevronDown size={16} className="mr-1" /> Change classification
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Search-Based Classification UI */
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for your product
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text"
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter product name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter specific details about your product for more accurate results
            </p>
          </div>
          
          {/* Search results */}
          <div className="mb-6">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader size={24} className="text-purple-600 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Suggested HS Classifications
                </h3>
                <div className="space-y-3">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={idx}
                      className="border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
                      onClick={() => selectSearchResult(result)}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <span className="text-lg font-medium text-gray-900">{formatHSCode(result.hsCode)}</span>
                              <ConfidenceIndicator 
                                score={result.confidence}
                                size="sm"
                                showLabel={false}
                                showTooltip={false}
                                showIcon={true}
                              />
                            </div>
                            <h4 className="font-medium text-gray-800 mt-1">{result.description}</h4>
                          </div>
                          <ArrowRight size={20} className="text-gray-400" />
                        </div>
                        
                        {result.metadata && (
                          <div className="mt-2">
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              {result.metadata.chapter.name} 
                              <ChevronRight size={12} className="mx-1 text-gray-400" />
                              {result.metadata.heading.name}
                              <ChevronRight size={12} className="mx-1 text-gray-400" />
                              {result.metadata.subheading.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchQuery.trim().length >= 3 ? (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">
                  No results found. Try using more specific product details or different terms.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <Info size={20} className="text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Search Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Include specific materials or ingredients</li>
                      <li>• Mention the purpose or use of the product</li>
                      <li>• Specify packaging type or size when relevant</li>
                      <li>• Use industry-specific terminology if applicable</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Help section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex items-start">
          <Info size={20} className="text-gray-500 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">What is an HS Code?</h4>
            <p className="text-sm text-gray-600 mt-1">
              The Harmonized System (HS) is an international nomenclature for classifying products for customs purposes. 
              It consists of 6 digits, with the first 2 representing the chapter, the next 2 the heading, and the final 2 the subheading.
              Accurate classification helps determine applicable tariffs and regulations for your exports.
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between pt-4 border-t border-gray-200">
        <button className="flex items-center px-4 py-2 text-gray-600 font-medium">
          <ArrowLeft size={18} className="mr-2" />
          Back
        </button>
        
        <button 
          className={`flex items-center px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
            classificationStep === 4 
              ? 'bg-purple-600 text-white font-medium hover:bg-purple-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={classificationStep < 4}
        >
          Continue
          <ArrowRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default EnhancedHSCodeClassification; 