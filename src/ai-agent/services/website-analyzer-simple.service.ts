/**
 * WebsiteAnalyzerService
 * 
 * This service provides a simple interface for analyzing websites
 * and extracting business information and products.
 */

import * as cheerio from 'cheerio';
import axios from 'axios';
import { BusinessProfile, Product } from '@/models/business-profile.model';

export class WebsiteAnalyzerService {
  /**
   * Analyze a website and extract business information and products
   * 
   * @param url The URL of the website to analyze
   * @returns A business profile with extracted information
   */
  public async analyzeWebsite(url: string): Promise<BusinessProfile> {
    // Validate and prepare the URL
    const processedUrl = this.prepareUrl(url);
    
    try {
      // Extract the HTML content
      const htmlContent = await this.fetchWebsiteContent(processedUrl);
      
      // Extract business info and products
      const businessProfile = this.extractBusinessInfo(htmlContent, processedUrl);
      
      return businessProfile;
    } catch (error) {
      console.error(`Error analyzing website ${url}:`, error);
      throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Prepare and validate a URL for extraction
   * 
   * @param url The input URL
   * @returns A processed URL with protocol
   */
  private prepareUrl(url: string): string {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }
  
  /**
   * Fetch website content
   * 
   * @param url The URL to fetch
   * @returns The HTML content of the website
   */
  private async fetchWebsiteContent(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    return response.data as string;
  }
  
  /**
   * Extract business information and products from HTML content
   * 
   * @param html The HTML content of the website
   * @param url The source URL
   * @returns A business profile with extracted information
   */
  private extractBusinessInfo(html: string, url: string): BusinessProfile {
    const $ = cheerio.load(html);
    
    // Extract business name from title or h1
    const title = $('title').text().trim();
    const h1 = $('h1').first().text().trim();
    const businessName = h1 || title.split('|')[0].trim() || 'Unknown Business';
    
    // Extract description from meta tags or content
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const contentDescription = $('p').slice(0, 3).text().trim();
    const description = metaDescription || contentDescription;
    
    // Detect industry based on keywords
    const industry = this.detectIndustry($);
    
    // Extract products
    const products = this.extractProducts($);
    
    // Extract contact information
    const contactInfo = this.extractContactInfo($);
    
    // Extract location
    const location = this.extractLocation($);
    
    // Create and return the business profile
    return {
      name: businessName,
      description,
      industry,
      products,
      location,
      contactInfo,
      websiteUrl: url,
      extractedAt: new Date()
    };
  }
  
  /**
   * Detect the industry of a business based on keywords in the HTML
   * 
   * @param $ Cheerio instance loaded with HTML
   * @returns The detected industry
   */
  private detectIndustry($: cheerio.CheerioAPI): string {
    // Get text from high-priority elements first
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1Text = $('h1').text().toLowerCase();
    const titleText = $('title').text().toLowerCase();
    const headerText = $('header').text().toLowerCase();
    
    // Combine with more weight on important elements
    const pageText = `${metaDescription.repeat(3)} ${titleText.repeat(2)} ${h1Text.repeat(2)} ${headerText} ${$('body').text()}`.toLowerCase();
    
    const industryKeywords: Record<string, string[]> = {
      'Fashion & Apparel': ['fashion', 'clothing', 'apparel', 'wear', 'shoes', 'footwear', 'accessories', 'boutique', 'style', 'designer'],
      'Beauty & Cosmetics': ['beauty', 'cosmetics', 'makeup', 'skincare', 'hair', 'salon', 'spa', 'perfume', 'fragrance'],
      'Food & Beverage': ['food', 'restaurant', 'catering', 'beverage', 'cafe', 'coffee', 'drink', 'cuisine', 'menu', 'dining'],
      'Alcoholic Beverages': ['wine', 'liquor', 'spirits', 'beer', 'brewery', 'distillery', 'cocktail', 'alcohol', 'bar'],
      'Retail': ['retail', 'shop', 'store', 'ecommerce', 'buy', 'product', 'purchase', 'mall', 'outlet'],
      'Technology': ['software', 'technology', 'digital', 'app', 'tech', 'it', 'development', 'computer', 'online'],
      'Manufacturing': ['manufacture', 'factory', 'production', 'producer', 'industrial', 'supplier', 'wholesale'],
      'Healthcare': ['health', 'medical', 'doctor', 'clinic', 'patient', 'hospital', 'wellness', 'pharmacy'],
      'Finance': ['finance', 'bank', 'insurance', 'investment', 'loan', 'mortgage', 'trading', 'fintech'],
      'Education': ['education', 'school', 'university', 'course', 'learn', 'student', 'training', 'academy']
    };
    
    let detectedIndustry = 'Other';
    let maxScore = 0;
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        // Count occurrences and weight them
        const count = (pageText.match(new RegExp(keyword, 'g')) || []).length;
        if (count > 0) {
          // Higher weight for keywords in meta, title, and h1
          if (metaDescription.includes(keyword)) score += 3;
          if (titleText.includes(keyword)) score += 2;
          if (h1Text.includes(keyword)) score += 2;
          // Regular weight for other occurrences
          score += count;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        detectedIndustry = industry;
      }
    }
    
    return detectedIndustry;
  }
  
  /**
   * Extract products from HTML content
   * 
   * @param $ Cheerio instance loaded with HTML
   * @returns An array of products
   */
  private extractProducts($: cheerio.CheerioAPI): Product[] {
    const products: Product[] = [];
    
    // Strategy 1: Look for product-specific markup
    $('[itemtype*="Product"], .product, .product-item').each((_, element) => {
      const $element = $(element);
      const name = $element.find('h2, h3, h4, .name, .title, [itemprop="name"]').first().text().trim();
      const description = $element.find('.description, [itemprop="description"], p').first().text().trim();
      const category = this.determineCategory(name, description);
      
      if (name) {
        products.push({
          id: `product-${products.length + 1}`,
          name,
          description,
          category,
          specifications: {}
        });
      }
    });
    
    // Strategy 2: Look for product lists
    $('.products, .product-list, .product-grid').find('li, .item').each((_, element) => {
      const $element = $(element);
      const name = $element.find('h2, h3, h4, .name, .title').first().text().trim();
      const description = $element.find('.description, p').first().text().trim();
      const category = this.determineCategory(name, description);
      
      if (name) {
        products.push({
          id: `product-${products.length + 1}`,
          name,
          description,
          category,
          specifications: {}
        });
      }
    });
    
    // Strategy 3: Look for product sections
    $('#products, #shop, section:contains("Products")').find('div, article').each((_, element) => {
      const $element = $(element);
      const name = $element.find('h2, h3, h4, .name, .title').first().text().trim();
      const description = $element.find('.description, p').first().text().trim();
      const category = this.determineCategory(name, description);
      
      if (name) {
        products.push({
          id: `product-${products.length + 1}`,
          name,
          description,
          category,
          specifications: {}
        });
      }
    });
    
    // Fallback: Extract from headings if no products found
    if (products.length === 0) {
      $('h2, h3').each((_, element) => {
        const $element = $(element);
        const name = $element.text().trim();
        const description = $element.next('p').text().trim();
        const category = this.determineCategory(name, description);
        
        if (name && name.length > 3 && name.length < 100) {
          products.push({
            id: `product-${products.length + 1}`,
            name,
            description,
            category,
            specifications: {}
          });
        }
      });
    }
    
    // Deduplicate products
    return Array.from(new Map(products.map(product => [product.name, product])).values());
  }
  
  /**
   * Determine the category of a product based on its name and description
   * 
   * @param name The product name
   * @param description The product description
   * @returns The determined category
   */
  private determineCategory(name: string, description: string): string {
    const text = `${name} ${description}`.toLowerCase();
    
    const categoryKeywords: Record<string, string[]> = {
      'Fashion & Apparel': [
        'dress', 'shirt', 'pants', 'clothing', 'apparel', 'wear', 'fashion', 'jacket',
        'shoes', 'boots', 'sneakers', 'footwear', 'sandals', 'heels', 'accessories',
        'handbag', 'purse', 'jewelry', 'watch', 'designer', 'boutique', 'collection'
      ],
      'Beauty & Cosmetics': [
        'beauty', 'cosmetic', 'makeup', 'skin', 'hair', 'care', 'perfume', 'fragrance',
        'lotion', 'cream', 'serum', 'lipstick', 'mascara', 'foundation', 'powder',
        'shampoo', 'conditioner', 'treatment', 'spa', 'salon'
      ],
      'Food & Beverage': [
        'food', 'snack', 'meal', 'drink', 'beverage', 'ingredient', 'recipe',
        'organic', 'natural', 'fresh', 'gourmet', 'cuisine', 'specialty'
      ],
      'Alcoholic Beverages': [
        'wine', 'liquor', 'spirit', 'beer', 'vodka', 'whiskey', 'gin', 'rum',
        'tequila', 'champagne', 'cocktail', 'brewery', 'distillery', 'vintage'
      ],
      'Home & Garden': [
        'home', 'garden', 'furniture', 'decor', 'kitchen', 'outdoor', 'indoor',
        'appliance', 'lighting', 'bedding', 'storage', 'tools'
      ],
      'Electronics': [
        'electronic', 'device', 'gadget', 'tech', 'computer', 'phone', 'smartphone',
        'laptop', 'tablet', 'camera', 'audio', 'video', 'gaming'
      ]
    };
    
    // Check for exact matches first
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    // If no exact match, check for partial matches
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => 
        text.split(' ').some(word => 
          word.includes(keyword) || keyword.includes(word)
        )
      )) {
        return category;
      }
    }
    
    return 'Uncategorized';
  }
  
  /**
   * Extract contact information from HTML content
   * 
   * @param $ Cheerio instance loaded with HTML
   * @returns Contact information object
   */
  private extractContactInfo($: cheerio.CheerioAPI): BusinessProfile['contactInfo'] {
    // Extract email addresses
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const bodyText = $('body').html() || '';
    const emails = bodyText.match(emailRegex) || [];
    
    // Extract phone numbers
    const phoneRegex = /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
    const phones = bodyText.match(phoneRegex) || [];
    
    // Extract social media
    const socialMedia: Record<string, string> = {};
    $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="instagram.com"], a[href*="linkedin.com"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        if (href.includes('facebook.com')) socialMedia.facebook = href;
        if (href.includes('twitter.com')) socialMedia.twitter = href;
        if (href.includes('instagram.com')) socialMedia.instagram = href;
        if (href.includes('linkedin.com')) socialMedia.linkedin = href;
      }
    });
    
    return {
      email: emails[0] || '',
      phone: phones[0] || '',
      socialMedia
    };
  }
  
  /**
   * Extract location information from HTML content
   * 
   * @param $ Cheerio instance loaded with HTML
   * @returns Location object
   */
  private extractLocation($: cheerio.CheerioAPI): BusinessProfile['location'] {
    // Extract address
    const addressRegex = /\d+\s+[A-Za-z0-9\s,]+(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Dr|Rd|Blvd|Ln|St)\.?(?:\s+[A-Za-z]+)?(?:\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/i;
    const bodyText = $('body').html() || '';
    const addressMatch = bodyText.match(addressRegex);
    const address = addressMatch ? addressMatch[0] : '';
    
    // Extract country and city
    let country = '';
    let city = '';
    
    // Look for structured location data
    $('[itemtype*="Place"], [itemtype*="Address"], [itemtype*="Organization"]').each((_, element) => {
      const $element = $(element);
      const foundCountry = $element.find('[itemprop="addressCountry"]').text().trim();
      const foundCity = $element.find('[itemprop="addressLocality"]').text().trim();
      
      if (foundCountry) country = foundCountry;
      if (foundCity) city = foundCity;
    });
    
    // Look for common country patterns if not found in structured data
    if (!country) {
      const commonCountries = ['USA', 'United States', 'Canada', 'UK', 'Australia', 'India', 'China'];
      for (const c of commonCountries) {
        if (bodyText.includes(c)) {
          country = c;
          break;
        }
      }
    }
    
    return {
      country,
      city,
      address
    };
  }
} 