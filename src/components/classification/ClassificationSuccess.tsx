import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { HSCodeSelection } from './types/classification.interface';

interface ClassificationSuccessProps {
  productName: string;
  hsCodeSelection: HSCodeSelection;
  onResetClassification: () => void;
}

/**
 * Success component shown after completing the HS code classification
 */
const ClassificationSuccess: React.FC<ClassificationSuccessProps> = ({
  productName,
  hsCodeSelection,
  onResetClassification
}) => {
  // Format the HS code for display
  const formatHSCode = () => {
    const parts = [];
    if (hsCodeSelection.chapter) parts.push(hsCodeSelection.chapter.code);
    if (hsCodeSelection.heading) parts.push(hsCodeSelection.heading.code.slice(2));
    if (hsCodeSelection.subheading) parts.push(hsCodeSelection.subheading.code.slice(4));
    
    return parts.join('.');
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        backgroundColor: 'success.light',
        borderRadius: 1
      }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h6" color="success.dark">
          Classification Complete
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          HS Code Assignment
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Product:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {productName}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Classification:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip 
              label={formatHSCode()}
              color="primary"
              sx={{ 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
                py: 2,
                borderRadius: 1
              }}
            />
          </Box>
        </Box>
        
        {hsCodeSelection.subheading && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Description:
            </Typography>
            <Typography variant="body1">
              {hsCodeSelection.subheading.description}
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This HS code will be used to identify applicable tariffs and trade requirements for your export markets.
      </Alert>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={onResetClassification}
          size="small"
        >
          Change Classification
        </Button>
      </Box>
    </Box>
  );
};

export default ClassificationSuccess; 