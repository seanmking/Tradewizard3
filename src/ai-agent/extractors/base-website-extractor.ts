import type { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { StructuredData, ContentData, ContentSection, WebsiteAnalysisResult } from '@/types/website-data';
import { BrowserManager } from '../services/browser-manager';

interface ExtractionOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000
};

export abstract class BaseWebsiteExtractor {
  protected browser: Browser | null = null;
  protected browserManager: BrowserManager;

  constructor() {
    this.browserManager = BrowserManager.getInstance();
  }

  /**
   * Clean up browser resources
   */
  protected async cleanupBrowser(): Promise<void> {
    if (this.browser) {
      await this.browserManager.releaseBrowser(this.browser);
      this.browser = null;
    }
  }

  /**
   * Extract website content using Puppeteer with retry logic
   */
  protected async extractWithPuppeteer(url: string, options: ExtractionOptions = {}): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
      try {
        this.browser = await this.browserManager.getBrowser();
        const page = await this.browser.newPage();
        
        // Setup page configuration
        await this.browserManager.setupPage(page);
        
        // Navigate to the URL with timeout
        await Promise.race([
          page.goto(url, { waitUntil: 'networkidle2' }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Navigation timeout')), opts.timeout)
          )
        ]);
        
        // Wait for content
        await this.waitForContentToLoad(page);
        
        // Get the page content
        const content = await page.content();
        
        // Release the browser back to the pool
        await this.cleanupBrowser();
        
        return content;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Extraction attempt ${attempt} failed:`, error);
        
        // Release the browser on error
        await this.cleanupBrowser();
        
        // If this wasn't the last attempt, wait before retrying
        if (attempt < opts.maxRetries!) {
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        }
      }
    }

    throw new Error(`Failed to extract content after ${opts.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Extract website content using Cheerio with retry logic
   */
  protected async extractWithCheerio(url: string, options: ExtractionOptions = {}): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
      try {
        logger.info(`Attempting Cheerio extraction (attempt ${attempt}/${opts.maxRetries})`);
        
        const response = await axios.get<string>(url, {
          timeout: opts.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          validateStatus: (status) => status === 200
        });
        
        const html = response.data;
        if (!html || typeof html !== 'string') {
          throw new Error('Invalid HTML content received');
        }

        // Validate HTML content
        if (!html.includes('<html') && !html.includes('<body')) {
          throw new Error('Response does not contain valid HTML structure');
        }
        
        logger.info('Successfully retrieved HTML content with Cheerio');
        return html;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Cheerio extraction attempt ${attempt} failed:`, error);
        
        if (attempt < opts.maxRetries!) {
          logger.info(`Waiting ${opts.retryDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        }
      }
    }

    throw new Error(`Failed to extract content after ${opts.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Wait for important content to load on the page with timeout
   */
  protected async waitForContentToLoad(page: Page): Promise<void> {
    try {
      // Wait for common content selectors with timeout
      await Promise.race([
        page.waitForSelector('h1, h2, .content, #content, .products, .main', { timeout: 5000 }),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
    } catch (error) {
      logger.info('No common content selectors found, continuing with extraction');
    }
    
    // Additional waiting to ensure JavaScript execution completes
    await page.waitForTimeout(2000);
  }

  /**
   * Clean and preprocess HTML content for analysis
   */
  protected cleanAndPreprocessHtml(html: string): string {
    try {
      if (!html || typeof html !== 'string') {
        throw new Error('Invalid HTML input received for preprocessing');
      }

      logger.info('Loading HTML content with Cheerio');
      const $ = cheerio.load(html, {
        normalizeWhitespace: true,
        decodeEntities: true
      });
      
      if (!$('body').length) {
        throw new Error('No body tag found in HTML content');
      }
      
      logger.info('Removing unnecessary tags');
      // Remove script and style tags
      $('script, style, iframe, noscript').remove();
      
      logger.info('Extracting structured data');
      // Extract structured data if available
      const structuredData = this.extractStructuredData($);
      
      logger.info('Extracting main content');
      // Extract main content
      const mainContent = this.extractMainContent($);
      
      // Combine structured data and main content
      const analysisResult: WebsiteAnalysisResult = {
        structuredData,
        mainContent,
        products: [],
        contactInfo: {},
        metadata: {
          title: $('title').text().trim() || '',
          description: $('meta[name="description"]').attr('content') || '',
          url: $('link[rel="canonical"]').attr('href') || ''
        }
      };
      
      logger.info('Successfully preprocessed HTML content');
      return JSON.stringify(analysisResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error preprocessing HTML:', errorMessage);
      throw new Error(`Failed to preprocess HTML content: ${errorMessage}`);
    }
  }

  /**
   * Extract structured data from the page
   */
  protected extractStructuredData($: cheerio.Root): StructuredData[] {
    const structuredData: StructuredData[] = [];
    
    $('script[type="application/ld+json"]').each((index: number, element: cheerio.Element) => {
      try {
        const content = $(element).html();
        if (content) {
          const data = JSON.parse(content);
          structuredData.push({
            type: 'json-ld',
            data,
            source: 'structured-data',
            confidence: 1.0
          });
        }
      } catch (error) {
        logger.warn('Failed to parse structured data:', error);
      }
    });
    
    return structuredData;
  }

  /**
   * Extract main content from the page
   */
  protected extractMainContent($: cheerio.Root): ContentData {
    const mainContent: ContentData = {
      mainText: '',
      sections: [],
      metadata: {}
    };
    
    const mainSelectors = ['main', 'article', '.main-content', '#main-content'];
    let mainContainer = $('body');
    
    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        mainContainer = element;
        break;
      }
    }
    
    mainContainer.find('p').each((index: number, element: cheerio.Element) => {
      const text = $(element).text().trim();
      if (text) {
        mainContent.mainText += text + '\n';
      }
    });
    
    mainContainer.find('section, div > h2, div > h3').each((index: number, element: cheerio.Element) => {
      const $section = $(element);
      const heading = $section.find('h2, h3').first().text().trim();
      const content = $section.text().trim();
      
      if (content) {
        mainContent.sections.push({
          heading,
          content,
          type: this.determineSectionType(content)
        });
      }
    });
    
    return mainContent;
  }

  /**
   * Determine the type of a content section
   */
  protected determineSectionType(content: string): ContentData['sections'][number]['type'] {
    if (content.toLowerCase().includes('contact') || content.match(/phone|email|address/i)) {
      return 'contact';
    }
    if (content.toLowerCase().includes('about us') || content.match(/company|history|mission/i)) {
      return 'about';
    }
    if (content.match(/\$|price|buy|shop|product/i)) {
      return 'product';
    }
    return 'text';
  }
} 