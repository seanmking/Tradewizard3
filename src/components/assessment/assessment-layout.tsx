'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAssessment } from '@/contexts/assessment-context';

interface AssessmentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AssessmentLayout({ children, className }: AssessmentLayoutProps) {
  const { state } = useAssessment();
  const currentStep = state.currentStep;
  
  useEffect(() => {
    console.log('Current step in AssessmentLayout:', currentStep);
  }, [currentStep]);

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Export Readiness Assessment</h1>
          <p className="mt-2 text-sm text-gray-500">
            Complete these steps to receive your personalized export readiness report
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6 md:p-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
} 