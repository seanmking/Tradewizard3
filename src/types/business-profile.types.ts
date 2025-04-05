export interface Product {
  name: string;
  description?: string;
  category?: string;
  specifications?: Record<string, string>;
}

export interface BusinessContact {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface BusinessAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface BusinessFinancials {
  annualRevenue?: number;
  currency?: string;
  employeeCount?: number;
  foundingYear?: number;
}

export interface ExportExperience {
  hasExported: boolean;
  previousMarkets?: string[];
  exportVolume?: number;
  exportCurrency?: string;
  previousChallenges?: string[];
}

export interface SupplyChain {
  currentSuppliers?: string[];
  logisticsPartners?: string[];
  warehouseLocations?: string[];
  distributionChannels?: string[];
}

export interface BusinessProfile {
  id: string;
  companyName: string;
  companyDescription?: string;
  website?: string;
  industry: string[];
  productCategories: string[];
  primaryContact: BusinessContact;
  address: BusinessAddress;
  financials?: BusinessFinancials;
  exportExperience?: ExportExperience;
  supplyChain?: SupplyChain;
  certifications?: string[];
  targetMarkets?: string[];
  businessObjectives?: string[];
} 