'use client';

import { PropsWithChildren } from 'react';

interface AssessmentStepProps {
  title: string;
  description?: string;
  stepNumber: number;
  totalSteps: number;
  isActive: boolean;
  isCompleted: boolean;
  onNext?: () => void;
  onBack?: () => void;
  marketingHook?: string;
}

export const AssessmentStep = ({
  title,
  description,
  stepNumber,
  totalSteps,
  isActive,
  isCompleted,
  onNext,
  onBack,
  marketingHook,
  children,
}: PropsWithChildren<AssessmentStepProps>) => {
  if (!isActive) return null;
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold mr-4">
                {stepNumber}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <div className="text-sm text-gray-500">
              Step {stepNumber} of {totalSteps}
            </div>
          </div>
          {description && (
            <p className="text-gray-600 text-lg">{description}</p>
          )}
        </header>
        
        <div className="mb-8">
          {children}
        </div>
        
        {marketingHook && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded">
            <p className="text-blue-700 italic">
              {marketingHook}
            </p>
          </div>
        )}
        
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {stepNumber === totalSteps ? 'Generate Report' : 'Next Step'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 