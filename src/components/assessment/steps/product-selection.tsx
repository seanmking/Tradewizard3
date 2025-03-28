'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FADE_IN_ANIMATION } from '@/lib/animation';
import { useAssessment } from '@/contexts/assessment-context';
import type { Product } from '@/contexts/assessment-context';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { InfoBox } from '@/components/ui/InfoBox';
import { SarahBox } from '@/components/sarah/SarahBox';
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

const productCategories = [
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Textiles', label: 'Textiles' },
  { value: 'Other', label: 'Other' }
];

export function ProductSelectionStep() {
  const { state, dispatch } = useAssessment();
  const [products, setProducts] = React.useState<Product[]>(
    state.selectedProducts.map(p => ({ ...p, selected: true })) || []
  );
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
  });

  // Initialize with products from business profile if available
  React.useEffect(() => {
    const profileProducts = state.businessProfile?.products;
    
    // If we have products from the business profile and our local state is empty
    if (profileProducts && profileProducts.length > 0 && products.length === 0) {
      // Create new products with generated IDs
      const extractedProducts: any[] = profileProducts.map(p => {
        return {
          id: `product-${Math.random().toString(36).substr(2, 9)}`,
          name: p.name,
          description: p.description || '',
          category: p.category || 'Uncategorized',
          specifications: p.specifications || {},
          selected: true
        };
      });
      
      setProducts(extractedProducts);
    } 
    // Do not create fallback products, let the UI show the "No products found" message
  }, [state.businessProfile, products.length]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) return;

    const product: any = {
      id: `product-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || '',
      category: newProduct.category,
      specifications: {},
      selected: true
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', description: '', category: '' });
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
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="#718096">
                      {product.category}
                    </Typography>
                    <Typography variant="body2" color="#718096" sx={{ mb: 2 }}>
                      HS Code: {product.specifications?.hsCode || 'Not available'}
                    </Typography>
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
                    Website Analysis Error
                  </Typography>
                  <Typography variant="body1" color="#C62828">
                    We couldn't extract product information from the provided website. 
                    Please add your products manually using the form below or go back and try a different website URL.
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
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
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
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  {productCategories.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </GridItem>
              
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
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </GridItem>
              
              <GridItem xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  disabled={!newProduct.name || !newProduct.category}
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
    </Container>
  );
} 