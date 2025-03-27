import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BusinessProfile } from '../types/business-profile.types';
import { ComplianceMCPResponse } from '../mcp/compliance-mcp/compliance-mcp.interface';
import { MarketInsight } from '../mcp/market-intelligence-mcp/market-intelligence-mcp.interface';

interface AssessmentContextType {
  currentStep: number;
  totalSteps: number;
  businessProfile: BusinessProfile | null;
  selectedProducts: string[];
  targetMarkets: string[];
  productionCapacity: {
    current: number;
    maximum: number;
    approach: 'in-house' | 'outsourced' | 'both';
  } | null;
  previousExport: {
    hasExported: boolean;
    markets?: string[];
    products?: string[];
  };
  budget: number;
  complianceRequirements: ComplianceMCPResponse | null;
  marketInsights: Record<string, MarketInsight> | null;
  
  // Methods
  setBusinessProfile: (profile: BusinessProfile) => void;
  setSelectedProducts: (products: string[]) => void;
  setTargetMarkets: (markets: string[]) => void;
  setProductionCapacity: (capacity: { current: number; maximum: number; approach: 'in-house' | 'outsourced' | 'both' }) => void;
  setPreviousExport: (data: { hasExported: boolean; markets?: string[]; products?: string[] }) => void;
  setBudget: (amount: number) => void;
  setComplianceRequirements: (requirements: ComplianceMCPResponse) => void;
  setMarketInsights: (insights: Record<string, MarketInsight>) => void;
  
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

interface AssessmentProviderProps {
  children: ReactNode;
}

export const AssessmentProvider: React.FC<AssessmentProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [productionCapacity, setProductionCapacity] = useState<{
    current: number;
    maximum: number;
    approach: 'in-house' | 'outsourced' | 'both';
  } | null>(null);
  const [previousExport, setPreviousExport] = useState<{
    hasExported: boolean;
    markets?: string[];
    products?: string[];
  }>({ hasExported: false });
  const [budget, setBudget] = useState<number>(0);
  const [complianceRequirements, setComplianceRequirements] = useState<ComplianceMCPResponse | null>(null);
  const [marketInsights, setMarketInsights] = useState<Record<string, MarketInsight> | null>(null);
  
  const totalSteps = 4; // Hardcoded based on our 4-step assessment
  
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };
  
  const value = {
    currentStep,
    totalSteps,
    businessProfile,
    selectedProducts,
    targetMarkets,
    productionCapacity,
    previousExport,
    budget,
    complianceRequirements,
    marketInsights,
    
    setBusinessProfile,
    setSelectedProducts,
    setTargetMarkets,
    setProductionCapacity,
    setPreviousExport,
    setBudget,
    setComplianceRequirements,
    setMarketInsights,
    
    nextStep,
    prevStep,
    goToStep,
  };
  
  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}; 