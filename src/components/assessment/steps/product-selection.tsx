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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { InfoBox } from '@/components/ui/InfoBox';
import { GridContainer, GridItem } from '@/components/ui/GridWrapper';

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
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
  });
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null);
  const [editFormData, setEditFormData] = React.useState<Partial<Product>>({});

  // Initialize products from business profile
  React.useEffect(() => {
    if (state.businessProfile?.products && state.businessProfile.products.length > 0) {
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
  }, [state.businessProfile]);

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

  const handleNext = () => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) return;

    dispatch({ type: 'SET_SELECTED_PRODUCTS', payload: selectedProducts });
    dispatch({ type: 'SET_STEP', payload: 3 }); // Move to next step
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 }); // Move back to previous step
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditFormData({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
      });
      setEditingProduct(productId);
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

  const handleSaveEdit = () => {
    if (!editingProduct || !editFormData.name || !editFormData.categoryId || !editFormData.subcategoryId) return;

    const category = productCategories.find(c => c.id === editFormData.categoryId);
    const subcategory = category?.subcategories.find(s => s.id === editFormData.subcategoryId);

    if (!category || !subcategory) return;

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
          hsCode: subcategory.hsCode || ''
        }
      } as Product : product
    ));

    setEditingProduct(null);
    setEditFormData({});
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={FADE_IN_ANIMATION}
      >
        <StyledPaper>
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
          
          <GridContainer spacing={3} sx={{ mb: 4 }}>
            {products.map(product => (
              <GridItem key={product.id} xs={12} md={6}>
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
                          <Typography variant="body2" color="#718096">
                            HS Code: {product.specifications.hsCode}
                          </Typography>
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
              <GridItem xs={12}>
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 2 }}>
                  <Typography variant="h6" color="error" gutterBottom>
                    No Valid Products Found
                  </Typography>
                  <Typography variant="body1" color="#C62828">
                    We couldn't find any valid products for export from the provided website. This could be because:
                    1. The products didn't meet our validation criteria
                    2. The products were marked as invalid during verification
                    3. The website structure made it difficult to extract product information
                    
                    Please add your products manually using the form below, or go back and try a different website URL.
                  </Typography>
                </Box>
              </GridItem>
            )}
          </GridContainer>
          
          <AddProductSection>
            <Typography variant="h6" color="#4a5568" sx={{ mb: 3 }}>
              Add New Product
            </Typography>
            
            <GridContainer spacing={3}>
              <GridItem xs={12} md={6}>
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
              
              <GridItem xs={12} md={6}>
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
                <GridItem xs={12} md={6}>
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
              
              <GridItem xs={12}>
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
                <GridItem xs={12}>
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
              
              <GridItem xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  disabled={!newProduct.name || !newProduct.categoryId || !newProduct.subcategoryId}
                >
                  Add Product
                </Button>
              </GridItem>
            </GridContainer>
          </AddProductSection>

          <InfoBox tooltipText="Choosing the right products is crucial for export success">
            Carefully selecting and documenting your products helps us identify their unique selling
            points and potential in international markets. This information will be crucial for
            developing your export strategy and meeting international standards.
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

      {/* Edit Product Dialog */}
      <Dialog 
        open={!!editingProduct} 
        onClose={() => setEditingProduct(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <GridContainer spacing={3}>
              <GridItem xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Product Name *
                </Typography>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={editFormData.name || ''}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Category *
                </Typography>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  select
                  value={editFormData.categoryId || ''}
                  onChange={(e) => handleEditFormChange('categoryId', e.target.value)}
                >
                  {productCategories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </GridItem>

              {editFormData.categoryId && (
                <GridItem xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Subcategory *
                  </Typography>
                  <TextField 
                    fullWidth
                    variant="outlined"
                    size="small"
                    select
                    value={editFormData.subcategoryId || ''}
                    onChange={(e) => handleEditFormChange('subcategoryId', e.target.value)}
                  >
                    {getAvailableSubcategories(editFormData.categoryId).map(subcategory => (
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
              
              <GridItem xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Product Description
                </Typography>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  value={editFormData.description || ''}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                />
              </GridItem>

              {editFormData.suggestedCategory && (
                <GridItem xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Based on your product details, we suggest:
                    <Chip 
                      label={`${productCategories.find(c => c.id === editFormData.suggestedCategory?.categoryId)?.name} - 
                             ${getAvailableSubcategories(editFormData.suggestedCategory?.categoryId)
                               .find(s => s.id === editFormData.suggestedCategory?.subcategoryId)?.name}`}
                      sx={{ ml: 1 }}
                    />
                  </Alert>
                </GridItem>
              )}
            </GridContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProduct(null)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit}
            disabled={!editFormData.name || !editFormData.categoryId || !editFormData.subcategoryId}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 