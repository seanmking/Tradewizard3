export interface ProductCategory {
  id: string;
  name: string;
  subcategories: ProductSubcategory[];
  hsCodePrefix: string;
}

export interface ProductSubcategory {
  id: string;
  name: string;
  examples: string[];
  description: string;
  hsCode: string;
  requirements: SubcategoryRequirements;
}

export interface SubcategoryRequirements {
  certifications: string[];
  standards: string[];
  documentation: string[];
  regulatoryBodies: string[];
}

export interface ExportRequirement {
  category: string;
  documentType: string;
  documentation: string;
  responsibleEntity: string;
  onceOffRequirements: string | null;
  ongoingRequirements: string | null;
  directUrl: string | null;
}

// Enhanced Product interface with categorization
export interface EnhancedProduct {
  id: string;
  name: string;
  description: string;
  specifications?: Record<string, string>;
  isSelected: boolean;
  categoryId?: string;
  subcategoryId?: string;
  confidenceScore?: number;
  userVerified: boolean;
  storageType?: 'frozen' | 'chilled' | 'ambient';
  hsCode?: string;
  validationStatus: 'pending' | 'verified' | 'rejected';
  validationNotes?: string;
} 