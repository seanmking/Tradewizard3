/**
 * Types for the intelligence services
 */

export type EntityType = 'business' | 'product' | 'location' | 'contact' | 'person' | 'service';

export interface Entity {
  type: EntityType;
  name: string;
  attributes: Record<string, any>;
  rawText: string;
  confidence: number;
  sourceSection?: string;
  sourcePage?: string;
}

export interface ContentAnalysisRequest {
  content: string;
  sourceUrl: string;
  sourceType: string;
  entityTypes: EntityType[];
}

export interface ContentAnalysisResponse {
  entities: Entity[];
  sentimentScore?: number;
  languageDetected?: string;
  summary?: string;
  processedAt: Date;
  confidence?: number;
}

export interface AnalyzedEntity extends Entity {
  verified?: boolean;
  needsReview?: boolean;
  suggestedCategories?: string[];
}

export interface ClassificationResult {
  hsCode: string;
  confidence: number;
  category: string;
  subcategory?: string;
}

export interface EntityClassification {
  type: EntityType;
  category: string;
  subcategory?: string;
  confidence: number;
}

export interface TextContext {
  before: string;
  after: string;
  section: string;
  page: string;
} 