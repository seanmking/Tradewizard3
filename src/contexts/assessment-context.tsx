'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type EntityType = 'business' | 'product' | 'location' | 'contact' | 'person' | 'service';

export interface BusinessProfile {
  name: string;
  description: string;
  industry: string;
  location: string;
  websiteUrl: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  products?: Array<{
    name: string;
    description: string;
    category?: string;
    specifications?: Record<string, string>;
  }>;
  extractedAt?: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  specifications: Record<string, string>;
  selected?: boolean;
}

export interface ProductionCapacity {
  monthlyCapacity: number;
  unit: 'units' | 'kg' | 'tons' | 'pieces';
  leadTime: number;
  minimumOrderQuantity: number;
}

export interface TargetMarket {
  id: string;
  code: string;
  name: string;
}

export interface MarketInfo {
  targetMarkets: TargetMarket[];
  existingMarkets: string[];
  competitorAnalysis: string;
}

export interface Certification {
  id: string;
  name: string;
  status: 'planned' | 'in-progress' | 'obtained';
}

export interface Budget {
  amount: number;
  currency: string;
  timeline: number;
  allocation: {
    certifications: number;
    marketing: number;
    logistics: number;
    other: number;
  };
}

interface AssessmentState {
  currentStep: number;
  isAnalysing: boolean;
  businessInfo: {
    websiteUrl: string;
    extractedInfo: any; // Will be typed properly once WebsiteExtractor is implemented
  };
  businessProfile?: BusinessProfile;
  selectedProducts: Product[];
  productionCapacity: ProductionCapacity;
  marketInfo: MarketInfo;
  certifications: Certification[];
  budget: Budget;
}

type AssessmentAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_ANALYSING'; payload: boolean }
  | { type: 'SET_BUSINESS_INFO'; payload: AssessmentState['businessInfo'] }
  | { type: 'SET_BUSINESS_PROFILE'; payload: BusinessProfile }
  | { type: 'SET_SELECTED_PRODUCTS'; payload: Product[] }
  | { type: 'SET_PRODUCTION_CAPACITY'; payload: ProductionCapacity }
  | { type: 'SET_MARKET_INFO'; payload: MarketInfo }
  | { type: 'SET_CERTIFICATIONS'; payload: Certification[] }
  | { type: 'SET_BUDGET'; payload: Budget };

const initialState: AssessmentState = {
  currentStep: 1,
  isAnalysing: false,
  businessInfo: {
    websiteUrl: '',
    extractedInfo: null,
  },
  businessProfile: undefined,
  selectedProducts: [],
  productionCapacity: {
    monthlyCapacity: 0,
    unit: 'units',
    leadTime: 0,
    minimumOrderQuantity: 0,
  },
  marketInfo: {
    targetMarkets: [],
    existingMarkets: [],
    competitorAnalysis: '',
  },
  certifications: [],
  budget: {
    amount: 0,
    currency: 'USD',
    timeline: 12,
    allocation: {
      certifications: 0,
      marketing: 0,
      logistics: 0,
      other: 0,
    },
  },
};

const AssessmentContext = React.createContext<{
  state: AssessmentState;
  dispatch: React.Dispatch<AssessmentAction>;
} | null>(null);

function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ANALYSING':
      return { ...state, isAnalysing: action.payload };
    case 'SET_BUSINESS_INFO':
      return { ...state, businessInfo: action.payload };
    case 'SET_BUSINESS_PROFILE':
      return { ...state, businessProfile: action.payload };
    case 'SET_SELECTED_PRODUCTS':
      return { ...state, selectedProducts: action.payload };
    case 'SET_PRODUCTION_CAPACITY':
      return { ...state, productionCapacity: action.payload };
    case 'SET_MARKET_INFO':
      return { ...state, marketInfo: action.payload };
    case 'SET_CERTIFICATIONS':
      return { ...state, certifications: action.payload };
    case 'SET_BUDGET':
      return { ...state, budget: action.payload };
    default:
      return state;
  }
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = React.useReducer(assessmentReducer, initialState);

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = React.useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
} 