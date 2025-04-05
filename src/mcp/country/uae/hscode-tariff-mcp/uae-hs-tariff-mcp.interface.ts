import { HsClassificationResult } from '@/mcp/global/hs-code-mcp/hs-code-mcp.interface';
import { ClassificationResult } from '@/services/classification/embeddingService';

export interface UaeHsCodeTariffInfo {
  hsCode: string;
  description: string;
  tariffRate: number | null;
  tariffCategory: string;
  gccCommonTariff: boolean;
  dutyExemptions: string[];
  additionalFees: { name: string; rate: string }[];
}

export interface UaeHsCodeResult {
  uaeClassifications: UaeHsCodeTariffInfo[];
  query: string;
  timestamp: string;
  globalClassification?: HsClassificationResult;
}

export interface UaeHsTariffMCP {
  getExtendedHsCode(productDescription: string): Promise<UaeHsCodeResult>;
  getTariffByHsCode(hsCode: string): Promise<UaeHsCodeTariffInfo[]>;
} 