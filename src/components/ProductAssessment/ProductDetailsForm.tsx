import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { HSChapterMappingService } from '../../services/hs-code/hsChapterMapping.service';

interface ProductDetailsFormProps {
  initialData?: any;
  onChange: (data: any) => void;
}

// These are example fields that help determine HS codes
// You should expand this based on your HS classification rules
const PREPARATION_METHODS = [
  'Fresh',
  'Frozen',
  'Dried',
  'Cooked',
  'Preserved',
  'Processed',
];

const PACKAGING_TYPES = [
  'Bulk',
  'Retail',
  'Vacuum Packed',
  'Modified Atmosphere',
  'Canned',
];

const MAIN_INGREDIENTS = [
  'Meat',
  'Fish',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Cereals',
  'Mixed',
];

const PRODUCT_STATES = [
  'Raw',
  'Semi-processed',
  'Ready-to-eat',
  'Ready-to-cook',
];

export const ProductDetailsForm: React.FC<ProductDetailsFormProps> = ({
  initialData = {},
  onChange,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mainIngredient: '',
    preparationMethod: '',
    packagingType: '',
    productState: '',
    netWeight: '',
    shelfLife: '',
    storageRequirements: '',
    additionalIngredients: '',
    ...initialData,
  });

  const [suggestedHsCode, setSuggestedHsCode] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  const hsService = new HSChapterMappingService();

  useEffect(() => {
    // Update parent component when form data changes
    onChange(formData);

    // Get HS code suggestion based on form data
    const suggestion = hsService.suggestHsCode(formData);
    if (suggestion) {
      setSuggestedHsCode(suggestion.code);
      setConfidence(suggestion.confidence);
    }
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Product Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Main Ingredient</InputLabel>
            <Select
              value={formData.mainIngredient}
              onChange={(e) => handleChange('mainIngredient', e.target.value)}
              label="Main Ingredient"
            >
              {MAIN_INGREDIENTS.map((ingredient) => (
                <MenuItem key={ingredient} value={ingredient}>
                  {ingredient}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Primary ingredient determines the HS chapter</FormHelperText>
          </FormControl>
        </Grid>

        {/* Preparation Details */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Preparation Method</InputLabel>
            <Select
              value={formData.preparationMethod}
              onChange={(e) => handleChange('preparationMethod', e.target.value)}
              label="Preparation Method"
            >
              {PREPARATION_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>How the product is prepared affects its classification</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Product State</InputLabel>
            <Select
              value={formData.productState}
              onChange={(e) => handleChange('productState', e.target.value)}
              label="Product State"
            >
              {PRODUCT_STATES.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Packaging Information */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Packaging Type</InputLabel>
            <Select
              value={formData.packagingType}
              onChange={(e) => handleChange('packagingType', e.target.value)}
              label="Packaging Type"
            >
              {PACKAGING_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Packaging can affect tariff classification</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Net Weight/Volume"
            value={formData.netWeight}
            onChange={(e) => handleChange('netWeight', e.target.value)}
            helperText="Include units (e.g., 500g, 1L)"
          />
        </Grid>

        {/* Additional Details */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Shelf Life"
            value={formData.shelfLife}
            onChange={(e) => handleChange('shelfLife', e.target.value)}
            helperText="E.g., 12 months, 2 years"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Storage Requirements"
            value={formData.storageRequirements}
            onChange={(e) => handleChange('storageRequirements', e.target.value)}
            helperText="E.g., Keep frozen, Room temperature"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Ingredients"
            value={formData.additionalIngredients}
            onChange={(e) => handleChange('additionalIngredients', e.target.value)}
            multiline
            rows={2}
            helperText="List other significant ingredients that may affect classification"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Product Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={3}
            helperText="Detailed description helps ensure accurate classification"
          />
        </Grid>

        {/* HS Code Suggestion */}
        {suggestedHsCode && (
          <Grid item xs={12}>
            <Alert 
              severity={confidence > 0.8 ? "success" : confidence > 0.5 ? "info" : "warning"}
              sx={{ mt: 2 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Suggested HS Code: <Chip label={suggestedHsCode} color="primary" />
              </Typography>
              <Typography variant="body2">
                Confidence: {(confidence * 100).toFixed(1)}%
                {confidence < 0.8 && " - Please verify this suggestion carefully"}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 