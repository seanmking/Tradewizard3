/**
 * WebsiteExtractor
 * 
 * This class is responsible for extracting business information and products
 * from websites using Puppeteer for JavaScript-heavy sites and Cheerio for static sites.
 * It leverages AI-driven analysis to identify and classify entities rather than relying
 * solely on regex and DOM patterns.
 */

// Import only TypeScript types statically
import type { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import type { CheerioAPI, Element as CheerioElement, AnyNode } from 'cheerio';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { ExtractionResult, ExtractedEntity, EntityType, ExtractionSource } from '@/types/extraction';
import { IntelligenceService } from '@/ai-agent/services/intelligence-service';
import { ContentAnalysisRequest, ContentAnalysisResponse } from '@/types/intelligence';
import { StructuredData, ContentData, WebsiteAnalysisResult, ContactInfo, ContentSection } from '@/types/website-data';
import { BaseWebsiteExtractor } from '../extractors/base-website-extractor';

export class WebsiteExtractor extends BaseWebsiteExtractor {
  constructor() {
    super();
  }

  public async extract(url: string): Promise<ExtractedEntity[]> {
    try {
      const html = await this.isJavaScriptHeavy(url)
        ? await this.extractWithPuppeteer(url)
        : await this.extractWithCheerio(url);

      const cleanedHtml = this.cleanAndPreprocessHtml(html);
      const analysis = await this.analyzeContent(cleanedHtml);
      const entities = this.transformAnalysisToEntities(analysis, url);

      await this.cleanupBrowser();
      return entities;
    } catch (error) {
      logger.error('Error extracting website content:', error);
      await this.cleanupBrowser();
      throw error;
    }
  }

  protected async isJavaScriptHeavy(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      return contentType.includes('javascript') || contentType.includes('html');
    } catch (error) {
      logger.warn('Error checking content type, defaulting to JavaScript-heavy:', error);
      return true;
    }
  }

  protected async analyzeContent(html: string): Promise<any> {
    // TODO: Implement content analysis
    return {};
  }

  protected transformAnalysisToEntities(analysis: any, url: string): ExtractedEntity[] {
    const now = new Date();
    return [{
      id: this.generateEntityId(this.generateExtractionId(), 0),
      type: 'business' as EntityType,
      name: 'Unknown Business',
      value: '',
      confidence: 0.5,
      source: url,
      verified: false,
      userModified: false,
      createdAt: now,
      updatedAt: now,
      attributes: {
        ...analysis,
        extractedAt: now.toISOString()
      }
    }];
  }

  protected generateExtractionId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  protected generateEntityId(extractionId: string, index: number): string {
    return `${extractionId}_entity_${index}`;
  }
}
