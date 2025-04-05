import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, CheckCircle, HelpCircle, ArrowLeft, ArrowRight, Search, Edit } from 'lucide-react';

const ProductClassificationPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [classificationStep, setClassificationStep] = useState(0); // 0: not started, 1: chapter, 2: heading, 3: subheading, 4: complete
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedHeading, setSelectedHeading] = useState(null);
  const [selectedSubheading, setSelectedSubheading] = useState(null);
  
  // Sample detected products from website analysis
  const detectedProducts = [
    { id: 1, name: 'Premium Red Wine', description: 'South African Cabernet Sauvignon, 750ml bottle' },
    { id: 2, name: 'Organic Rooibos Tea', description: 'Loose leaf organic rooibos tea, 250g packaging' },
    { id: 3, name: 'Handcrafted Wooden Bowls', description: 'Artisanal wooden bowls made from local timber' },
  ];
  
  // Sample HS code data
  const chapters = [
    { code: '22', name: 'Beverages, spirits and vinegar' },
    { code: '09', name: 'Coffee, tea, maté and spices' },
    { code: '44', name: 'Wood and articles of wood; wood charcoal' },
  ];
  
  const headings = {
    '22': [
      { code: '2204', name: 'Wine of fresh grapes, including fortified wines' },
      { code: '2208', name: 'Spirits, liqueurs and other spirituous beverages' },
    ],
    '09': [
      { code: '0902', name: 'Tea, whether or not flavoured' },
    ],
    '44': [
      { code: '4419', name: 'Tableware and kitchenware, of wood' },
      { code: '4420', name: 'Wood marquetry and inlaid wood; ornaments of wood' },
    ]
  };
  
  const subheadings = {
    '2204': [
      { code: '220421', name: 'In containers holding 2 litres or less' },
      { code: '220422', name: 'In containers holding more than 2 litres but not more than 10 litres' },
    ],
    '0902': [
      { code: '090230', name: 'Black tea (fermented) and partly fermented tea' },
      { code: '090240', name: 'Other black tea (fermented) and other partly fermented tea' },
    ],
    '4419': [
      { code: '441911', name: 'Bread boards, chopping boards and similar boards' },
      { code: '441919', name: 'Other tableware and kitchenware, of wood' },
    ]
  };
  
  const toggleProduct = (productId) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
      setSelectedProduct(productId);
      setClassificationStep(0);
    }
  };
  
  const selectChapter = (chapter) => {
    setSelectedChapter(chapter);
    setClassificationStep(1);
  };
  
  const selectHeading = (heading) => {
    setSelectedHeading(heading);
    setClassificationStep(2);
  };
  
  const selectSubheading = (subheading) => {
    setSelectedSubheading(subheading);
    setClassificationStep(3);
    
    // Auto-advance to completion after slight delay
    setTimeout(() => {
      setClassificationStep(4);
    }, 800);
  };
  
  const resetClassification = () => {
    setClassificationStep(0);
    setSelectedChapter(null);
    setSelectedHeading(null);
    setSelectedSubheading(null);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Progress Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 p-6">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800">Export Assessment</h2>
          <p className="text-sm text-gray-500 mt-1">Step 2 of 5</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center py-2 px-3 rounded-lg bg-gray-100">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm">1</div>
            <span className="ml-3 text-gray-500 font-medium">Business Profile</span>
            <CheckCircle className="ml-auto text-green-500" size={16} />
          </div>
          
          <div className="flex items-center py-2 px-3 rounded-lg bg-purple-100">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-sm">2</div>
            <span className="ml-3 text-purple-700 font-medium">Product Selection</span>
          </div>
          
          <div className="flex items-center py-2 px-3 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm">3</div>
            <span className="ml-3 text-gray-400">Production Capacity</span>
          </div>
          
          <div className="flex items-center py-2 px-3 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm">4</div>
            <span className="ml-3 text-gray-400">Target Markets</span>
          </div>
          
          <div className="flex items-center py-2 px-3 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm">5</div>
            <span className="ml-3 text-gray-400">Certifications</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Select Products for Export</h1>
            <p className="text-gray-600 mt-2">We've detected these products from your website. Select the ones you plan to export.</p>
          </div>
          
          {/* Products Grid */}
          <div className="space-y-4 mb-8">
            {detectedProducts.map(product => (
              <div 
                key={product.id}
                className={`bg-white rounded-2xl shadow-md transition-all duration-300 ease-in-out overflow-hidden
                  ${expandedProduct === product.id ? 'border-2 border-purple-600 bg-purple-50' : 'border border-gray-200'}`}
              >
                {/* Product Card Header */}
                <div 
                  className="p-6 flex items-center cursor-pointer"
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={selectedProduct === product.id || classificationStep === 4}
                        onChange={() => setSelectedProduct(product.id)}
                      />
                      <h3 className="ml-3 text-lg font-medium text-gray-900">{product.name}</h3>
                      
                      {classificationStep === 4 && selectedProduct === product.id && (
                        <div className="ml-3 px-3 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          HS Code: {selectedChapter?.code}.{selectedHeading?.code.slice(2)}.{selectedSubheading?.code.slice(4)}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 ml-8 text-sm text-gray-500">{product.description}</p>
                  </div>
                  
                  {expandedProduct === product.id ? (
                    <ChevronDown className="text-gray-400" size={24} />
                  ) : (
                    <ChevronRight className="text-gray-400" size={24} />
                  )}
                </div>
                
                {/* Expanded Classification UI */}
                {expandedProduct === product.id && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="mt-4">
                      {classificationStep < 4 ? (
                        <>
                          <div className="flex items-center mb-4">
                            <div className="text-sm font-medium text-gray-500 flex items-center">
                              What is an HS Code? <HelpCircle size={16} className="ml-1 text-gray-400" />
                            </div>
                          </div>
                          
                          <div className="flex items-center mb-6">
                            <div className={`h-2 w-12 rounded-full ${classificationStep >= 1 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                            <div className="h-px w-8 bg-gray-200"></div>
                            <div className={`h-2 w-12 rounded-full ${classificationStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                            <div className="h-px w-8 bg-gray-200"></div>
                            <div className={`h-2 w-12 rounded-full ${classificationStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                          </div>
                          
                          {/* Step 1: Chapter Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                  selectChapter(chapter);
                                }}
                              >
                                <option value="">Select a chapter...</option>
                                {chapters.map(chapter => (
                                  <option key={chapter.code} value={chapter.code}>
                                    {chapter.code} - {chapter.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          {/* Step 2: Heading Selection */}
                          {classificationStep >= 1 && (
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Step 2: Select Heading (4-digit)
                              </label>
                              <select 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                value={selectedHeading?.code || ''}
                                onChange={(e) => {
                                  const heading = headings[selectedChapter.code].find(h => h.code === e.target.value);
                                  selectHeading(heading);
                                }}
                              >
                                <option value="">Select a heading...</option>
                                {selectedChapter && headings[selectedChapter.code]?.map(heading => (
                                  <option key={heading.code} value={heading.code}>
                                    {heading.code} - {heading.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Step 3: Subheading Selection */}
                          {classificationStep >= 2 && (
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Step 3: Select Subheading (6-digit)
                              </label>
                              <select 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                value={selectedSubheading?.code || ''}
                                onChange={(e) => {
                                  const subheading = subheadings[selectedHeading.code].find(s => s.code === e.target.value);
                                  selectSubheading(subheading);
                                }}
                              >
                                <option value="">Select a subheading...</option>
                                {selectedHeading && subheadings[selectedHeading.code]?.map(subheading => (
                                  <option key={subheading.code} value={subheading.code}>
                                    {subheading.code} - {subheading.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-500 italic mb-4">
                            Not sure where to start? Just pick what feels closest — you can change it later.
                          </div>
                        </>
                      ) : (
                        // Success State
                        <div className="text-center py-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Classification Complete!</h3>
                          <p className="text-gray-600 mb-4">
                            You've classified {product.name} as:
                          </p>
                          <div className="inline-block bg-gray-100 rounded-lg px-4 py-3 mb-4">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                                {selectedChapter?.code}
                              </div>
                              <ChevronRight size={16} className="text-gray-400" />
                              <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                                {selectedHeading?.code.slice(2)}
                              </div>
                              <ChevronRight size={16} className="text-gray-400" />
                              <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-800 font-medium">
                                {selectedSubheading?.code.slice(4)}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {selectedChapter?.name} &gt; {selectedHeading?.name} &gt; {selectedSubheading?.name}
                            </div>
                          </div>
                          <button 
                            className="text-purple-600 font-medium flex items-center justify-center mx-auto"
                            onClick={resetClassification}
                          >
                            <Edit size={16} className="mr-1" /> Change classification
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add Product Button */}
            <button className="w-full flex items-center justify-center py-4 px-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all">
              <Plus size={20} className="mr-2" />
              Add another product
            </button>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button className="flex items-center px-4 py-2 text-gray-600 font-medium">
              <ArrowLeft size={18} className="mr-2" />
              Back
            </button>
            
            <button className="flex items-center px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              Continue
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductClassificationPage;
