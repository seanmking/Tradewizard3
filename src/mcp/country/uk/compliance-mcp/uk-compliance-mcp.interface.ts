import { HsClassificationResult } from '@/mcp/global/hs-code-mcp/hs-code-mcp.interface';

export interface UkRegulation {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements: string[];
  url: string;
  lastUpdated: string;
}

export interface UkCertification {
  id: string;
  name: string;
  description: string;
  issuingAuthority: string;
  requirements: string[];
  applicationProcess: string;
  estimatedTimeframe: string;
  estimatedCost: string;
  url: string;
}

export interface UkRestriction {
  type: 'prohibition' | 'restriction' | 'license' | 'quota';
  description: string;
  details: string;
  exceptions: string[];
  url: string;
}

export interface UkComplianceRequirement {
  hsCode: string;
  regulations: UkRegulation[];
  certifications: UkCertification[];
  restrictions: UkRestriction[];
  generalNotes: string[];
  lastUpdated: string;
}

export interface UkComplianceResult {
  requirements: UkComplianceRequirement[];
  query: string;
  timestamp: string;
  globalClassification?: HsClassificationResult;
}

export interface UkComplianceMCP {
  getComplianceRequirements(productDescription: string): Promise<UkComplianceResult>;
  getComplianceByHsCode(hsCode: string): Promise<UkComplianceRequirement[]>;
} 