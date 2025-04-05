'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  ButtonGroup,
  Fab,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ProductGroupList, ProductEditDialog } from '../components/ProductAssessment';
import { ProductConsolidationService } from '../services/product/productConsolidation.service';
import { HSChapterMappingService, MappingResult } from '../services/hs-code/hsChapterMapping.service';
import {
  setConsolidatedGroups,
  setHSClassifications,
  setLoading,
  setError,
  selectAllGroups,
  deselectAllGroups,
} from '../store/productAssessment/productAssessmentSlice';
import type { RootState } from '../store/types';

const consolidationService = new ProductConsolidationService();
const hsChapterService = new HSChapterMappingService();

export const ExportReadinessAssessment: React.FC = () => {
  const dispatch = useDispatch();
  const {
    consolidatedGroups,
    hsClassifications,
    selectedGroups,
    loading,
    error
  } = useSelector((state: RootState) => state.productAssessment);
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  
  useEffect(() => {
    const processProducts = async () => {
      try {
        dispatch(setLoading(true));

        // In a real application, fetch this data from your API
        const rawProducts = [
          { id: '1', name: 'Melty Adventure Corn Dogs', category: 'Snacks', description: 'Delicious corn dogs with melty cheese inside' },
          { id: '2', name: 'Awesome Original Corn Dogs', category: 'Snacks', description: 'Classic corn dogs with a crispy coating' },
          { id: '3', name: 'Jalapeno Cheese Corn Dogs', category: 'Snacks', description: 'Spicy corn dogs with jalapeno cheese filling' },
          { id: '4', name: 'Creamy Cheese Corn Dogs', category: 'Snacks', description: 'Corn dogs with creamy cheese filling' },
          { id: '5', name: 'Boerie Corn Dogs', category: 'Snacks', description: 'South African style corn dogs with boerewors filling' },
          { id: '6', name: 'Cheesy BBQ Chicken Snack Pockets', category: 'Snacks', description: 'Chicken and cheese filled pockets with BBQ flavor' },
          { id: '7', name: 'Cheeseburger Snack Pockets', category: 'Snacks', description: 'Beef and cheese filled pockets with burger flavor' },
          { id: '8', name: 'Spicy Beef Snack Pockets', category: 'Snacks', description: 'Spicy beef filled pockets with Mexican-inspired spices' },
          { id: '9', name: 'Veggie Cheese Snack Pockets', category: 'Snacks', description: 'Vegetable and cheese filled snack pockets' },
          { id: '10', name: 'Cheddar Cheese Bites', category: 'Snacks', description: 'Bite-sized snacks filled with cheddar cheese' },
          { id: '11', name: 'Mozzarella Sticks', category: 'Snacks', description: 'Breaded mozzarella cheese sticks' },
        ];

        console.log("Raw products:", rawProducts.length);
        
        // Consolidate products into groups
        const groups = consolidationService.consolidateProducts(rawProducts);
        console.log("Consolidated groups:", groups.length);
        dispatch(setConsolidatedGroups(groups));

        // Map groups to HS chapters
        const classifications: Record<string, MappingResult> = {};
        for (const group of groups) {
          classifications[group.baseType] = hsChapterService.mapToChapter(group);
        }
        dispatch(setHSClassifications(classifications));

        // Select all products by default
        dispatch(selectAllGroups());

      } catch (err) {
        console.error("Error in processProducts:", err);
        dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    processProducts();
  }, [dispatch]);
  
  const handleEditProduct = (product: any) => {
    setCurrentProduct(product);
    setEditDialogOpen(true);
  };
  
  const handleAddProduct = () => {
    setCurrentProduct(null);
    setEditDialogOpen(true);
  };
  
  const handleSaveProduct = (formData: any) => {
    // In a real application, save the product data to your backend
    console.log('Saving product:', formData);
    
    // Close the dialog
    setEditDialogOpen(false);
    setCurrentProduct(null);
  };

  const handleSelectAll = () => {
    dispatch(selectAllGroups());
  };

  const handleDeselectAll = () => {
    dispatch(deselectAllGroups());
  };

  const handleContinue = () => {
    // In a real application, navigate to the next step
    console.log('Continue with selected products:', selectedGroups);
    alert(`Continuing with ${selectedGroups.length} selected products`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          Export Readiness Assessment
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete these steps to receive your personalized export readiness report
        </Typography>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h4" color="primary" gutterBottom>
            Product Selection
          </Typography>
          
          <Typography variant="body1" paragraph>
            Select the products you're interested in exporting. We've identified these products from your website.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Your Products
              </Typography>
              {consolidatedGroups.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {selectedGroups.length} of {consolidatedGroups.length} products selected
                </Typography>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={handleSelectAll}>Select All</Button>
                <Button onClick={handleDeselectAll}>Deselect All</Button>
              </ButtonGroup>
              
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </Box>
          </Box>
          
          <Alert 
            severity="info" 
            icon={<InfoOutlinedIcon />}
            sx={{ mb: 3 }}
          >
            Clear product identification is crucial for your export journey as it affects tariffs, certifications, and market access requirements.
          </Alert>

          {consolidatedGroups.length > 0 ? (
            <ProductGroupList
              groups={consolidatedGroups}
              classifications={hsClassifications}
              onEditProduct={handleEditProduct}
            />
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                No products have been added yet. Click "Add Product" to get started.
              </Typography>
            </Paper>
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleContinue}
            disabled={selectedGroups.length === 0}
          >
            Continue with Selected Products
          </Button>
        </Box>
        
        <ProductEditDialog 
          open={editDialogOpen}
          product={currentProduct}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveProduct}
        />
      </Box>
      
      {selectedGroups.length > 0 && (
        <Tooltip title="Continue with selected products">
          <Fab
            color="primary"
            aria-label="continue"
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
            }}
            onClick={handleContinue}
          >
            <ArrowForwardIcon />
          </Fab>
        </Tooltip>
      )}
    </Container>
  );
}; 