/**
 * Types for the intelligence services
 */

export interface Entity {
  type: string;
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
  entityTypes: string[];
}

export interface ContentAnalysisResponse {
  entities: Entity[];
  sentimentScore?: number;
  languageDetected?: string;
  summary?: string;
  processedAt: Date;
} 