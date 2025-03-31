'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, CircularProgress, Typography, Paper } from '@mui/material';
import { ReportProvider, useReport } from '@/contexts/report-context';
import { useAssessment, AssessmentProvider } from '@/contexts/assessment-context';
import { ReportFormat } from '@/types/report.types';

// Component for displaying the report content
function ReportContent() {
  const { state, generateReport, exportReport } = useReport();
  const { state: assessmentState, dispatch } = useAssessment();
  const router = useRouter();
  
  useEffect(() => {
    // Load assessment data from localStorage if not available in context
    if (!assessmentState.businessProfile) {
      try {
        const savedState = localStorage.getItem('assessmentState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          console.log('Loading assessment state from localStorage:', parsedState);
          
          // Update assessment state with saved data
          if (parsedState.businessProfile) {
            dispatch({ type: 'SET_BUSINESS_PROFILE', payload: parsedState.businessProfile });
          }
          if (parsedState.selectedProducts) {
            dispatch({ type: 'SET_SELECTED_PRODUCTS', payload: parsedState.selectedProducts });
          }
          if (parsedState.productionCapacity) {
            dispatch({ type: 'SET_PRODUCTION_CAPACITY', payload: parsedState.productionCapacity });
          }
          if (parsedState.marketInfo) {
            dispatch({ type: 'SET_MARKET_INFO', payload: parsedState.marketInfo });
          }
          if (parsedState.certifications) {
            dispatch({ type: 'SET_CERTIFICATIONS', payload: parsedState.certifications });
          }
          if (parsedState.budget) {
            dispatch({ type: 'SET_BUDGET', payload: parsedState.budget });
          }
        }
      } catch (error) {
        console.error('Error loading assessment state from localStorage:', error);
      }
    }
  }, [assessmentState.businessProfile, dispatch]);

  useEffect(() => {
    // Generate the report when the component mounts and assessment data is loaded
    if (!state.reportData && !state.isGenerating && assessmentState.businessProfile) {
      console.log('Generating report with assessment data:', assessmentState);
      generateReport();
    } else if (!assessmentState.businessProfile) {
      console.log('No business profile available yet:', assessmentState);
      
      // In development mode, generate a report with the mock data even without a business profile
      if (process.env.NODE_ENV === 'development') {
        console.log('Generating mock report in development mode...');
        generateReport();
      }
    } else if (state.reportData) {
      console.log('Report already generated:', state.reportData);
    }
  }, [state.reportData, state.isGenerating, generateReport, assessmentState.businessProfile, assessmentState]);

  const handleExportPdf = () => {
    exportReport(ReportFormat.PDF);
  };

  const handleExportHtml = () => {
    exportReport(ReportFormat.HTML);
  };

  const handleBack = () => {
    router.push('/assessment');
  };

  // If there's no business profile, redirect back to assessment
  if (!assessmentState.businessProfile) {
    useEffect(() => {
      router.push('/assessment');
    }, [router]);
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {state.isGenerating ? (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={64} thickness={4} />
          <Typography variant="h5" mt={4}>
            Generating your Export Readiness Report...
          </Typography>
          <Typography variant="body1" mt={2} color="text.secondary" textAlign="center">
            We're analyzing your assessment data and preparing a comprehensive export strategy.
            <br />
            This may take a minute.
          </Typography>
        </Box>
      ) : state.generationError ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'error.50', borderRadius: 2 }}>
          <Typography variant="h5" color="error.main" gutterBottom>
            Error Generating Report
          </Typography>
          <Typography variant="body1" mb={4}>
            {state.generationError}
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Return to Assessment
          </Button>
        </Paper>
      ) : state.reportData ? (
        <Box>
          <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
            <Typography variant="h4" color="primary.main" gutterBottom>
              Export Readiness Report: {state.reportData.businessProfile.name}
            </Typography>
            
            <Box display="flex" my={3}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'success.light',
                  color: 'white',
                  borderRadius: '50%',
                  width: 120,
                  height: 120,
                  fontSize: 36,
                  fontWeight: 'bold',
                  mb: 2,
                  mx: 'auto'
                }}
              >
                {state.reportData.exportReadinessScore}/100
              </Box>
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Generated on {new Date(state.reportData.generatedAt).toLocaleDateString()}
            </Typography>
            
            {state.reportData.overallConfidenceScore && (
              <Typography variant="body2" color="text.secondary">
                Confidence Score: {(state.reportData.overallConfidenceScore * 100).toFixed(1)}%
              </Typography>
            )}
            
            <Box display="flex" gap={2} mt={4}>
              <Button variant="contained" onClick={handleExportPdf}>
                Export as PDF
              </Button>
              <Button variant="outlined" onClick={handleExportHtml}>
                Export as HTML
              </Button>
              <Button variant="text" onClick={handleBack}>
                Return to Assessment
              </Button>
            </Box>
          </Paper>
          
          {/* Summary Section */}
          <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Executive Summary
            </Typography>
            <Typography variant="body1">
              Based on your assessment, {state.reportData.businessProfile.name} has an export readiness score of 
              {' '}{state.reportData.exportReadinessScore}/100, indicating 
              {state.reportData.exportReadinessScore > 75 ? ' excellent ' : 
               state.reportData.exportReadinessScore > 50 ? ' good ' : 
               state.reportData.exportReadinessScore > 25 ? ' moderate ' : ' limited '}
              preparedness for international expansion.
            </Typography>
            
            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight="bold">
                Key Findings:
              </Typography>
              <ul>
                <li>Target Markets: {state.reportData.marketInfo.targetMarkets.map(m => m.name).join(', ')}</li>
                <li>Products: {state.reportData.selectedProducts.map(p => p.name).join(', ')}</li>
                <li>Required Certifications: {state.reportData.certificationRoadmap.requirements.length}</li>
                <li>Estimated Timeline: {Math.ceil(state.reportData.certificationRoadmap.totalEstimatedTimelineInDays / 30)} months</li>
              </ul>
            </Box>
          </Paper>
          
          {/* Quick Teaser Sections */}
          <Box display="flex" gap={3} flexWrap="wrap">
            <Paper sx={{ p: 3, borderRadius: 2, flex: '1 1 45%', minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                Market Overview
              </Typography>
              <Typography variant="body2" noWrap>
                Top market: {state.reportData.marketOverview[0]?.marketName}
              </Typography>
              <Button size="small" sx={{ mt: 2 }}>View Details</Button>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2, flex: '1 1 45%', minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                Certification Roadmap
              </Typography>
              <Typography variant="body2">
                {state.reportData.certificationRoadmap.requirements.length} certifications required
              </Typography>
              <Button size="small" sx={{ mt: 2 }}>View Details</Button>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2, flex: '1 1 45%', minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                Resource Needs
              </Typography>
              <Typography variant="body2">
                {state.reportData.resourceNeeds.resourceNeeds.length} key resources identified
              </Typography>
              <Button size="small" sx={{ mt: 2 }}>View Details</Button>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2, flex: '1 1 45%', minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                Action Plan
              </Typography>
              <Typography variant="body2">
                {state.reportData.actionPlan.actionItems.length} critical actions to take
              </Typography>
              <Button size="small" sx={{ mt: 2 }}>View Details</Button>
            </Paper>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mt={6} textAlign="center">
            View and export the full report to access comprehensive market insights, 
            certification details, resource planning, and implementation guidance.
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Typography variant="h5">
            No report data available
          </Typography>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 3 }}>
            Return to Assessment
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default function ReportPage() {
  return (
    <AssessmentProvider>
      <ReportProvider>
        <ReportContent />
      </ReportProvider>
    </AssessmentProvider>
  );
} 