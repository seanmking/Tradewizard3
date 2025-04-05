import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import FocusAreaHSCodeSelector from './FocusAreaHSCodeSelector';
import ClassificationSuccess from './ClassificationSuccess';
import { HSCodeSelection, ClassificationStep } from './types/classification.interface';

interface EditProductHSCodeIntegrationProps {
  productName: string;
  initialHSCodeSelection?: HSCodeSelection;
  onHSCodeSelected: (selection: HSCodeSelection) => void;
}

/**
 * Integration component for the Edit Product flow
 * This component integrates the Focus Area based HS code selector
 */
const EditProductHSCodeIntegration: React.FC<EditProductHSCodeIntegrationProps> = ({
  productName,
  initialHSCodeSelection,
  onHSCodeSelected
}) => {
  const [classificationStep, setClassificationStep] = useState<ClassificationStep>(
    initialHSCodeSelection?.subheading 
      ? ClassificationStep.Complete 
      : ClassificationStep.Unstarted
  );
  const [selection, setSelection] = useState<HSCodeSelection>(
    initialHSCodeSelection || { chapter: null, heading: null, subheading: null }
  );
  const [loading, setLoading] = useState(false);

  const handleUpdateSelection = (newSelection: HSCodeSelection, step: ClassificationStep) => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSelection(newSelection);
      setClassificationStep(step);
      
      // If the classification is complete, notify the parent component
      if (step === ClassificationStep.Complete && newSelection.subheading) {
        onHSCodeSelected(newSelection);
      }
      
      setLoading(false);
    }, 300);
  };

  const handleResetClassification = () => {
    setSelection({ chapter: null, heading: null, subheading: null });
    setClassificationStep(ClassificationStep.Unstarted);
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>{productName}</strong>
        </Typography>
        
        {initialHSCodeSelection?.subheading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This product already has an HS code assigned. You can keep the current classification or select a new one.
          </Alert>
        )}
      </Box>
      
      {!loading ? (
        classificationStep === ClassificationStep.Complete && selection.subheading ? (
          <ClassificationSuccess 
            productName={productName}
            hsCodeSelection={selection}
            onResetClassification={handleResetClassification}
          />
        ) : (
          <FocusAreaHSCodeSelector
            productName={productName}
            initialSelection={selection}
            onUpdateSelection={handleUpdateSelection}
          />
        )
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}
    </Paper>
  );
};

export default EditProductHSCodeIntegration; 