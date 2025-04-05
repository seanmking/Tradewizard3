interface HsClassificationResult {
  hsCode: string;
  description: string;
  confidence: number;
}

export interface UaeRegulation {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements: string[];
  url: string;
  effectiveDate: string;
  applicableEmirates: string[];
}

export interface UaeCertification {
  id: string;
  name: string;
  description: string;
  issuingAuthority: string;
  requirements: string[];
  applicationProcess: string;
  estimatedTimeframe: string;
  estimatedCost: string;
  url: string;
  validityPeriod: string;
}

export interface UaeRestriction {
  type: 'prohibition' | 'restriction' | 'license' | 'quota';
  description: string;
  details: string;
  exceptions: string[];
  url: string;
  applicableFreeZones: boolean;
}

export interface UaeFreeZoneRequirement {
  freeZoneName: string;
  additionalRequirements: string[];
  exemptions: string[];
  url: string;
}

export interface UaeComplianceRequirement {
  hsCode: string;
  regulations: UaeRegulation[];
  certifications: UaeCertification[];
  restrictions: UaeRestriction[];
  freeZoneRequirements: UaeFreeZoneRequirement[];
  generalNotes: string[];
  lastUpdated: string;
}

export interface UaeComplianceResult {
  requirements: UaeComplianceRequirement[];
  query: string;
  timestamp: string;
  globalClassification?: HsClassificationResult;
}

export interface UaeComplianceMCP {
  getComplianceRequirements(productDescription: string): Promise<UaeComplianceResult>;
  getComplianceByHsCode(hsCode: string): Promise<UaeComplianceRequirement[]>;
  getFreeZoneRequirements(hsCode: string, freeZone: string): Promise<UaeFreeZoneRequirement | null>;
} 