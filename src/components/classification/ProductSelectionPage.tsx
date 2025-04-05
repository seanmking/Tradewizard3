import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ProductCard from './ProductCard';
import { ProductGroup } from './types/product.interface';
import { HSCodeSelection, ClassificationStep } from './types/classification.interface';
import { HsCodeMCPService } from '../../mcp/global/hs-code-mcp';

// Mock data for testing
const mockProducts: ProductGroup[] = [
  {
    id: '1',
    name: 'Premium Red Wine',
    description: 'South African Cabernet Sauvignon, 750ml bottle',
    variants: [
      { id: '1-1', name: 'Red Wine - 750ml', selected: true },
      { id: '1-2', name: 'Red Wine - 1.5L', selected: false }
    ],
    isSelected: false,
    classificationStep: ClassificationStep.Unstarted
  },
  {
    id: '2',
    name: 'Corn Dogs - Original',
    description: 'Breaded corn dogs made with premium ingredients',
    variants: [
      { id: '2-1', name: 'Original - 8 pack', selected: true },
      { id: '2-2', name: 'Spicy - 8 pack', selected: false }
    ],
    isSelected: false,
    classificationStep: ClassificationStep.Unstarted
  },
  {
    id: '3',
    name: 'Organic Green Tea',
    description: 'Premium loose leaf green tea from Japan',
    variants: [
      { id: '3-1', name: 'Loose Leaf - 100g', selected: true },
      { id: '3-2', name: 'Tea Bags - 24 count', selected: false }
    ],
    isSelected: false,
    classificationStep: ClassificationStep.Unstarted
  }
];

const ProductSelectionPage: React.FC = () => {
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  
  // Initialize HS code service for product classification
  const hsCodeService = new HsCodeMCPService();
  
  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      
      try {
        // Simulate API call to fetch products
        await new Promise(resolve => setTimeout(resolve, 800));
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Check if all selected products have been classified
  useEffect(() => {
    const selectedProducts = products.filter(p => p.isSelected);
    const allClassified = selectedProducts.length > 0 && 
      selectedProducts.every(p => p.classificationStep === ClassificationStep.Complete);
    
    setCanProceed(allClassified);
  }, [products]);
  
  const handleProductSelect = (productId: string, selected: boolean) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId ? { ...product, isSelected: selected } : product
      )
    );
  };
  
  const handleUpdateClassification = (
    productId: string, 
    selection: HSCodeSelection, 
    step: ClassificationStep
  ) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, hsCodeSelection: selection, classificationStep: step } 
          : product
      )
    );
  };
  
  const handleContinue = () => {
    // Navigate to next page
    console.log('Continuing with products:', products.filter(p => p.isSelected));
    alert('Continuing to next step with selected products');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Select Products for Export
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          We've detected these products from your website. Select the ones you plan to export.
        </Typography>
      </Box>
      
      {products.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography>No products found. Add some products to get started.</Typography>
        </Paper>
      ) : (
        <>
          <Alert 
            severity="info" 
            icon={<InfoOutlinedIcon />}
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Products need an HS Code for customs clearance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select each product and assign an HS code to help determine applicable tariffs and regulations.
            </Typography>
          </Alert>
          
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onProductSelect={handleProductSelect}
              onUpdateClassification={handleUpdateClassification}
            />
          ))}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {products.filter(p => p.isSelected).length} products selected
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={!canProceed}
              endIcon={<ArrowForwardIcon />}
              onClick={handleContinue}
              sx={{ 
                fontWeight: 500,
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              Continue
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default ProductSelectionPage; 