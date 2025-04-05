import { NextRequest, NextResponse } from 'next/server';
import { WebsiteAnalyzerService } from '@/services/website-analyzer.service';
import { logger } from '@/utils/logger';

/**
 * Validate and format URL
 * 
 * @param url URL to validate and format
 * @returns Formatted URL or null if invalid
 */
function validateAndFormatUrl(url: string): string | null {
  // Trim whitespace
  let formattedUrl = url.trim();
  
  // Check if URL is empty
  if (!formattedUrl) {
    return null;
  }
  
  // Add protocol if missing
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }
  
  // Validate URL format
  try {
    new URL(formattedUrl);
    return formattedUrl;
  } catch (error) {
    return null;
  }
}

/**
 * API route handler for extracting business information from a website
 * 
 * @param req The incoming request object
 * @returns NextResponse with extracted business profile or error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Validate and format the URL
    const formattedUrl = validateAndFormatUrl(url);
    
    if (!formattedUrl) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please enter a valid website address.' },
        { status: 400 }
      );
    }
    
    logger.info(`Received website extraction request for URL: ${formattedUrl}`);
    
    const websiteAnalyzer = new WebsiteAnalyzerService();
    const businessProfile = await websiteAnalyzer.extractBusinessInfo(formattedUrl);
    
    logger.info(`Successfully extracted business profile for ${businessProfile.name}`);
    
    return NextResponse.json({
      success: true,
      data: businessProfile
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error extracting website: ${errorMessage}`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract website information',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 