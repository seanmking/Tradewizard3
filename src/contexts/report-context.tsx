'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  BusinessProfile, 
  Product, 
  ProductionCapacity, 
  MarketInfo, 
  Certification, 
  Budget 
} from '@/contexts/assessment-context';
import { ReportGeneratorService } from '@/services/report-generator/report-generator.service';
import { useAssessment } from '@/contexts/assessment-context';

export interface MarketOverviewInsight {
  marketCode: string;
  marketName: string;
  marketSize: number;
  marketCurrency: string;
  growthRate: number;
  keyCompetitors: Array<{
    name: string;
    marketShare: number;
  }>;
  entryBarriers: string[];
  tariffInformation: string;
}

export interface CertificationRoadmapItem {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: number;
  cost: {
    min: number;
    max: number;
    currency: string;
  };
  steps: string[];
}

export interface ResourceNeed {
  type: 'financial' | 'human' | 'infrastructure' | 'knowledge';
  description: string;
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  timeline?: number;
  alternatives?: string[];
}

export interface ActionPlanItem {
  id: string;
  title: string;
  description: string;
  timeline: {
    startMonth: number;
    durationMonths: number;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  resources?: string[];
}

export interface ReportData {
  businessProfile: BusinessProfile;
  selectedProducts: Product[];
  productionCapacity: ProductionCapacity;
  marketInfo: MarketInfo;
  certifications: Certification[];
  budget: Budget;
  insights: {
    marketOverview: MarketOverviewInsight[];
    certificationRoadmap: CertificationRoadmapItem[];
    resourceNeeds: ResourceNeed[];
    actionPlan: ActionPlanItem[];
  };
  generatedAt: Date;
  exportReadinessScore: number;
}

interface ReportState {
  isGenerating: boolean;
  reportData: ReportData | null;
  generationError: string | null;
}

type ReportAction = 
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_REPORT_DATA'; payload: ReportData }
  | { type: 'SET_GENERATION_ERROR'; payload: string | null };

const initialState: ReportState = {
  isGenerating: false,
  reportData: null,
  generationError: null
};

const ReportContext = createContext<{
  state: ReportState;
  dispatch: React.Dispatch<ReportAction>;
  generateReport: () => Promise<void>;
} | null>(null);

function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_REPORT_DATA':
      return { ...state, reportData: action.payload };
    case 'SET_GENERATION_ERROR':
      return { ...state, generationError: action.payload };
    default:
      return state;
  }
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reportReducer, initialState);
  const { state: assessmentState } = useAssessment();
  const reportGeneratorService = new ReportGeneratorService();
  
  const generateReport = async () => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    dispatch({ type: 'SET_GENERATION_ERROR', payload: null });
    
    try {
      const reportData = await reportGeneratorService.generateReport(assessmentState);
      dispatch({ type: 'SET_REPORT_DATA', payload: reportData });
    } catch (error) {
      console.error('Error generating report:', error);
      dispatch({ 
        type: 'SET_GENERATION_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error generating report'
      });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };
  
  return (
    <ReportContext.Provider value={{ state, dispatch, generateReport }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
} 