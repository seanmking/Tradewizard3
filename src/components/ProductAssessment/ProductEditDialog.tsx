'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Box,
  SelectChangeEvent,
  Stack,
  Chip,
  IconButton,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ProductGroup } from '../../services/product/productConsolidation.service';
import { HSCodeNavigator } from '../HSCode';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/types';

// Extended attributes interface to include HS code properties
interface ProductAttributes {
  mainIngredient?: string;
  preparationType?: string;
  packagingType?: string;
  hsCode?: string;
  hsCodeDescription?: string;
  [key: string]: any; // Allow for other attributes
}

// Extended ProductGroup to ensure type safety
interface ExtendedProductGroup extends Omit<ProductGroup, 'attributes'> {
  attributes: ProductAttributes;
}

// Read ProductGroup structure from the service
export interface ProductEditDialogProps {
  open: boolean;
  product: ProductGroup | null;
  onClose: () => void;
  onSave: (formData: any) => void;
}

/**
 * Dialog for editing product details with HS code classification
 */
export const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  open,
  product,
  onClose,
  onSave,
}) => {
  const hsClassifications = useSelector(
    (state: RootState) => state.productAssessment.hsClassifications
  );
  
  const [formData, setFormData] = useState({
    baseType: '',
    description: '',
    mainIngredient: '',
    preparationType: '',
    packagingType: '',
  });

  // Store calculated classification for the current form data
  const [classification, setClassification] = useState<any | null>(null);

  // Preparation types
  const preparationTypes = [
    'Fresh',
    'Frozen',
    'Cooked',
    'Breaded',
    'Smoked',
    'Fermented',
    'Dried',
    'Mixed',
  ];

  // Packaging types
  const packagingTypes = [
    'Box',
    'Bag',
    'Pouch',
    'Tray',
    'Vacuum Pack',
    'Jar',
    'Can',
    'Bottle',
  ];

  // Main ingredients
  const mainIngredients = [
    'Beef',
    'Chicken',
    'Pork',
    'Fish',
    'Cheese',
    'Corn',
    'Wheat',
    'Potato',
    'Vegetable',
    'Mixed',
  ];

  useEffect(() => {
    if (product) {
      setFormData({
        baseType: product.baseType || '',
        description: product.description || '',
        mainIngredient: product.attributes.mainIngredient || '',
        preparationType: product.attributes.preparationType || '',
        packagingType: product.attributes.packagingType || '',
      });
      
      // Set initial classification from the store
      setClassification(hsClassifications[product.baseType] || null);
    } else {
      // Reset form for new product
      setFormData({
        baseType: '',
        description: '',
        mainIngredient: '',
        preparationType: '',
        packagingType: '',
      });
      setClassification(null);
    }
  }, [product, hsClassifications]);

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (!formData.baseType.trim()) {
      return; // Don't submit if product type is empty
    }
    
    // Transform formData to match the ProductGroup structure
    const productData: ExtendedProductGroup = {
      baseType: formData.baseType,
      description: formData.description,
      attributes: {
        mainIngredient: formData.mainIngredient,
        preparationType: formData.preparationType,
        packagingType: formData.packagingType,
        ...(classification && { 
          hsCode: classification.code, 
          hsCodeDescription: classification.description 
        }),
      },
      variants: product?.variants || [],
    };
    
    onSave(productData);
  };

  // Handle HS code selection from the navigator
  const handleHsCodeSelected = (hsCode: string, description: string) => {
    setClassification({
      code: hsCode,
      description: description,
      confidence: 0.9,
    });
  };

  // Convert hsClassifications to the format expected by HSCodeNavigator
  const getSuggestedCodes = () => {
    if (!formData.baseType || !hsClassifications[formData.baseType]) {
      return [];
    }

    const classInfo = hsClassifications[formData.baseType];
    // Format for HSCodeNavigator
    return [{
      code: classInfo.chapter,
      description: classInfo.description,
      confidence: classInfo.confidence
    }];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h6">
          {product ? 'Edit Product Group' : 'Add New Product Group'}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {product && product.variants.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This product group contains {product.variants.length} variants. Editing will apply to all variants.
          </Alert>
        )}

        <Box>
          <Stack spacing={3}>
            <TextField
              name="baseType"
              label="Product Type"
              value={formData.baseType}
              onChange={handleTextFieldChange}
              fullWidth
              required
              variant="outlined"
              helperText="The main category name for this product group"
            />
            
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleTextFieldChange}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              helperText="A general description that applies to all variants"
            />
            
            <Divider sx={{ my: 1 }}>
              <Chip label="Product Attributes" />
            </Divider>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="main-ingredient-label">Main Ingredient</InputLabel>
                <Select
                  labelId="main-ingredient-label"
                  name="mainIngredient"
                  value={formData.mainIngredient}
                  onChange={handleSelectChange}
                  label="Main Ingredient"
                >
                  <MenuItem value="">None</MenuItem>
                  {mainIngredients.map(ingredient => (
                    <MenuItem key={ingredient} value={ingredient}>{ingredient}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="preparation-type-label">Preparation Type</InputLabel>
                <Select
                  labelId="preparation-type-label"
                  name="preparationType"
                  value={formData.preparationType}
                  onChange={handleSelectChange}
                  label="Preparation Type"
                >
                  <MenuItem value="">None</MenuItem>
                  {preparationTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel id="packaging-type-label">Packaging Type</InputLabel>
                <Select
                  labelId="packaging-type-label"
                  name="packagingType"
                  value={formData.packagingType}
                  onChange={handleSelectChange}
                  label="Packaging Type"
                >
                  <MenuItem value="">None</MenuItem>
                  {packagingTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Divider sx={{ my: 1 }}>
              <Chip label="HS Classification" />
            </Divider>
            
            <HSCodeNavigator
              productName={formData.baseType}
              productCategory={formData.mainIngredient || ''}
              initialHsCode={product?.attributes?.hsCode || ''}
              onHsCodeSelected={handleHsCodeSelected}
              suggestedCodes={getSuggestedCodes()}
            />

            {product && product.variants.length > 0 && (
              <>
                <Divider sx={{ my: 1 }}>
                  <Chip label="Product Variants" />
                </Divider>
                
                <Box 
                  sx={{ 
                    maxHeight: '200px', 
                    overflow: 'auto', 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    bgcolor: 'background.default'
                  }}
                >
                  {product.variants.map((variant, index) => (
                    <Box 
                      key={variant.id || index} 
                      sx={{ 
                        p: 1.5, 
                        borderBottom: index < product.variants.length - 1 ? '1px solid' : 'none',
                        borderBottomColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {variant.name}
                      </Typography>
                      {variant.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {variant.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.baseType.trim()}
        >
          {product ? 'Save Changes' : 'Add Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 