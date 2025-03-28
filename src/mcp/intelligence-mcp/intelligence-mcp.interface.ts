import { ExtractedEntity } from '@/types/extraction';

export interface IntelligenceEnrichmentRequest {
  sourceUrl: string;
  extractedEntities: ExtractedEntity[];
  rawContent?: string;
}

export interface IntelligenceEnrichmentResponse {
  enrichedEntities: ExtractedEntity[];
  confidence: number;
  metadata: IntelligenceMetadata;
}

export interface IntelligenceMetadata {
  perplexityUsed: boolean;
  scrapingMethod: 'axios-cheerio' | 'puppeteer' | 'failed';
  validationScore: number;
  processingTime: number;
  enrichmentStatus: 'completed' | 'completed_with_suggestions' | 'failed' | 'needs_review';
}

export interface IntelligenceMCP {
  enrichBusinessData(request: IntelligenceEnrichmentRequest): Promise<IntelligenceEnrichmentResponse>;
} 