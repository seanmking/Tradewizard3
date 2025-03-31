'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  ReportData,
  ReportFormat,
  ReportGenerationConfig
} from '@/types/report.types';
import { ReportGeneratorService } from '@/services/report-generator/report-generator.service';
import { PdfExportService } from '@/services/report-generator/pdf-export.service';
import { useAssessment } from '@/contexts/assessment-context';
import { logger } from '@/utils/logger';

interface ReportState {
  isGenerating: boolean;
  generationError: string | null;
  reportData: ReportData | null;
  exportFormat: ReportFormat;
  generationConfig: ReportGenerationConfig;
}

type ReportAction =
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_GENERATION_ERROR'; payload: string | null }
  | { type: 'SET_REPORT_DATA'; payload: ReportData | null }
  | { type: 'SET_EXPORT_FORMAT'; payload: ReportFormat }
  | { type: 'SET_GENERATION_CONFIG'; payload: Partial<ReportGenerationConfig> };

const initialGenerationConfig: ReportGenerationConfig = {
  includeConfidenceScores: true,
  prioritizeMarkets: [],
  focusOnCertification: false,
  costOptimization: false,
  timelineOptimization: false,
  includeRawData: false
};

const initialState: ReportState = {
  isGenerating: false,
  generationError: null,
  reportData: null,
  exportFormat: ReportFormat.HTML,
  generationConfig: initialGenerationConfig
};

const ReportContext = createContext<{
  state: ReportState;
  dispatch: React.Dispatch<ReportAction>;
  generateReport: () => Promise<void>;
  exportReport: (format: ReportFormat) => Promise<void>;
  updateGenerationConfig: (config: Partial<ReportGenerationConfig>) => void;
} | null>(null);

function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_GENERATION_ERROR':
      return { ...state, generationError: action.payload };
    case 'SET_REPORT_DATA':
      return { ...state, reportData: action.payload };
    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload };
    case 'SET_GENERATION_CONFIG':
      return { 
        ...state, 
        generationConfig: { ...state.generationConfig, ...action.payload } 
      };
    default:
      return state;
  }
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reportReducer, initialState);
  const { state: assessmentState } = useAssessment();
  
  // For development purposes, we can use mock data if needed
  const useMockData = true; // Always use mock data until service integrations are ready
  const reportGeneratorService = new ReportGeneratorService(useMockData);
  const pdfExportService = new PdfExportService();
  
  const generateReport = async () => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    dispatch({ type: 'SET_GENERATION_ERROR', payload: null });
    
    try {
      logger.info('Generating export readiness report');
      
      // Ensure businessProfile is defined before generating the report
      if (!assessmentState.businessProfile) {
        throw new Error('Business profile is required for report generation');
      }
      
      const reportData = await reportGeneratorService.generateReport(
        {
          ...assessmentState,
          // Ensure businessProfile is not undefined for the report generator
          businessProfile: assessmentState.businessProfile
        }, 
        state.generationConfig
      );
      
      dispatch({ type: 'SET_REPORT_DATA', payload: reportData });
      logger.info('Report generation completed successfully');
    } catch (error) {
      logger.error('Error generating report:', error);
      dispatch({ 
        type: 'SET_GENERATION_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error generating report'
      });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };
  
  const exportReport = async (format: ReportFormat) => {
    if (!state.reportData) {
      dispatch({ 
        type: 'SET_GENERATION_ERROR', 
        payload: 'No report data available to export' 
      });
      return;
    }
    
    try {
      dispatch({ type: 'SET_EXPORT_FORMAT', payload: format });
      logger.info(`Exporting report in ${format} format`);
      
      // Use the PdfExportService to generate the report in the selected format
      const blob = await pdfExportService.exportReport(state.reportData, format);
      
      // Download the generated file
      const fileName = `${state.reportData.businessProfile.name.replace(/\s+/g, '_')}_export_readiness_report`;
      const extension = format.toLowerCase();
      pdfExportService.downloadPdf(blob, `${fileName}.${extension}`);
      
      logger.info('Report export completed successfully');
    } catch (error) {
      logger.error('Error exporting report:', error);
      dispatch({ 
        type: 'SET_GENERATION_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error exporting report'
      });
    }
  };
  
  const updateGenerationConfig = (config: Partial<ReportGenerationConfig>) => {
    dispatch({ type: 'SET_GENERATION_CONFIG', payload: config });
  };
  
  return (
    <ReportContext.Provider value={{ 
      state, 
      dispatch, 
      generateReport, 
      exportReport,
      updateGenerationConfig
    }}>
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