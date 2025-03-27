import { NextResponse } from 'next/server';
import { WebsiteAnalyzerService } from '@/ai-agent/services/website-analyzer-simple.service';
import axios from 'axios';

// Simple parser function to extract text from HTML without cheerio
function extractTextBetweenTags(html: string, startTag: string, endTag: string): string[] {
  const results: string[] = [];
  let startIndex = 0;
  
  while (true) {
    const startPos = html.indexOf(startTag, startIndex);
    if (startPos === -1) break;
    
    const contentStart = startPos + startTag.length;
    const endPos = html.indexOf(endTag, contentStart);
    if (endPos === -1) break;
    
    const content = html.substring(contentStart, endPos).trim();
    if (content) results.push(content);
    
    startIndex = endPos + endTag.length;
  }
  
  return results;
}

// This will run only on the server
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    const analyzerService = new WebsiteAnalyzerService();
    
    // Set a timeout for the analysis
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Website analysis timed out')), 30000);
    });
    
    // Analyze the website with timeout
    const analysisPromise = analyzerService.analyzeWebsite(url);
    
    // Race between the analysis and the timeout
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error extracting website data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract website data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function extractWithAxios(url: string): Promise<string> {
  try {
    // Add protocol if missing
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = `https://${url}`;
      console.log(`Adding https:// protocol to URL: ${processedUrl}`);
    }
    
    // Validate URL format
    try {
      new URL(processedUrl);
    } catch (urlError) {
      throw new Error(`Invalid website URL format: ${url}`);
    }
    
    const response = await axios.get(processedUrl, {
      timeout: 15000, // 15 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.data as string;
  } catch (error) {
    console.error('Error extracting with Axios:', error);
    throw new Error(`Failed to extract content from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function extractContentFromHtml(html: string, sourceUrl: string) {
  // Remove script and style tags crudely
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Extract business name from title
  const titleMatches = extractTextBetweenTags(cleanHtml, '<title>', '</title>');
  const businessName = titleMatches[0] || 'Unknown Business';
  
  // Extract description from meta tags
  const descriptionRegex = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i;
  const descMatch = cleanHtml.match(descriptionRegex);
  const description = descMatch ? descMatch[1] : '';
  
  // Extract emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = cleanHtml.match(emailRegex) || [];
  
  // Extract phone numbers
  const phoneRegex = /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
  const phones = cleanHtml.match(phoneRegex) || [];
  
  // Extract h1, h2, h3 headings for potential products
  const h1s = extractTextBetweenTags(cleanHtml, '<h1', '</h1>').map(text => text.replace(/^[^>]*>/, ''));
  const h2s = extractTextBetweenTags(cleanHtml, '<h2', '</h2>').map(text => text.replace(/^[^>]*>/, ''));
  const h3s = extractTextBetweenTags(cleanHtml, '<h3', '</h3>').map(text => text.replace(/^[^>]*>/, ''));
  
  // Detect industry based on keywords
  const pageText = cleanHtml.toLowerCase();
  let industry = 'Other';
  
  if (pageText.includes('retail') || pageText.includes('shop') || pageText.includes('store')) {
    industry = 'Retail';
  } else if (pageText.includes('software') || pageText.includes('technology') || pageText.includes('digital')) {
    industry = 'Technology';
  } else if (pageText.includes('food') || pageText.includes('restaurant') || pageText.includes('catering')) {
    industry = 'Food & Beverage';
  } else if (pageText.includes('consult') || pageText.includes('advice') || pageText.includes('service')) {
    industry = 'Professional Services';
  } else if (pageText.includes('manufacture') || pageText.includes('factory') || pageText.includes('production')) {
    industry = 'Manufacturing';
  }
  
  // Create products from h2/h3 headings
  const products = [...h2s, ...h3s]
    .filter(text => text && text.length > 3 && text.length < 100)
    .slice(0, 5)
    .map(name => ({
      name,
      description: '',
      category: '',
      specifications: {}
    }));
    
  // Extract a simple address
  const addressRegex = /\d+\s+[A-Za-z0-9\s,]+(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Dr|Rd|Blvd|Ln|St)\.?(?:\s+[A-Za-z]+)?(?:\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/i;
  const addressMatch = cleanHtml.match(addressRegex);
  const location = addressMatch ? addressMatch[0] : '';

  return {
    businessName,
    description,
    contactInfo: {
      email: emails[0] || '',
      phone: phones[0] || '',
      address: location
    },
    products,
    industry,
    location
  };
} 