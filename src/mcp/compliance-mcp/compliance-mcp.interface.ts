import { BusinessProfile } from '../../types/business-profile.types';

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedTimelineInDays?: number;
  countryCode: string;
  regulatoryBody?: string;
  productCategories: string[];
  documentationNeeded?: string[];
}

export interface ComplianceMCPResponse {
  requirements: ComplianceRequirement[];
  totalEstimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  totalEstimatedTimelineInDays: number;
}

export interface ComplianceRequest {
  productCategories: string[];
  targetMarkets: string[];
  businessProfile: BusinessProfile;
}

export interface ComplianceMCP {
  getRequirements(request: ComplianceRequest): Promise<ComplianceMCPResponse>;
} 