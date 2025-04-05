import { BusinessProfile } from '../../types/business-profile.types';

export interface LabelingRequirements {
  nutritionLabelMandatory: boolean;
  requiredLanguages: string[];
  specializedLabels?: {
    type: string;
    required: boolean;
    details: string;
  }[];
  shelfLifeMonths?: number;
  ingredientRestrictions?: {
    hasBannedIngredients: boolean;
    bannedList?: string[];
  };
}

export interface MarketSpecificRequirements {
  halalCertificationMandatory: boolean;
  organicCertificationRequired: boolean;
  productTestingRequired: boolean;
  testingTypes?: string[];
  foodSafetyCertifications: string[];
}

export interface TariffAndTradeRequirements {
  tariffRatePercentage: number;
  hasQuotaRestrictions: boolean;
  quotaDetails?: string;
  hasProductBans: boolean;
  banDetails?: string;
}

export interface CustomsRequirements {
  exportHealthCertificateRequired: boolean;
  phytosanitaryCertificateRequired: boolean;
  preShipmentInspectionRequired: boolean;
  electronicFilingMandatory: boolean;
  additionalDocuments?: string[];
}

export interface ExporterRegistrationRequirements {
  sarsRegistrationRequired: boolean;
  itacPermitRequired: boolean;
  facilityCertificationRequired: boolean;
  haccp: {
    required: boolean;
    level?: string;
  };
  halal: {
    required: boolean;
    acceptedCertifiers?: string[];
  };
}

export interface MarketSpecificCompliance {
  countryCode: string;
  labeling: LabelingRequirements;
  marketRequirements: MarketSpecificRequirements;
  tariffAndTrade: TariffAndTradeRequirements;
  customs: CustomsRequirements;
}

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
  referenceUrl?: string;
  exporterRegistration?: ExporterRegistrationRequirements;
  marketSpecificCompliance?: MarketSpecificCompliance[];
  confidenceScore?: number;
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