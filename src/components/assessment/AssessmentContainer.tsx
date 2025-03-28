'use client';

import React from 'react';
import { useAssessment } from '@/contexts/assessment-context';
import { AssessmentStep } from './AssessmentStep';
import { WebsiteInputForm } from './WebsiteInputForm';
import { BusinessProfile } from '@/types/business-profile.types';

export const AssessmentContainer: React.FC = () => {
  const { state, dispatch } = useAssessment();
  const currentStep = state.currentStep;
  const totalSteps = 4; // Match the number of steps in the main assessment

  const handleWebsiteAnalysisComplete = (profile: BusinessProfile) => {
    dispatch({ type: 'SET_BUSINESS_PROFILE', payload: profile });
    dispatch({ type: 'SET_STEP', payload: 2 }); // Move to step 2
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AssessmentStep
            title="Business Profile"
            description="Let's start by analyzing your business website to gather initial information."
            stepNumber={1}
            totalSteps={totalSteps}
            isActive={true}
            isCompleted={false}
            onNext={undefined} // Handled by WebsiteInputForm
            marketingHook="Did you know? SMEs with strong digital presence are 22% more likely to succeed in export markets, and 65% of international buyers research exporters online before making contact."
          >
            <WebsiteInputForm onComplete={handleWebsiteAnalysisComplete} />
          </AssessmentStep>
        );
      
      // Additional steps will be implemented here
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {renderStep()}
    </div>
  );
}; 