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

  const steps = [
    {
      id: 1,
      title: 'Business Profile',
      description: 'Let\'s analyse your business website',
      completed: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: 2,
      title: 'Product Selection',
      description: 'Select products for export',
      completed: currentStep > 2,
      current: currentStep === 2
    },
    {
      id: 3,
      title: 'Production & Market',
      description: 'Assess your capacity and market fit',
      completed: currentStep > 3,
      current: currentStep === 3
    },
    {
      id: 4,
      title: 'Certifications & Budget',
      description: 'Plan your export journey',
      completed: currentStep > 4,
      current: currentStep === 4
    },
  ];

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

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-16 relative">
          {/* Background line - always gray */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
          
          {/* Colored progress line */}
          <div 
            className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300 ease-in-out" 
            style={{ 
              width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%`,
              display: currentStep > 1 ? 'block' : 'none'
            }}
          />
          
          {/* Step Markers */}
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex-1 relative flex flex-col items-center",
                index === 0 ? "items-start" : index === steps.length - 1 ? "items-end" : "items-center"
              )}
            >
              {/* Step Circle */}
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 transition-colors',
                  currentStep === step.id
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : currentStep > step.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-500 border-2 border-gray-200'
                )}
                initial={false}
                animate={{
                  scale: currentStep === step.id ? 1.1 : 1,
                }}
              >
                {currentStep > step.id ? '✓' : step.id}
              </motion.div>
              
              {/* Step Title */}
              <div className="mt-4 text-center w-full">
                <p
                  className={cn(
                    'text-sm font-medium whitespace-nowrap',
                    currentStep === step.id
                      ? 'text-primary'
                      : currentStep > step.id
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div>
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
    </div>
  );
} 