import { NextRequest, NextResponse } from 'next/server';
import { MarketIntelligenceMCPService } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.service';
import { logger } from '@/utils/logger';

const marketIntelligenceMCP = new MarketIntelligenceMCPService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketCode, productCategories, businessProfile } = body;

    if (!marketCode || !productCategories || !Array.isArray(productCategories)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    logger.info(`Fetching market intelligence for market: ${marketCode}, categories: ${productCategories.join(', ')}`);

    const marketIntelligence = await marketIntelligenceMCP.getMarketInsights({
      productCategories: [productCategories].flat(),
      targetMarkets: [marketCode],
      businessProfile
    });

    logger.info('Successfully retrieved market intelligence data');

    return NextResponse.json({
      success: true,
      data: marketIntelligence
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in market intelligence API: ${errorMessage}`);
    
    return NextResponse.json({ 
      success: false,
      error: 'Error fetching market data',
      details: errorMessage
    }, { 
      status: 500 
    });
  }
} 