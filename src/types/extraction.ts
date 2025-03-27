/**
 * Type definitions for extraction-related interfaces
 */

/**
 * The source of extracted information
 */
export type ExtractionSource = 'website' | 'instagram' | 'facebook' | 'document' | 'pdf' | 'linkedin';

/**
 * The type of entity extracted
 */
export type EntityType = 'business' | 'product' | 'location' | 'contact' | 'person' | 'service';

/**
 * Status of an extraction operation
 */
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * An extracted entity with attributes and confidence score
 */
export interface ExtractedEntity {
  id: string;
  type: EntityType;
  name: string;
  attributes: Record<string, any>;
  rawText: string;
  confidence: number;
  sourceSection?: string;
  sourcePage?: string;
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