import { ProductCategory } from './product-categories.types';

export type ClassificationStatus = 
  | 'idle' 
  | 'classifying' 
  | 'reviewing' 
  | 'needs_review' 
  | 'error' 
  | 'complete';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Base interface for all HS code levels
export interface HSCodeBase {
  code: string;
  description: string;
  confidence: number;
  examples?: string[];
  searchTerms?: string[];
}

// Chapter (2-digit) level
export interface HSChapter extends HSCodeBase {
  level: 'chapter';
  headings: HSHeading[];
}

// Heading (4-digit) level
export interface HSHeading extends HSCodeBase {
  level: 'heading';
  parentChapter: string;
  subheadings: HSSubheading[];
}

// Subheading (6-digit) level
export interface HSSubheading extends HSCodeBase {
  level: 'subheading';
  parentHeading: string;
}

// Updated HSCode type to support hierarchical structure
export type HSCode = HSChapter | HSHeading | HSSubheading;

export interface ClassificationResult {
  chapter: HSChapter;
  selectedHeading?: HSHeading;
  selectedSubheading?: HSSubheading;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  needsReview: boolean;
  alternatives?: HSCode[];
  errorType?: ClassificationErrorType;
  errorMessage?: string;
}

export interface ClassificationMetrics {
  responseTime: number;
  confidenceScore: number;
  userCorrected: boolean;
  originalClassification?: string;
  finalClassification: string;
}

export type ClassificationErrorType = 
  | 'no_match_found'
  | 'low_confidence'
  | 'service_error'
  | 'invalid_input'
  | 'needs_human_review';

// State for tracking classification progress
export interface ClassificationProgress {
  selectedChapter?: HSChapter;
  selectedHeading?: HSHeading;
  selectedSubheading?: HSSubheading;
  status: ClassificationStatus;
  confidence: number;
}

// Updated ClassificationState to support hierarchical data
export interface ClassificationState {
  chapters: Record<string, HSChapter>;
  progress: ClassificationProgress;
  history: ClassificationResult[];
  metrics: ClassificationMetrics[];
  error?: {
    type: ClassificationErrorType;
    message: string;
    suggestions?: HSCode[];
  };
}

export interface ClassificationFilters {
  category?: ProductCategory['id'];
  confidenceLevel?: ConfidenceLevel;
  searchTerm?: string;
}

// Migration interfaces for backward compatibility
export interface LegacyClassification {
  categoryId: string;
  subcategoryId: string;
  hsCode?: string;
}

export interface MigrationResult {
  success: boolean;
  newClassification?: ClassificationResult;
  error?: string;
} 