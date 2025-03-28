import axios from 'axios';
import type { Axios as AxiosInstance } from 'axios';
import cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '@/utils/logger';

interface ScrapingResult {
  content: string;
  method: 'axios-cheerio' | 'puppeteer';
  metadata: {
    statusCode?: number;
    contentType?: string;
    isJavaScriptHeavy?: boolean;
    processingTime: number;
  };
}

export class ScrapingService {
  private axiosInstance: AxiosInstance;
  private browser: Browser | null = null;
  
  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
  }
  
  /**
   * Main scraping method implementing tiered strategy
   */
  public async scrapeUrl(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      // Try Axios + Cheerio first
      const axiosResult = await this.scrapeWithAxios(url);
      
      // Check if content seems to require JavaScript
      if (this.requiresJavaScript(axiosResult.content)) {
        logger.info(`${url} appears to require JavaScript, falling back to Puppeteer`);
        return await this.scrapeWithPuppeteer(url);
      }
      
      return {
        content: axiosResult.content,
        method: 'axios-cheerio',
        metadata: {
          statusCode: axiosResult.statusCode,
          contentType: axiosResult.contentType,
          isJavaScriptHeavy: false,
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      logger.warn(`Axios+Cheerio scraping failed for ${url}, falling back to Puppeteer`);
      return await this.scrapeWithPuppeteer(url);
    }
  }
  
  /**
   * Scrape using Axios and Cheerio
   */
  private async scrapeWithAxios(url: string): Promise<{
    content: string;
    statusCode: number;
    contentType: string;
  }> {
    const response = await this.axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script tags and unnecessary elements
    $('script').remove();
    $('style').remove();
    $('meta').remove();
    $('link').remove();
    
    return {
      content: $.html(),
      statusCode: response.status,
      contentType: response.headers['content-type'] || ''
    };
  }
  
  /**
   * Scrape using Puppeteer
   */
  private async scrapeWithPuppeteer(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    const page = await this.browser.newPage();
    
    try {
      // Set a reasonable viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Enable request interception to block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Navigate and wait for content
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000); // Additional wait for dynamic content
      
      // Get the rendered content
      const content = await page.content();
      
      return {
        content,
        method: 'puppeteer',
        metadata: {
          isJavaScriptHeavy: true,
          processingTime: Date.now() - startTime
        }
      };
    } finally {
      await page.close();
    }
  }
  
  /**
   * Check if content likely requires JavaScript
   */
  private requiresJavaScript(content: string): boolean {
    const $ = cheerio.load(content);
    
    // Check for common JavaScript framework markers
    const hasReactMarkers = $('#root').length > 0 || $('[data-reactroot]').length > 0;
    const hasAngularMarkers = $('[ng-app]').length > 0 || $('[ng-controller]').length > 0;
    const hasVueMarkers = $('[v-app]').length > 0 || $('[v-cloak]').length > 0;
    
    // Check for empty important containers
    const hasEmptyContainers = $('div:empty').length > 5;
    
    // Check for loading indicators
    const hasLoadingIndicators = $(':contains("Loading...")').length > 0;
    
    return hasReactMarkers || hasAngularMarkers || hasVueMarkers || 
           hasEmptyContainers || hasLoadingIndicators;
  }
  
  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
} 