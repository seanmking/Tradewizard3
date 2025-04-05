import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Paper,
  Collapse,
  Divider,
  IconButton,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HSCodeClassifier from './HSCodeClassifier';
import ClassificationSuccess from './ClassificationSuccess';
import HSCodeInfoPopover from './HSCodeInfoPopover';
import { HSCodeSelection, ClassificationStep } from './types/classification.interface';
import { ProductGroup } from './types/product.interface';

interface ProductCardProps {
  product: ProductGroup;
  onProductSelect: (productId: string, selected: boolean) => void;
  onUpdateClassification: (productId: string, selection: HSCodeSelection, step: ClassificationStep) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductSelect,
  onUpdateClassification
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isClassified = product.classificationStep === ClassificationStep.Complete;
  const isSelected = product.isSelected || false;
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onProductSelect(product.id, event.target.checked);
  };
  
  const handleUpdateSelection = (selection: HSCodeSelection, step: ClassificationStep) => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onUpdateClassification(product.id, selection, step);
      setLoading(false);
    }, 300);
  };
  
  const handleResetClassification = () => {
    handleUpdateSelection({ chapter: null, heading: null, subheading: null }, ClassificationStep.Unstarted);
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'primary.100',
        overflow: 'hidden'
      }}
    >
      {/* Product Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2,
        bgcolor: isSelected ? 'primary.50' : 'transparent'
      }}>
        <Checkbox 
          checked={isSelected}
          onChange={handleCheckboxChange}
          sx={{ mr: 1 }}
        />
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {product.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {product.description || 'No description available'}
          </Typography>
        </Box>
        
        <IconButton onClick={handleToggleExpand} aria-expanded={expanded} aria-label="toggle expand">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      {/* Classification Area */}
      <Collapse in={expanded}>
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {!isClassified && product.classificationStep !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                What is an HS Code? <HSCodeInfoPopover iconSize={16} />
              </Typography>
            </Box>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : isClassified && product.hsCodeSelection ? (
            <ClassificationSuccess 
              productName={product.name}
              hsCodeSelection={product.hsCodeSelection}
              onResetClassification={handleResetClassification}
            />
          ) : (
            <HSCodeClassifier
              productName={product.name}
              initialSelection={product.hsCodeSelection || { chapter: null, heading: null, subheading: null }}
              classificationStep={product.classificationStep || ClassificationStep.Unstarted}
              onUpdateSelection={handleUpdateSelection}
            />
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ProductCard; 