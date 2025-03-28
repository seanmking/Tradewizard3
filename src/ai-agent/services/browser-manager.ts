import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

interface BrowserInstance {
  browser: Browser;
  lastUsed: number;
  isAvailable: boolean;
}

export class BrowserManager {
  private static instance: BrowserManager;
  private browserPool: BrowserInstance[] = [];
  private maxPoolSize: number = 3;
  private maxBrowserAge: number = 1000 * 60 * 30; // 30 minutes
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupOldBrowsers(), 1000 * 60 * 5); // Every 5 minutes
  }

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async getBrowser(): Promise<Browser> {
    // Try to get an available browser from the pool
    const availableBrowser = this.browserPool.find(b => b.isAvailable);
    if (availableBrowser) {
      availableBrowser.lastUsed = Date.now();
      availableBrowser.isAvailable = false;
      return availableBrowser.browser;
    }

    // Create a new browser if pool isn't full
    if (this.browserPool.length < this.maxPoolSize) {
      const browser = await this.createBrowser();
      this.browserPool.push({
        browser,
        lastUsed: Date.now(),
        isAvailable: false
      });
      return browser;
    }

    // Wait for a browser to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const browser = this.browserPool.find(b => b.isAvailable);
        if (browser) {
          clearInterval(checkInterval);
          browser.lastUsed = Date.now();
          browser.isAvailable = false;
          resolve(browser.browser);
        }
      }, 1000);
    });
  }

  public async releaseBrowser(browser: Browser): Promise<void> {
    const instance = this.browserPool.find(b => b.browser === browser);
    if (instance) {
      instance.isAvailable = true;
      instance.lastUsed = Date.now();
    }
  }

  private async createBrowser(): Promise<Browser> {
    return await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      timeout: 30000
    });
  }

  private async cleanupOldBrowsers(): Promise<void> {
    const now = Date.now();
    const browsersToRemove: Browser[] = [];

    this.browserPool = this.browserPool.filter(instance => {
      const age = now - instance.lastUsed;
      if (age > this.maxBrowserAge) {
        browsersToRemove.push(instance.browser);
        return false;
      }
      return true;
    });

    // Close old browsers
    await Promise.all(browsersToRemove.map(browser => browser.close()));
  }

  public async setupPage(page: Page): Promise<void> {
    // Set reasonable timeouts
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);

    // Setup request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Setup error handling
    page.on('error', error => {
      logger.error('Page error:', error);
    });

    page.on('pageerror', error => {
      logger.error('Page error:', error);
    });
  }

  public async cleanup(): Promise<void> {
    clearInterval(this.cleanupInterval);
    await Promise.all(this.browserPool.map(instance => instance.browser.close()));
    this.browserPool = [];
  }
} 