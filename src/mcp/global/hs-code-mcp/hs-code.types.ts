import { ClassificationResult } from '@/services/classification/embeddingService';

/**
 * HS Code Classification Types
 */

/**
 * Result of a classification request
 */
export interface HsClassificationResult {
  classifications: ClassificationMatch[];
  query: string;
  timestamp: string;
}

/**
 * Individual classification match
 */
export interface ClassificationMatch {
  hsCode: string;
  description: string;
  confidence: number;
  source?: string;
  metadata?: {
    chapter: {
      code: string;
      name: string;
      description: string;
    };
    heading: {
      code: string;
      name: string;
      description: string;
    };
    subheading: {
      code: string;
      name: string;
      description: string;
    };
    examples?: ProductExample[];
  };
}

/**
 * Product example for a specific HS code
 */
export interface ProductExample {
  name: string;
  description: string;
  hsCode?: string;
  imageUrl?: string | null;
}

/**
 * HS Code chapter (2-digit)
 */
export interface HSChapter {
  code: string;
  name: string;
  description: string;
}

/**
 * HS Code heading (4-digit)
 */
export interface HSHeading {
  code: string;
  name: string;
  description: string;
}

/**
 * HS Code subheading (6-digit)
 */
export interface HSSubheading {
  code: string;
  name: string;
  description: string;
}

/**
 * HS Code hierarchy structure
 */
export interface HSCodeHierarchy {
  chapters: HSChapter[];
  headings: Record<string, HSHeading[]>;
  subheadings: Record<string, HSSubheading[]>;
}

/**
 * Item in an HS code path
 */
export interface HSCodePathItem {
  code: string;
  name: string;
  level: 'chapter' | 'heading' | 'subheading';
}

/**
 * Path through HS code hierarchy
 */
export interface HSCodePath {
  path: HSCodePathItem[];
}

/**
 * Search result extending ClassificationMatch
 */
export interface SearchResult extends ClassificationMatch {
  relevance: number;
  tags?: string[];
}

/**
 * Classification option for UI
 */
export interface ClassificationOption {
  code: string;
  name: string;
  description: string;
  confidence: number;
  isRecommended?: boolean;
}

/**
 * Focus area (product category)
 */
export interface FocusArea {
  code: string;
  name: string;
}

/**
 * Classification request parameters
 */
export interface HsClassificationRequest {
  productDescription: string;
  confidenceThreshold?: number;
  maxResults?: number;
  useCache?: boolean;
  filterOptions?: {
    focusArea?: string;
    excludeCodes?: string[];
    preferredSources?: string[];
  };
} 