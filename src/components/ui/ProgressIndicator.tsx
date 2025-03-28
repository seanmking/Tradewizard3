import React from 'react';
import { Box, Stepper, Step, StepLabel } from '@mui/material';
import { styled } from '@mui/material/styles';

const steps = [
  'Business Profile',
  'Product Selection',
  'Production Capacity',
  'Market Assessment',
  'Certifications & Budget'
];

interface ProgressIndicatorProps {
  currentStep: number;
  completedSteps?: number[];
}

const StyledStepper = styled(Stepper)({
  marginBottom: 32, // theme.spacing(4)
  '& .MuiStepLabel-root': {
    '& .MuiStepLabel-label': {
      fontSize: '0.875rem',
      '@media (min-width: 960px)': { // theme.breakpoints.up('md')
        fontSize: '1rem',
      },
    },
    '& .MuiStepLabel-active': {
      color: '#4299e1', // theme.palette.primary.main
      fontWeight: 600,
    },
    '& .MuiStepLabel-completed': {
      color: '#48bb78', // theme.palette.success.main
    },
  },
  '& .MuiStepIcon-root': {
    color: '#e2e8f0', // theme.palette.grey[300]
    '&.MuiStepIcon-active': {
      color: '#4299e1', // theme.palette.primary.main
    },
    '&.MuiStepIcon-completed': {
      color: '#2b6cb0', // theme.palette.primary.dark
    },
  },
});

export function ProgressIndicator({ currentStep, completedSteps = [] }: ProgressIndicatorProps) {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <StyledStepper activeStep={currentStep - 1} alternativeLabel>
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          
          return (
            <Step key={label} completed={isCompleted}>
              <StepLabel>{label}</StepLabel>
            </Step>
          );
        })}
      </StyledStepper>
    </Box>
  );
} 