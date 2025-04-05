'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useAssessment, Product } from '@/contexts/assessment-context';
import { HSCodeHierarchyService } from '@/services/product/hsCodeHierarchy.service';
import { CacheService } from '@/services/cache-service';
import { ProductConsolidationService } from '@/services/product/productConsolidation.service';

interface HSCodeSelection {
  chapter: {
    code: string;
    description: string;
  } | null;
  heading: {
    code: string;
    description: string;
  } | null;
  subheading: {
    code: string;
    description: string;
  } | null;
}

interface ClassifiedProduct {
  id: string;
  name: string;
  description?: string;
  hsCodeSelection: HSCodeSelection;
  isClassified: boolean;
}

// Define interfaces for the HS code data structures
interface HSCodeChapter {
  code: string;
  description: string;
}

interface HSCodeHeading {
  code: string;
  description: string;
}

interface HSCodeSubheading {
  code: string;
  description: string;
}

// Extended business profile product type
interface BusinessProfileProduct {
  id?: string;
  name: string;
  description: string;
  category?: string;
  specifications?: Record<string, any>;
}

export default function ProductClassificationPage() {
  // State for products and classification
  const { state, dispatch } = useAssessment();
  const [products, setProducts] = useState<ClassifiedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [hsCodeSelections, setHsCodeSelections] = useState<Record<string, HSCodeSelection>>({});
  
  // States for HS code hierarchy data
  const [chapters, setChapters] = useState<HSCodeChapter[]>([]);
  const [headings, setHeadings] = useState<HSCodeHeading[]>([]);
  const [subheadings, setSubheadings] = useState<HSCodeSubheading[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<{ operational: boolean; message: string }>({
    operational: true,
    message: '',
  });
  
  // Initialize services
  const [hsCodeService] = useState(() => {
    // Check for API keys and warn if they're missing
    const hasHsCodeApiKey = !!process.env.HS_CODE_API_KEY;
    const hasWitsApiKey = !!process.env.WITS_API_KEY;
    console.log('Initializing HSCodeHierarchyService');
    
    // Log warning about missing keys
    if (!hasHsCodeApiKey) {
      console.warn('HS_CODE_API_KEY not configured - mock data will be used');
    }
    if (!hasWitsApiKey) {
      console.warn('WITS_API_KEY not configured - mock data will be used');
    }
    
    // Initialize the service regardless - it will use mock data when API keys aren't available
    return new HSCodeHierarchyService();
  });
  
  const [consolidationService] = useState(() => new ProductConsolidationService());
  
  // Load products from assessment context
  useEffect(() => {
    if (state.businessProfile?.products && state.businessProfile.products.length > 0) {
      // First consolidate products to group similar variants
      const consolidatedGroups = consolidationService.consolidateProducts(
        state.businessProfile.products.map((p: BusinessProfileProduct) => ({
          id: p.id || `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: p.name,
          description: p.description || '',
          selected: true,
          attributes: p.specifications || {}
        }))
      );
      
      // Convert consolidated groups back to flat list for classification
      const classifiableProducts: ClassifiedProduct[] = consolidatedGroups.flatMap(group => {
        // Take the base product from each group
        const mainProduct = group.variants[0];
        return {
          id: mainProduct.id || `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: group.baseType,
          description: group.description || mainProduct.description || '',
          hsCodeSelection: {
            chapter: null,
            heading: null,
            subheading: null
          },
          isClassified: false
        };
      });
      
      setProducts(classifiableProducts);
      
      // Select the first product by default
      if (classifiableProducts.length > 0) {
        setSelectedProductId(classifiableProducts[0].id);
      }
    }
  }, [state.businessProfile, consolidationService]);
  
  // Load HS code chapters
  const loadChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First attempt to load from service
      const chapters = await hsCodeService.getHSCodeChapters();
      
      if (chapters && chapters.length > 0) {
        setChapters(chapters);
        setLoading(false);
        setServiceStatus({
          operational: true,
          message: ''
        });
      } else {
        // If no chapters returned, fall back to mock data
        console.warn('No chapters returned from service, using mock data');
        const mockChapters = getMockHSCodeChapters();
        setChapters(mockChapters);
        setLoading(false);
        setServiceStatus({
          operational: false,
          message: 'HS Code service returned no data. Using mock data.'
        });
      }
    } catch (err: any) {
      console.error('Error loading HS code chapters:', err);
      
      // Fall back to mock data
      const mockChapters = getMockHSCodeChapters();
      setChapters(mockChapters);
      setLoading(false);
      setServiceStatus({
        operational: false,
        message: `Error loading HS code chapters: ${err.message}. Using mock data.`
      });
    }
  }, [hsCodeService]);
  
  // Get mock HS code chapters when service is unavailable
  const getMockHSCodeChapters = () => {
    return [
      { code: '01', description: 'Live animals', level: 'chapter' },
      { code: '02', description: 'Meat and edible meat offal', level: 'chapter' },
      { code: '03', description: 'Fish and crustaceans', level: 'chapter' },
      { code: '04', description: 'Dairy produce; birds\' eggs; honey', level: 'chapter' },
      { code: '07', description: 'Edible vegetables', level: 'chapter' },
      { code: '08', description: 'Edible fruit and nuts', level: 'chapter' },
      { code: '16', description: 'Preparations of meat, fish or crustaceans', level: 'chapter' },
      { code: '19', description: 'Preparations of cereals, flour, starch or milk', level: 'chapter' },
      { code: '20', description: 'Preparations of vegetables, fruit, nuts', level: 'chapter' },
      { code: '21', description: 'Miscellaneous edible preparations', level: 'chapter' },
      { code: '22', description: 'Beverages, spirits and vinegar', level: 'chapter' },
      { code: '33', description: 'Essential oils and cosmetics', level: 'chapter' },
      { code: '34', description: 'Soap, washing and lubricating preparations', level: 'chapter' },
      { code: '61', description: 'Articles of apparel and clothing accessories, knitted', level: 'chapter' },
      { code: '62', description: 'Articles of apparel and clothing accessories, not knitted', level: 'chapter' }
    ];
  };

  // Get mock HS code headings for a given chapter
  const getMockHSCodeHeadings = (chapterCode: string) => {
    // Return different mock headings based on the chapter
    switch(chapterCode) {
      case '08': // Fruit
        return [
          { code: '0801', description: 'Coconuts, Brazil nuts and cashew nuts', level: 'heading' },
          { code: '0802', description: 'Other nuts, fresh or dried', level: 'heading' },
          { code: '0803', description: 'Bananas, including plantains', level: 'heading' },
          { code: '0804', description: 'Dates, figs, pineapples, avocados, guavas, mangoes', level: 'heading' },
          { code: '0805', description: 'Citrus fruit, fresh or dried', level: 'heading' }
        ];
      case '22': // Beverages
        return [
          { code: '2201', description: 'Waters, including natural or artificial mineral waters', level: 'heading' },
          { code: '2202', description: 'Waters with added sugar or flavoring', level: 'heading' },
          { code: '2203', description: 'Beer made from malt', level: 'heading' },
          { code: '2204', description: 'Wine of fresh grapes', level: 'heading' },
          { code: '2205', description: 'Vermouth and other wine of fresh grapes', level: 'heading' }
        ];
      default:
        return [
          { code: `${chapterCode}01`, description: `First heading in chapter ${chapterCode}`, level: 'heading' },
          { code: `${chapterCode}02`, description: `Second heading in chapter ${chapterCode}`, level: 'heading' },
          { code: `${chapterCode}03`, description: `Third heading in chapter ${chapterCode}`, level: 'heading' }
        ];
    }
  };
  
  // Get mock HS code subheadings for a given heading
  const getMockHSCodeSubheadings = (headingCode: string) => {
    // Return different mock subheadings based on the heading
    switch(headingCode) {
      case '0802': // Nuts
        return [
          { code: '080211', description: 'Almonds, in shell', level: 'subheading' },
          { code: '080212', description: 'Almonds, shelled', level: 'subheading' },
          { code: '080221', description: 'Hazelnuts or filberts, in shell', level: 'subheading' },
          { code: '080222', description: 'Hazelnuts or filberts, shelled', level: 'subheading' },
          { code: '080231', description: 'Walnuts, in shell', level: 'subheading' },
          { code: '080232', description: 'Walnuts, shelled', level: 'subheading' },
          { code: '080242', description: 'Chestnuts, shelled', level: 'subheading' },
          { code: '080252', description: 'Pistachios, shelled', level: 'subheading' },
          { code: '080261', description: 'Macadamia nuts, in shell', level: 'subheading' },
          { code: '080262', description: 'Macadamia nuts, shelled', level: 'subheading' }
        ];
      case '2204': // Wine
        return [
          { code: '220410', description: 'Sparkling wine', level: 'subheading' },
          { code: '220421', description: 'Other wine; grape must in containers of 2L or less', level: 'subheading' },
          { code: '220422', description: 'Wine in containers >2L but <10L', level: 'subheading' },
          { code: '220429', description: 'Other wine and grape must', level: 'subheading' },
          { code: '220430', description: 'Other grape must', level: 'subheading' }
        ];
      default:
        return [
          { code: `${headingCode}10`, description: `First subheading of ${headingCode}`, level: 'subheading' },
          { code: `${headingCode}20`, description: `Second subheading of ${headingCode}`, level: 'subheading' },
          { code: `${headingCode}30`, description: `Third subheading of ${headingCode}`, level: 'subheading' },
          { code: `${headingCode}90`, description: `Other items of ${headingCode}`, level: 'subheading' }
        ];
    }
  };
  
  // Get the currently selected product
  const selectedProduct = selectedProductId 
    ? products.find(product => product.id === selectedProductId) || null
    : null;
  
  // Get the current HS code selection for the selected product
  const currentSelection = selectedProductId && hsCodeSelections[selectedProductId]
    ? hsCodeSelections[selectedProductId]
    : { chapter: null, heading: null, subheading: null };
  
  // Handle chapter selection
  const handleChapterSelect = useCallback(async (chapter: HSCodeNode) => {
    setUiState(prev => ({
      ...prev,
      selectedChapter: chapter,
      selectedHeading: null,
      selectedSubheading: null,
      headings: [],
      subheadings: [],
      loading: true,
      error: null
    }));
    
    try {
      // First try to get headings from the service
      const headings = await hsCodeService.getHSCodeHeadings(chapter.code);
      
      if (headings && headings.length > 0) {
        setUiState(prev => ({
          ...prev,
          headings,
          loading: false,
          serviceStatus: 'online',
          error: null
        }));
      } else {
        // If no headings returned, use mock data
        console.warn(`No headings returned for chapter ${chapter.code}, using mock data`);
        const mockHeadings = getMockHSCodeHeadings(chapter.code);
        setUiState(prev => ({
          ...prev,
          headings: mockHeadings,
          loading: false,
          usingMockData: true,
          serviceStatus: prev.serviceStatus === 'online' ? 'partial' : 'offline',
          error: 'HS Code service returned no headings. Using mock data.'
        }));
      }
    } catch (err: any) {
      console.error(`Error loading headings for chapter ${chapter.code}:`, err);
      
      // Fall back to mock data
      const mockHeadings = getMockHSCodeHeadings(chapter.code);
      setUiState(prev => ({
        ...prev,
        headings: mockHeadings,
        loading: false,
        usingMockData: true,
        serviceStatus: 'offline',
        error: `Error loading headings: ${err.message}. Using mock data.`
      }));
    }
  }, [hsCodeService]);
  
  // Handle heading selection
  const handleHeadingSelect = useCallback(async (heading: HSCodeNode) => {
    setUiState(prev => ({
      ...prev,
      selectedHeading: heading,
      selectedSubheading: null,
      subheadings: [],
      loading: true,
      error: null
    }));
    
    try {
      // First try to get subheadings from the service
      const subheadings = await hsCodeService.getHSCodeSubheadings(heading.code);
      
      if (subheadings && subheadings.length > 0) {
        setUiState(prev => ({
          ...prev,
          subheadings,
          loading: false,
          serviceStatus: 'online',
          error: null
        }));
      } else {
        // If no subheadings returned, use mock data
        console.warn(`No subheadings returned for heading ${heading.code}, using mock data`);
        const mockSubheadings = getMockHSCodeSubheadings(heading.code);
        setUiState(prev => ({
          ...prev,
          subheadings: mockSubheadings,
          loading: false,
          usingMockData: true,
          serviceStatus: prev.serviceStatus === 'online' ? 'partial' : 'offline',
          error: 'HS Code service returned no subheadings. Using mock data.'
        }));
      }
    } catch (err: any) {
      console.error(`Error loading subheadings for heading ${heading.code}:`, err);
      
      // Fall back to mock data
      const mockSubheadings = getMockHSCodeSubheadings(heading.code);
      setUiState(prev => ({
        ...prev,
        subheadings: mockSubheadings,
        loading: false,
        usingMockData: true,
        serviceStatus: 'offline',
        error: `Error loading subheadings: ${err.message}. Using mock data.`
      }));
    }
  }, [hsCodeService]);
  
  // Handle subheading selection (final HS code)
  const handleSubheadingSelect = (subheadingCode: string, subheadingDescription: string) => {
    if (!selectedProductId || !currentSelection.chapter || !currentSelection.heading) return;
    
    // Update selection state with complete selection
    const newSelection: HSCodeSelection = {
      ...currentSelection,
      subheading: { code: subheadingCode, description: subheadingDescription }
    };
    
    setHsCodeSelections({
      ...hsCodeSelections,
      [selectedProductId]: newSelection
    });
    
    // Mark product as classified
    setProducts(products.map(product => 
      product.id === selectedProductId
        ? { ...product, isClassified: true, hsCodeSelection: newSelection }
        : product
    ));
    
    // Update assessment context
    saveClassificationToAssessment(selectedProductId, subheadingCode, subheadingDescription);
  };
  
  // Save classification to assessment context
  const saveClassificationToAssessment = (
    productId: string, 
    hsCode: string, 
    description: string
  ) => {
    // Find the product in the assessment context
    const assessmentProducts = state.businessProfile?.products || [];
    
    // Create a properly typed product update - using specifications instead of attributes
    const updatedProducts = assessmentProducts.map((product: BusinessProfileProduct) => {
      if (product.id === productId) {
        return {
          ...product,
          specifications: {
            ...product.specifications,
            hsCode,
            hsCodeDescription: description
          }
        };
      }
      return product;
    });
    
    // Update the assessment context
    dispatch({
      type: 'SET_BUSINESS_PROFILE',
      payload: {
        ...state.businessProfile!,
        products: updatedProducts
      }
    });
  };
  
  // Handle product selection
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    
    // If product has previous selections, load the corresponding data
    const selection = hsCodeSelections[productId] || { chapter: null, heading: null, subheading: null };
    
    // Reload headings if chapter is selected
    if (selection.chapter) {
      getMockHSCodeHeadings(selection.chapter.code)
        .then(headingsData => {
          setHeadings(headingsData);
          
          // Reload subheadings if heading is selected
          if (selection.heading) {
            getMockHSCodeSubheadings(selection.heading.code)
              .then(subheadingsData => {
                setSubheadings(subheadingsData);
              })
              .catch(err => console.error('Error reloading subheadings:', err));
          }
        })
        .catch(err => console.error('Error reloading headings:', err));
    }
  };
  
  // Calculate progress
  const classifiedCount = products.filter(p => p.isClassified).length;
  const progress = products.length > 0 ? (classifiedCount / products.length) * 100 : 0;
  
  // Helper function to get status message based on service status
  const getStatusMessage = (status: string, usingMock: boolean): JSX.Element => {
    if (status === 'online' && !usingMock) {
      return <span className="text-green-600">✓ Using live HS code service</span>;
    } else if (status === 'partial' || (status === 'online' && usingMock)) {
      return <span className="text-amber-600">⚠️ Using partial mock data - some API endpoints unavailable</span>;
    } else {
      return <span className="text-red-600">❌ HS code service unavailable - using mock data</span>;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Product HS Code Classification
      </Typography>
      
      {/* Service status indicator */}
      <div className="mb-4 text-sm">
        {getStatusMessage(serviceStatus.operational ? 'online' : 'offline', serviceStatus.operational === false)}
      </div>
      
      {/* Error message */}
      {serviceStatus.operational === false && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {serviceStatus.message}
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Classify your products with the correct HS (Harmonized System) codes by following the three-step selection process.
          HS codes are used worldwide for customs tariffs and international trade statistics.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Product List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Products to Classify ({classifiedCount}/{products.length})
            </Typography>
            
            <Box sx={{ mt: 2, mb: 3 }}>
              <div style={{ 
                height: 10, 
                backgroundColor: '#e0e0e0', 
                borderRadius: 5,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  backgroundColor: progress === 100 ? '#4caf50' : '#2196f3',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </Box>
            
            <List>
              {products.map((product) => (
                <ListItem
                  key={product.id}
                  button
                  selected={selectedProductId === product.id}
                  onClick={() => handleProductSelect(product.id)}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedProductId === product.id ? 'action.selected' : 'transparent'
                  }}
                  secondaryAction={
                    product.isClassified ? (
                      <CheckCircleIcon color="success" />
                    ) : null
                  }
                >
                  <ListItemText 
                    primary={product.name}
                    secondary={product.isClassified ? 
                      `HS Code: ${product.hsCodeSelection.subheading?.code}` : 
                      'Not classified'
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            {products.length === 0 && (
              <Alert severity="info">
                No products to classify. Please add products in the previous step.
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Classification Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {selectedProduct ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Classifying: {selectedProduct.name}
                  </Typography>
                  {selectedProduct.description && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedProduct.description}
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Step 1: Chapter Selection */}
                <Accordion 
                  expanded={!currentSelection.chapter}
                  disabled={!chapters.length || !!currentSelection.chapter}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Step 1: Select HS Chapter {currentSelection.chapter && 
                        `(${currentSelection.chapter.code} - ${currentSelection.chapter.description})`}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {chapters.map((chapter) => (
                        <Grid item xs={12} sm={6} key={chapter.code}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                boxShadow: 3,
                                bgcolor: 'action.hover'
                              }
                            }}
                            onClick={() => handleChapterSelect(chapter)}
                          >
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                Chapter {chapter.code}
                              </Typography>
                              <Typography variant="body2">
                                {chapter.description}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {loading && <CircularProgress sx={{ mt: 2 }} />}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                  </AccordionDetails>
                </Accordion>
                
                {/* Step 2: Heading Selection */}
                <Accordion 
                  expanded={!!currentSelection.chapter && !currentSelection.heading}
                  disabled={!currentSelection.chapter || !headings.length || !!currentSelection.heading}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Step 2: Select HS Heading {currentSelection.heading && 
                        `(${currentSelection.heading.code} - ${currentSelection.heading.description})`}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {headings.map((heading) => (
                        <Grid item xs={12} key={heading.code}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                boxShadow: 3,
                                bgcolor: 'action.hover'
                              }
                            }}
                            onClick={() => handleHeadingSelect(heading)}
                          >
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                {heading.code}
                              </Typography>
                              <Typography variant="body2">
                                {heading.description}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {loading && <CircularProgress sx={{ mt: 2 }} />}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    
                    {currentSelection.chapter && (
                      <Button 
                        sx={{ mt: 2 }}
                        onClick={() => {
                          setHsCodeSelections({
                            ...hsCodeSelections,
                            [selectedProductId]: { chapter: null, heading: null, subheading: null }
                          });
                          setHeadings([]);
                          setSubheadings([]);
                        }}
                      >
                        Back to Chapters
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
                
                {/* Step 3: Subheading Selection */}
                <Accordion 
                  expanded={!!currentSelection.heading && !currentSelection.subheading}
                  disabled={!currentSelection.heading || !subheadings.length}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Step 3: Select HS Subheading {currentSelection.subheading && 
                        `(${currentSelection.subheading.code} - ${currentSelection.subheading.description})`}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {subheadings.map((subheading) => (
                        <Grid item xs={12} key={subheading.code}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                boxShadow: 3,
                                bgcolor: 'action.hover'
                              }
                            }}
                            onClick={() => handleSubheadingSelect(subheading.code, subheading.description)}
                          >
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                {subheading.code}
                              </Typography>
                              <Typography variant="body2">
                                {subheading.description}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {loading && <CircularProgress sx={{ mt: 2 }} />}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    
                    {currentSelection.heading && (
                      <Button 
                        sx={{ mt: 2 }}
                        onClick={() => {
                          if (currentSelection.chapter) {
                            setHsCodeSelections({
                              ...hsCodeSelections,
                              [selectedProductId]: { 
                                chapter: currentSelection.chapter, 
                                heading: null, 
                                subheading: null 
                              }
                            });
                            setSubheadings([]);
                            
                            // Reload headings
                            handleChapterSelect(
                              currentSelection.chapter
                            );
                          }
                        }}
                      >
                        Back to Headings
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
                
                {/* Classification Complete */}
                {selectedProduct.isClassified && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Classification Complete
                    </Typography>
                    <Typography>
                      HS Code: {selectedProduct.hsCodeSelection.subheading?.code}
                    </Typography>
                    <Typography variant="body2">
                      {selectedProduct.hsCodeSelection.subheading?.description}
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setHsCodeSelections({
                          ...hsCodeSelections,
                          [selectedProductId]: { chapter: null, heading: null, subheading: null }
                        });
                        setProducts(products.map(product => 
                          product.id === selectedProductId
                            ? { 
                                ...product, 
                                isClassified: false, 
                                hsCodeSelection: { chapter: null, heading: null, subheading: null } 
                              }
                            : product
                        ));
                        setHeadings([]);
                        setSubheadings([]);
                      }}
                    >
                      Reclassify
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">
                Select a product from the list to classify.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Navigation Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined">
          Back
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          disabled={products.length > 0 && products.some(p => !p.isClassified)}
        >
          Next
        </Button>
      </Box>
    </Container>
  );
} 