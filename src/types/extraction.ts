/**
 * Extraction Types
 * 
 * Type definitions for extraction results and entities.
 */

/**
 * The source of extracted information
 */
export type ExtractionSource = 'website' | 'pdf' | 'social' | 'api';

/**
 * The type of entity extracted
 */
export type EntityType = 'business' | 'product' | 'location' | 'contact' | 'person' | 'service' | 'metadata';

/**
 * Status of an extraction operation
 */
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

/**
 * An extracted entity with attributes and confidence score
 */
export interface ExtractedEntity {
  id: string;
  type: EntityType;
  name: string;
  value: string;  // The primary value of the entity (e.g., business name, product name, etc.)
  confidence: number;
  source: string;
  verified: boolean;
  userModified: boolean;
  createdAt: Date;
  updatedAt: Date;
  attributes: Record<string, any>;
}

/**
 * The result of an extraction operation
 */
export interface ExtractionResult {
  id: string;
  sourceUrl: string;
  sourceType: ExtractionSource;
  rawContent: string;
  extractedEntities: ExtractedEntity[];
  confidence: number;
  processingTime: number;
  status: ExtractionStatus;
  error?: string;
  qualityMetrics?: {
    extractionAttempts?: number;
    hasProducts?: boolean;
    hasBusiness?: boolean;
    partialExtraction?: boolean;
    errorType?: string;
    jsonParsed?: boolean;
    fallbackMode?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentAnalysisRequest {
  content: string;
  sourceUrl: string;
  sourceType: 'website';
  entityTypes: EntityType[];
}

export interface ContentAnalysisResponse {
  entities: {
    type: string;
    name: string;
    attributes: Record<string, any>;
    rawText: string;
    confidence: number;
    sourceSection: string;
    sourcePage: string;
  }[];
}

export interface ExtractionConfig {
  // Placeholder - will be replaced with actual types from original codebase
  useAI: boolean;
  depth: number;
  timeout: number;
} 