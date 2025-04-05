'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { FADE_IN_ANIMATION } from '@/lib/animation';
import { useAssessment } from '@/contexts/assessment-context';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SarahBox } from '@/components/sarah/SarahBox';
import { InfoBox } from '@/components/ui/InfoBox';

const StyledPaper = styled(Paper)({
  padding: 32, // theme.spacing(4)
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  marginBottom: 24, // theme.spacing(3)
});

export function BusinessProfileStep() {
  const { dispatch } = useAssessment();
  const [url, setUrl] = React.useState('');
  const [isAnalysing, setIsAnalysing] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Function to validate and format URL
  const validateAndFormatUrl = (inputUrl: string): string | null => {
    // Trim whitespace
    let formattedUrl = inputUrl.trim();
    
    // Check if URL is empty
    if (!formattedUrl) {
      return null;
    }
    
    // Add protocol if missing
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Validate URL format
    try {
      new URL(formattedUrl);
      return formattedUrl;
    } catch (error) {
      return null;
    }
  };
  
  const handleAnalyse = async () => {
    // Validate and format the URL
    const formattedUrl = validateAndFormatUrl(url);
    
    if (!formattedUrl) {
      setError('Please enter a valid website URL');
      return;
    }
    
    setIsAnalysing(true);
    setError('');
    dispatch({ type: 'SET_ANALYSING', payload: true });
    
    try {
      // Make API call to analyse the website with the formatted URL
      const response = await fetch('/api/extract-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyse website');
      }
      
      const data = await response.json();
      console.log('Analysis result:', data);
      
      // Update the assessment context with the result
      dispatch({ type: 'SET_BUSINESS_PROFILE', payload: data.data });
      
      // Move to the next step
      dispatch({ type: 'SET_STEP', payload: 2 });
      
    } catch (err) {
      console.error('Error analysing website:', err);
      setError('Failed to analyse the website. Please try again or enter information manually.');
    } finally {
      setIsAnalysing(false);
      dispatch({ type: 'SET_ANALYSING', payload: false });
    }
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
            Business Profile Analysis
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Let's start by analyzing your business website to gather essential information.
          </Typography>
          
          <SarahBox>
            Hi! I'm Sarah, your export consultant. I'll help analyze your website and guide you through the assessment. Please enter your business website URL below to get started.
          </SarahBox>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Business Website URL
            </Typography>
            <TextField 
              fullWidth
              placeholder="https://your-business.com"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim()) {
                  e.preventDefault();
                  handleAnalyse();
                }
              }}
              helperText={error || "Example: https://mysouthafricanbusiness.co.za"}
              error={!!error}
              sx={{ mb: 2 }}
            />
          </Box>
          
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleAnalyse}
            disabled={!url || isAnalysing}
            sx={{ 
              py: 1.5,
              px: 4,
              borderRadius: 1,
              fontWeight: 'bold',
            }}
          >
            {isAnalysing ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Analyzing...
              </>
            ) : (
              'Analyze Website'
            )}
          </Button>
          
          <InfoBox tooltipText="Website analysis helps us understand your export potential">
            A thorough analysis of your business website helps us understand your current market position, product offerings, and potential for international expansion. This information is crucial for creating a tailored export strategy.
          </InfoBox>
        </StyledPaper>
      </motion.div>
    </Container>
  );
} 