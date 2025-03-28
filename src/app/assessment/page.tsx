'use client';

import React, { useEffect, useState } from 'react';
import { AssessmentProvider } from '@/contexts/assessment-context';
import { AssessmentLayout } from '@/components/assessment/assessment-layout';
import { BusinessProfileStep } from '@/components/assessment/steps/business-profile';
import { ProductSelectionStep } from '@/components/assessment/steps/product-selection';
import { ProductionCapacityStep, MarketAssessmentStep } from '@/components/assessment/steps/production-market';
import { CertificationsBudgetStep } from '@/components/assessment/steps/certifications-budget';
import { useAssessment } from '@/contexts/assessment-context';
import Script from 'next/script';
import { fixAssessmentRequests } from '@/utils/fix-assessment-requests';

// Component to monitor for any stray API requests
function RequestMonitor() {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('Setting up request monitoring');
    
    // Apply our fix function that handles fetch and XHR requests
    const cleanup = fixAssessmentRequests();
    
    // Setup global error handler to catch network errors
    if (typeof window !== 'undefined') {
      const originalOnError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        console.log('Global error caught:', message);
        if (String(message).includes('assessment')) {
          setError(`Error with assessment: ${message}`);
        }
        return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
      };
      
      // Cleanup function for the error handler
      return () => {
        window.onerror = originalOnError;
        if (cleanup) cleanup();
      };
    }
    
    return cleanup;
  }, []);
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Assessment Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  return null;
}

function AssessmentSteps() {
  const { state } = useAssessment();
  const currentStep = state.currentStep;

  switch (currentStep) {
    case 1:
      return <BusinessProfileStep />;
    case 2:
      return <ProductSelectionStep />;
    case 3:
      return <ProductionCapacityStep />;
    case 4:
      return <MarketAssessmentStep />;
    case 5:
      return <CertificationsBudgetStep />;
    default:
      return <BusinessProfileStep />;
  }
}

export default function AssessmentPage() {
  return (
    <AssessmentProvider>
      <Script src="/assessment.js" strategy="beforeInteractive" />
      <RequestMonitor />
      <AssessmentLayout>
        <AssessmentSteps />
      </AssessmentLayout>
    </AssessmentProvider>
  );
} 