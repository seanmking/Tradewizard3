import { HsClassificationResult } from '@/mcp/global/hs-code-mcp/hs-code-mcp.interface';
import { ClassificationResult } from '@/services/classification/embeddingService';

export interface UkHsCodeTariffInfo {
  hsCode: string;
  description: string;
  tariffRate: number | null;
  tariffCategory: string;
  measureType: string;
  unitOfMeasure: string;
  vat: string;
  additionalCodes: string[];
  footnotes: string[];
  quotas: any[];
  requiresLicense: boolean;
}

export interface UkHsCodeResult {
  ukClassifications: UkHsCodeTariffInfo[];
  query: string;
  timestamp: string;
  globalClassification?: HsClassificationResult;
}

export interface UkHsTariffMCP {
  getExtendedHsCode(productDescription: string): Promise<UkHsCodeResult>;
  getTariffByHsCode(hsCode: string): Promise<UkHsCodeTariffInfo[]>;
} 