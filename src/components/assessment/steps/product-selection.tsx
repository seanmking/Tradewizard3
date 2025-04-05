'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FADE_IN_ANIMATION } from '@/lib/animation';
import { useAssessment } from '@/contexts/assessment-context';
import type { Product } from '@/contexts/assessment-context';
import { productCategories } from '@/data/product-categories.data';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Card,
  CardContent,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { InfoBox } from '@/components/ui/InfoBox';
import { GridContainer, GridItem } from '@/components/ui/GridWrapper';
import { HSCodeNavigator } from '@/components/HSCode';
import { HSCodeSelection, ClassificationStep } from '@/components/classification/types/classification.interface';
import EditProductHSCodeIntegration from '../../classification/EditProductHSCodeIntegration';
import { HSCodeHierarchyService } from '@/services/product/hsCodeHierarchy.service';
import { CacheService } from '@/services/cache-service';
import { ProductConsolidationService, ProductVariant } from '@/services/product/productConsolidation.service';
import FocusAreaHSCodeSelector from '@/components/classification/FocusAreaHSCodeSelector';
import { HSCodeTariffMCPService } from '@/mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.service';
import { MockDataBanner } from '@/components/ui/MockDataBanner';
import { useMockData } from '@/contexts/mock-data-context';
import { useMockDataMonitor } from '@/hooks/useMockDataMonitor';

// Extend the Product interface to include HS code properties
interface ExtendedProduct extends Omit<Product, 'specifications'> {
  hsCode?: string;
  hsCodeDescription?: string;
  specifications?: Record<string, any> & {
    hsCode?: string;
  };
}

// Interface for ProductSubcategory to include HS code properties
interface ProductSubcategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  hsCode?: string;
  hsCodes?: string[];
  requirements?: {
    documentation: string[];
    regulatoryBodies: string[];
  };
}

// Extend editFormData type to include group
interface EditFormData extends Partial<Product> {
  group?: any;
  hsCode?: string;
  hsCodeDescription?: string;
}

const StyledPaper = styled(Paper)({
  padding: 32, // theme.spacing(4)
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  marginBottom: 24, // theme.spacing(3)
});

const ProductCard = styled(Card)({
  borderRadius: 8,
  marginBottom: 16, // theme.spacing(2)
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
});

const AddProductSection = styled(Box)({
  border: '1px dashed #e2e8f0',
  borderRadius: 8,
  padding: 24, // theme.spacing(3)
  backgroundColor: '#f7fafc',
});

interface CategorySuggestion {
  categoryId: string;
  subcategoryId: string;
  confidence: number;
}

export function ProductSelectionStep() {
  const { state, dispatch } = useAssessment();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productGroups, setProductGroups] = React.useState<any[]>([]);
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
  });
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null);
  const [editFormData, setEditFormData] = React.useState<EditFormData>({});

  console.log('Rendering ProductSelectionStep with updated Grid components');

  // Initialize ProductConsolidationService
  const [consolidationService] = React.useState(() => new ProductConsolidationService());

  // Add HSCodeHierarchyService initialization
  const [hsCodeService] = React.useState(() => {
    console.log('Initializing HSCodeHierarchyService');
    const hsCodeTariffService = new HSCodeTariffMCPService();
    const cacheService = new CacheService({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100
    });
    return new HSCodeHierarchyService(hsCodeTariffService, cacheService);
  });

  // Add a state to track service connectivity
  const [serviceStatus, setServiceStatus] = React.useState({
    operational: false,
    message: '',
    error: ''
  });

  // Remove mock data monitoring hooks
  // const { isMockDataActive, mockDataDetails } = useMockData();
  // useMockDataMonitor(); // Monitor console warnings for mock data usage

  // Add useEffect to check WITS API service status
  React.useEffect(() => {
    const checkWitsApiStatus = async () => {
      try {
        // Try to fetch a common HS code to check connectivity
        const testHsCode = '0101'; // Live horses
        console.log('Testing WITS API service connection with HS code:', testHsCode);
        
        const result = await hsCodeService.getHSCodeDetails(testHsCode);
        
        if (result) {
          console.log('WITS API service test successful');
          setServiceStatus({
            operational: true,
            message: 'WITS API service is operational',
            error: ''
          });
        } else {
          console.error('WITS API service test returned null result');
          setServiceStatus({
            operational: false,
            message: 'Unable to connect to WITS API service',
            error: 'Service returned null result'
          });
        }
      } catch (error) {
        console.error('Error checking WITS API service status:', error);
        setServiceStatus({
          operational: false,
          message: 'WITS API service is currently unavailable',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
    
    checkWitsApiStatus();
  }, [hsCodeService]);

  // Initialize products from business profile
  React.useEffect(() => {
    if (state.businessProfile?.products && state.businessProfile.products.length > 0) {
      // Map business profile products to format needed for consolidation
      const productsForConsolidation = state.businessProfile.products.map(product => ({
        id: `product-${Date.now()}-${Math.random()}`,
        name: product.name,
        description: product.description || '',
        selected: true,
        attributes: product.specifications || {}
      }));
      
      // Consolidate products into groups
      const consolidated = consolidationService.consolidateProducts(productsForConsolidation);
      console.log(`Consolidated ${productsForConsolidation.length} products into ${consolidated.length} groups`);
      setProductGroups(consolidated);
      
      // Map business profile products to Product interface
      const mappedProducts = state.businessProfile.products.map(product => ({
        id: `product-${Date.now()}-${Math.random()}`,
        name: product.name,
        description: product.description || '',
        category: product.category || 'Uncategorized',
        categoryId: '',  // Will be set by category suggestion
        subcategoryId: '', // Will be set by category suggestion
        specifications: product.specifications || {},
        selected: true
      }));

      // Get category suggestions for each product
      const productsWithCategories = mappedProducts.map(product => {
        const suggestions = suggestCategories(product.name, product.description);
        if (suggestions.length > 0) {
          const topSuggestion = suggestions[0];
          const category = productCategories.find(c => c.id === topSuggestion.categoryId);
          const subcategory = category?.subcategories.find(s => s.id === topSuggestion.subcategoryId);
          
          return {
            ...product,
            categoryId: topSuggestion.categoryId,
            subcategoryId: topSuggestion.subcategoryId,
            category: `${category?.name} - ${subcategory?.name}`,
            suggestedCategory: topSuggestion
          };
        }
        return product;
      });

      setProducts(productsWithCategories);
    }
  }, [state.businessProfile, consolidationService]);

  // Get available subcategories based on selected category
  const getAvailableSubcategories = (categoryId: string) => {
    const category = productCategories.find(c => c.id === categoryId);
    return category?.subcategories || [];
  };

  // Smart category suggestion based on product name and description
  const suggestCategories = (name: string, description: string = ''): CategorySuggestion[] => {
    const searchText = `${name} ${description}`.toLowerCase();
    const suggestions: CategorySuggestion[] = [];

    // Common variations of words to check
    const wordVariations: Record<string, string[]> = {
      'shoe': ['shoes', 'footwear', 'sneaker', 'boot', 'sandal'],
      'clothing': ['clothes', 'apparel', 'wear', 'dress', 'outfit'],
      'footwear': ['shoe', 'shoes', 'boots', 'sneakers', 'sandals']
    };

    productCategories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        let confidence = 0;
        const searchWords = searchText.split(/\s+/);
        
        // Check against examples with word variations
        subcategory.examples.forEach(example => {
          const exampleLower = example.toLowerCase();
          if (searchText.includes(exampleLower)) {
            confidence = Math.max(confidence, 0.9);
          }
          
          // Check each word in the search text
          searchWords.forEach(word => {
            // Check if this word has known variations
            const variations = Object.entries(wordVariations)
              .find(([key, values]) => values.includes(word) || key === word);
            
            if (variations) {
              // If the example matches any variation of the word
              if (variations[1].some(v => exampleLower.includes(v))) {
                confidence = Math.max(confidence, 0.85);
              }
            }
          });
        });

        // Check against description
        if (searchText.includes(subcategory.description.toLowerCase())) {
          confidence = Math.max(confidence, 0.8);
        }

        // Check against category name
        if (searchText.includes(category.name.toLowerCase())) {
          confidence = Math.max(confidence, 0.7);
        }

        // Check for word variations in category and subcategory names
        searchWords.forEach(word => {
          const variations = Object.entries(wordVariations)
            .find(([key, values]) => values.includes(word) || key === word);
          
          if (variations) {
            if (variations[1].some(v => category.name.toLowerCase().includes(v)) ||
                variations[1].some(v => subcategory.name.toLowerCase().includes(v))) {
              confidence = Math.max(confidence, 0.75);
            }
          }
        });

        if (confidence > 0) {
          suggestions.push({
            categoryId: category.id,
            subcategoryId: subcategory.id,
            confidence
          });
        }
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  // Handle product name/description change
  const handleProductDetailsChange = (field: string, value: string) => {
    setNewProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      // If name or description changes, suggest categories
      if (field === 'name' || field === 'description') {
        const suggestions = suggestCategories(
          updated.name || '', 
          updated.description || ''
        );
        
        if (suggestions.length > 0) {
          const topSuggestion = suggestions[0];
          return {
            ...updated,
            categoryId: topSuggestion.categoryId,
            subcategoryId: topSuggestion.subcategoryId,
            suggestedCategory: topSuggestion
          };
        }
      }
      
      return updated;
    });
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.categoryId || !newProduct.subcategoryId) return;

    const category = productCategories.find(c => c.id === newProduct.categoryId);
    const subcategory = category?.subcategories.find(s => s.id === newProduct.subcategoryId);

    const product: Product = {
      id: `product-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || '',
      category: `${category?.name} - ${subcategory?.name}`,
      categoryId: newProduct.categoryId,
      subcategoryId: newProduct.subcategoryId,
      specifications: {
        hsCode: subcategory?.hsCode || ''
      },
      selected: true,
      suggestedCategory: newProduct.suggestedCategory
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', description: '', categoryId: '', subcategoryId: '' });
  };

  const handleToggleProduct = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, selected: !product.selected } : product
    ));
  };

  // Handle toggling selection of a product variant within a group
  const handleToggleProductVariant = (groupBaseType: string, variantId: string) => {
    setProductGroups(productGroups.map(group => {
      if (group.baseType === groupBaseType) {
        return {
          ...group,
          variants: group.variants.map((variant: ProductVariant) => 
            variant.id === variantId ? { ...variant, selected: !variant.selected } : variant
          )
        };
      }
      return group;
    }));
  };

  const handleNext = () => {
    // When using consolidated products, we need to convert them back to the flat format
    // that the assessment context expects
    if (productGroups.length > 0) {
      // Extract selected products from all groups
      const selectedProducts: Product[] = [];
      
      productGroups.forEach(group => {
        const selectedVariants = group.variants.filter((v: ProductVariant) => v.selected !== false);
        
        selectedVariants.forEach((variant: ProductVariant) => {
          // Find the original product in the products array
          const originalProduct = products.find(p => p.name === variant.name);
          
          if (originalProduct) {
            // Use the original product but update with group attributes
            selectedProducts.push({
              ...originalProduct,
              specifications: {
                ...originalProduct.specifications,
                hsCode: group.attributes.hsCode || originalProduct.specifications?.hsCode,
                hsCodeDescription: group.attributes.hsCodeDescription || originalProduct.specifications?.hsCodeDescription
              }
            });
          }
        });
      });
      
      if (selectedProducts.length === 0) return;
      dispatch({ type: 'SET_SELECTED_PRODUCTS', payload: selectedProducts });
    } else {
      // Fallback to original implementation
      const selectedProducts = products.filter(p => p.selected);
      if (selectedProducts.length === 0) return;
      dispatch({ type: 'SET_SELECTED_PRODUCTS', payload: selectedProducts });
    }
    
    dispatch({ type: 'SET_STEP', payload: 3 }); // Move to next step
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 }); // Move back to previous step
  };

  const handleEditProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    
    // If no product found in the flat list, try to find it in the product groups
    let foundProduct = product;
    let foundGroup = null;
    
    if (!foundProduct && productGroups.length > 0) {
      // Search through the product groups to find the variant
      for (const group of productGroups) {
        const variant = group.variants.find((v: ProductVariant) => v.id === productId);
        if (variant) {
          foundProduct = {
            id: variant.id || `product-${Date.now()}-${Math.random()}`,
            name: variant.name,
            description: variant.description || '',
            category: group.baseType,
            categoryId: '', // Will be populated by suggestions
            subcategoryId: '', // Will be populated by suggestions
            specifications: {
              ...variant.attributes,
              hsCode: group.attributes.hsCode || '',
              hsCodeDescription: group.attributes.hsCodeDescription || ''
            },
            selected: variant.selected
          };
          foundGroup = group;
          break;
        }
      }
    }
    
    if (!foundProduct) {
      console.error(`Product not found with ID: ${productId}`);
      return;
    }
    
    console.log(`Editing product: ${foundProduct.name}`);
    
    setEditingProduct(productId);
    
    // Prepare the form data with existing values
    const formData = {
      name: foundProduct.name,
      description: foundProduct.description,
      categoryId: foundProduct.categoryId,
      subcategoryId: foundProduct.subcategoryId,
      hsCode: foundProduct.specifications?.hsCode || '',
      hsCodeDescription: foundProduct.specifications?.hsCodeDescription || '',
      group: foundGroup
    };
    
    // If the product has an HS code but no description, try to fetch the description
    if (formData.hsCode && !formData.hsCodeDescription) {
      try {
        console.log(`Fetching HS code details for code: ${formData.hsCode}`);
        const hsCodeDetails = await hsCodeService.getHSCodeDetails(formData.hsCode);
        
        if (hsCodeDetails) {
          console.log(`Found HS code details: ${hsCodeDetails.description}`);
          formData.hsCodeDescription = hsCodeDetails.description;
        }
      } catch (error) {
        console.error(`Error fetching HS code details: ${error}`);
      }
    }
    
    setEditFormData(formData);
  };

  // Handle HS code selection from HSCodeNavigator
  const handleHsCodeSelected = (selection: HSCodeSelection, step: ClassificationStep) => {
    if (step === ClassificationStep.Complete && selection.subheading) {
      // Update the form data with the selected HS code
      setEditFormData(prev => ({
        ...prev,
        hsCode: selection.subheading?.code,
        hsCodeDescription: selection.subheading?.description
      }));
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // If name or description changes, suggest categories
      if (field === 'name' || field === 'description') {
        const suggestions = suggestCategories(
          updated.name || '', 
          updated.description || ''
        );
        
        if (suggestions.length > 0) {
          const topSuggestion = suggestions[0];
          return {
            ...updated,
            categoryId: topSuggestion.categoryId,
            subcategoryId: topSuggestion.subcategoryId,
            suggestedCategory: topSuggestion
          };
        }
      }
      
      return updated;
    });
  };

  // Handle Edit Product Save with improved HS code handling
  const handleSaveEdit = () => {
    if (!editingProduct || !editFormData.name || !editFormData.categoryId || !editFormData.subcategoryId) return;

    console.log(`Saving edited product with HS code: ${editFormData.hsCode}`);
    
    const category = productCategories.find(c => c.id === editFormData.categoryId);
    const subcategory = category?.subcategories.find(s => s.id === editFormData.subcategoryId);

    if (!category || !subcategory) return;

    // If the product has an HS code but no description, try one more time to get it
    const getUpdatedProduct = async () => {
      let hsCodeDescription = editFormData.hsCodeDescription || '';
      
      if (editFormData.hsCode && !hsCodeDescription) {
        try {
          console.log(`Fetching description for HS code ${editFormData.hsCode} before saving`);
          const hsCodeDetails = await hsCodeService.getHSCodeDetails(editFormData.hsCode);
          
          if (hsCodeDetails) {
            console.log(`Found HS code details before saving: ${hsCodeDetails.description}`);
            hsCodeDescription = hsCodeDetails.description;
          } else {
            console.warn(`No description found for HS code ${editFormData.hsCode}`);
          }
        } catch (error) {
          console.error(`Error fetching HS code details before saving: ${error}`);
          // Don't proceed without valid HS code data
          alert(`Error: Failed to validate HS code ${editFormData.hsCode}: ${error instanceof Error ? error.message : String(error)}`);
          return;
        }
      }
      
      // First update the individual product in the products array
      setProducts(products.map(product => 
        product.id === editingProduct ? {
          ...product,
          name: editFormData.name,
          description: editFormData.description || '',
          category: `${category.name} - ${subcategory.name}`,
          categoryId: editFormData.categoryId,
          subcategoryId: editFormData.subcategoryId,
          specifications: {
            ...product.specifications,
            hsCode: editFormData.hsCode || '',
            hsCodeDescription: hsCodeDescription || ''
          }
        } as Product : product
      ));
      
      // If this product belongs to a group, update the group's attributes as well
      if (editFormData.group) {
        setProductGroups(productGroups.map(group => {
          if (group === editFormData.group) {
            return {
              ...group,
              attributes: {
                ...group.attributes,
                hsCode: editFormData.hsCode || '',
                hsCodeDescription: hsCodeDescription || ''
              }
            };
          }
          return group;
        }));
      }

      // Clear editing state
      setEditingProduct(null);
      setEditFormData({});
    };
    
    getUpdatedProduct();
  };

  // Edit Product Dialog
  const renderEditDialog = () => {
    if (!editingProduct) return null;
    
    const category = productCategories.find(c => c.id === editFormData.categoryId);
    const subcategories = category?.subcategories || [];
    
    return (
      <Dialog 
        open={!!editingProduct} 
        onClose={() => setEditingProduct(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Product Details
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            {/* Add WITS API service status indicator */}
            {!serviceStatus.operational && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serviceStatus.message}: {serviceStatus.error}
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  HS code classification features are unavailable until this issue is resolved.
                </Typography>
              </Alert>
            )}

            <GridContainer>
              <GridItem size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Product Name"
                  fullWidth
                  value={editFormData.name || ''}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  required
                  variant="outlined"
                />
              </GridItem>
              <GridItem size={{ xs: 12, sm: 6 }}>
                {category && (
                  <TextField
                    select
                    label="Product Subcategory"
                    fullWidth
                    value={editFormData.subcategoryId || ''}
                    onChange={(e) => handleEditFormChange('subcategoryId', e.target.value)}
                    required
                    variant="outlined"
                  >
                    {subcategories.map((subcategory: ProductSubcategory) => (
                      <MenuItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </GridItem>
              <GridItem size={{ xs: 12 }}>
                <TextField
                  label="Product Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={editFormData.description || ''}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  variant="outlined"
                />
              </GridItem>
              <GridItem size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Product Classification
                </Typography>
                
                {/* Only render HS code selection when service is operational */}
                {serviceStatus.operational ? (
                  editFormData.hsCode ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Current HS Code
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={editFormData.hsCode} 
                          color="primary" 
                          sx={{ mr: 1 }}
                        />
                        <Typography>
                          {editFormData.hsCodeDescription || 'No description available'}
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => {
                          // Reset HS code to trigger selection view
                          setEditFormData({
                            ...editFormData,
                            hsCode: '',
                            hsCodeDescription: ''
                          });
                        }}
                      >
                        Change HS Code
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Select the appropriate HS code for this product to determine applicable tariffs and regulations.
                      </Typography>
                      <FocusAreaHSCodeSelector
                        productName={editFormData.name || ''}
                        onUpdateSelection={(selection, step) => {
                          if (step === ClassificationStep.Complete && selection.subheading) {
                            setEditFormData(prev => ({
                              ...prev,
                              hsCode: selection.subheading?.code,
                              hsCodeDescription: selection.subheading?.description
                            }));
                          }
                        }}
                      />
                    </>
                  )
                ) : (
                  <Typography color="error" sx={{ my: 2 }}>
                    HS Code classification is unavailable due to API connection issues.
                    Please try again later or proceed without classification.
                  </Typography>
                )}
              </GridItem>
            </GridContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProduct(null)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained" 
            color="primary"
            disabled={!editFormData.name || !editFormData.categoryId || !editFormData.subcategoryId}
          >
            Save Product
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render the product cards with a better side-by-side layout
  const renderProductCards = () => {
    // Check if we have consolidated product groups
    if (productGroups.length > 0) {
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Please classify your products by selecting the appropriate HS code for each product group.
            This will help determine applicable regulations and tariffs for your export markets.
          </Typography>

          {productGroups.map(group => (
            <Paper 
              key={group.baseType} 
              sx={{ 
                mb: 3, 
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left side - Product information */}
                <Box 
                  sx={{ 
                    p: 3, 
                    width: { xs: '100%', md: '40%' },
                    borderRight: { xs: 'none', md: '1px solid' },
                    borderBottom: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="medium">
                      {group.baseType}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {group.description || 'Product Group'}
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Variants ({group.variants.length})
                    </Typography>
                    
                    {group.variants.map((variant: ProductVariant) => (
                      <Box 
                        key={variant.id} 
                        sx={{ 
                          pl: 2, 
                          borderLeft: '2px solid',
                          borderLeftColor: 'primary.light',
                          mt: 1
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={variant.selected !== false}
                              onChange={() => handleToggleProductVariant(group.baseType, variant.id || '')}
                              color="primary"
                              size="small"
                            />
                          }
                          label={variant.name}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                {/* Right side - HS Code classification */}
                <Box 
                  sx={{ 
                    p: 3, 
                    width: { xs: '100%', md: '60%' },
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      HS Code Classification
                    </Typography>
                  </Box>
                  
                  {/* Directly embed the classification component here */}
                  <Box>
                    <FocusAreaHSCodeSelector
                      productName={group.baseType}
                      initialSelection={group.attributes?.hsCode ? {
                        chapter: { code: group.attributes.hsCode.slice(0, 2), description: '' },
                        heading: { code: group.attributes.hsCode.slice(0, 4), description: '' },
                        subheading: { 
                          code: group.attributes.hsCode, 
                          description: group.attributes.hsCodeDescription || '' 
                        }
                      } : undefined}
                      onUpdateSelection={(selection, step) => {
                        if (step === ClassificationStep.Complete && selection.subheading) {
                          // Update the group's HS code
                          const updatedGroups = [...productGroups];
                          const groupIndex = updatedGroups.findIndex(g => g.baseType === group.baseType);
                          
                          if (groupIndex >= 0) {
                            if (!updatedGroups[groupIndex].attributes) {
                              updatedGroups[groupIndex].attributes = {};
                            }
                            
                            updatedGroups[groupIndex].attributes.hsCode = selection.subheading.code;
                            updatedGroups[groupIndex].attributes.hsCodeDescription = selection.subheading.description;
                            
                            setProductGroups(updatedGroups);
                            
                            // Also update individual variants
                            updatedGroups[groupIndex].variants.forEach((variant: ProductVariant) => {
                              if (!variant.attributes) {
                                variant.attributes = {};
                              }
                              if (selection.subheading) {
                                variant.attributes.hsCode = selection.subheading.code;
                                variant.attributes.hsCodeDescription = selection.subheading.description;
                              }
                            });
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      );
    }
    
    // Fallback to the original product list if consolidation hasn't happened
    return (
      <GridContainer>
        {products.map(product => (
          <GridItem size={{ xs: 12, md: 6 }} key={product.id}>
            <ProductCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <div>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="#718096">
                      {product.category}
                    </Typography>
                    {product.specifications?.hsCode && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                        <Typography variant="body2" color="#3182ce" fontWeight="medium">
                          HS Code: {product.specifications.hsCode}
                          <Chip
                            label="Classified"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                          />
                        </Typography>
                        {product.specifications.hsCodeDescription && (
                          <Typography variant="body2" color="#4a5568" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                            {product.specifications.hsCodeDescription}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </div>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditProduct(product.id)}
                  >
                    Edit
                  </Button>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={product.selected}
                      onChange={() => handleToggleProduct(product.id)}
                      color="primary"
                    />
                  }
                  label="Include in export assessment"
                />
              </CardContent>
            </ProductCard>
          </GridItem>
        ))}

        {products.length === 0 && (
          <GridItem size={{ xs: 12 }}>
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 2 }}>
              <Typography variant="h6" color="error" gutterBottom>
                No Products Added Yet
              </Typography>
              <Typography variant="body1">
                Add your first product using the form below.
              </Typography>
            </Box>
          </GridItem>
        )}
      </GridContainer>
    );
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Display mock data banner if active */}
        {/* {isMockDataActive && (
          <MockDataBanner 
            message={
              mockDataDetails.hsCode && mockDataDetails.witsApi 
                ? "Using simulated HS code and WITS API data for development. API keys not configured."
                : mockDataDetails.hsCode 
                  ? "Using simulated HS code data for development. HS Code API key not configured."
                  : "Using simulated WITS API data for development. WITS API key not configured."
            }
          />
        )} */}
        
        <StyledPaper elevation={0}>
          <Typography variant="h4" component="h2" color="secondary.main" sx={{ mb: 2 }}>
            Product Selection
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Select the products you're interested in exporting. We've identified these products from your website.
          </Typography>
          
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}>
            <Typography variant="h6" color="#2d3748" sx={{ mr: 2 }}>
              Selected Products
            </Typography>
            <Alert severity="info" sx={{ ml: 2, flex: 1 }}>
              Clear product identification is crucial for your export journey as it affects tariffs, certifications, and market access requirements.
            </Alert>
          </Box>
          
          {/* Display service status alert if MCP services are down */}
          {!serviceStatus.operational && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {serviceStatus.message}
            </Alert>
          )}
          
          {renderProductCards()}
          
          <AddProductSection>
            <Typography variant="h6" color="#4a5568" sx={{ mb: 3 }}>
              Add New Product
            </Typography>
            
            <GridContainer>
              <GridItem size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Product Name *
                </Typography>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={newProduct.name}
                  onChange={(e) => handleProductDetailsChange('name', e.target.value)}
                />
              </GridItem>
              
              <GridItem size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Category *
                </Typography>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  select
                  value={newProduct.categoryId}
                  onChange={(e) => handleProductDetailsChange('categoryId', e.target.value)}
                >
                  {productCategories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </GridItem>

              {newProduct.categoryId && (
                <GridItem size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Subcategory *
                  </Typography>
                  <TextField 
                    fullWidth
                    variant="outlined"
                    size="small"
                    select
                    value={newProduct.subcategoryId}
                    onChange={(e) => handleProductDetailsChange('subcategoryId', e.target.value)}
                  >
                    {getAvailableSubcategories(newProduct.categoryId).map(subcategory => (
                      <MenuItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                        {subcategory.examples.length > 0 && (
                          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                            (e.g., {subcategory.examples.join(', ')})
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </TextField>
                </GridItem>
              )}
              
              <GridItem size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Product Description
                </Typography>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => handleProductDetailsChange('description', e.target.value)}
                />
              </GridItem>

              {newProduct.suggestedCategory && (
                <GridItem size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Based on your product details, we suggest:
                    <Chip 
                      label={`${productCategories.find(c => c.id === newProduct.suggestedCategory?.categoryId)?.name} - 
                             ${getAvailableSubcategories(newProduct.suggestedCategory?.categoryId)
                               .find(s => s.id === newProduct.suggestedCategory?.subcategoryId)?.name}`}
                      sx={{ ml: 1 }}
                    />
                  </Alert>
                </GridItem>
              )}
              
              <GridItem size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    disabled={!newProduct.name || !newProduct.categoryId || !newProduct.subcategoryId}
                  >
                    Add Product
                  </Button>
                </Box>
              </GridItem>
            </GridContainer>
          </AddProductSection>

          <InfoBox tooltipText="Choosing the right products is crucial for export success">
            <Typography variant="body1" paragraph>
              Carefully selecting and classifying your products helps identify applicable tariffs and regulatory requirements.
              For each product group:
            </Typography>
            <ol>
              <li>Verify that the product details are correct</li>
              <li>Click "Classify Now" to assign the correct HS code</li>
              <li>Select which product variants to include in your assessment</li>
            </ol>
            <Typography variant="body1">
              Each product group needs an HS code before proceeding to the next step.
            </Typography>
          </InfoBox>
        </StyledPaper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 6 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ 
              borderColor: 'primary.main', 
              color: 'primary.main',
              borderRadius: 20,
              px: 4
            }}
          >
            Back to Business Profile
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={products.filter(p => p.selected).length === 0}
            sx={{ 
              backgroundColor: 'primary.main', 
              borderRadius: 20,
              px: 4
            }}
          >
            Continue to Production Capacity
          </Button>
        </Box>
      </motion.div>

      {/* Add Edit Dialog */}
      {renderEditDialog()}
    </Container>
  );
} 