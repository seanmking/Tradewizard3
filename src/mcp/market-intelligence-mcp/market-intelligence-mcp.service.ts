import {
  MarketIntelligenceMCP,
  MarketIntelligenceRequest,
  MarketInsight,
  MarketSize,
  Competitor,
  TariffInfo
} from './market-intelligence-mcp.interface';
import axios from 'axios';
import { logger } from '@/utils/logger';

export class MarketIntelligenceMCPService implements MarketIntelligenceMCP {
  private dataSourceUrls: Record<string, string>;
  private apiKeys: Record<string, string>;
  
  constructor() {
    // Initialize data source URLs
    this.dataSourceUrls = {
      marketData: process.env.MARKET_DATA_API_URL || 'https://api.trademap.org/api/v1/markets',
      tariffData: process.env.TARIFF_API_URL || 'https://api.macmap.org/api/v1/tariffs',
      competitorData: process.env.COMPETITOR_API_URL || 'https://api.exportpotential.org/api/v1/competitors',
      unComtrade: 'https://comtrade.un.org/api/get',
      perplexity: 'https://api.perplexity.ai'
    };
    
    // Initialize API keys
    this.apiKeys = {
      unComtrade: process.env.UN_COMTRADE_API_KEY || '',
      perplexity: process.env.PERPLEXITY_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || ''
    };
    
    logger.info('MarketIntelligenceMCPService initialized');
    if (!this.apiKeys.unComtrade) {
      logger.warn('UN Comtrade API key not found in environment variables');
    }
    if (!this.apiKeys.perplexity) {
      logger.warn('Perplexity API key not found in environment variables');
    }
    if (!this.apiKeys.openai) {
      logger.warn('OpenAI API key not found in environment variables');
    }
  }
  
  async getMarketInsights(request: MarketIntelligenceRequest): Promise<Record<string, MarketInsight>> {
    try {
      logger.info(`Getting market insights for ${request.productCategories.join(', ')} in markets ${request.targetMarkets.join(', ')}`);
      
      const marketInsights: Record<string, MarketInsight> = {};
      
      // Process each target market
      for (const marketCode of request.targetMarkets) {
        const marketInsight = await this.fetchMarketInsight(
          marketCode,
          request.productCategories,
          request.businessProfile
        );
        
        marketInsights[marketCode] = marketInsight;
      }
      
      return marketInsights;
      
    } catch (error) {
      logger.error(`Error in MarketIntelligenceMCPService.getMarketInsights: ${error}`);
      throw new Error('Failed to get market insights');
    }
  }
  
  private async fetchMarketInsight(
    marketCode: string,
    productCategories: string[],
    businessProfile: any
  ): Promise<MarketInsight> {
    try {
      // In a real implementation, this would call various APIs to gather market data
      // For now, we'll use a mock implementation that returns realistic insights
      
      // Get market size data
      const marketSize = await this.fetchMarketSize(marketCode, productCategories);
      
      // Get competitor data
      const topCompetitors = await this.fetchTopCompetitors(marketCode, productCategories);
      
      // Get entry barriers
      const entryBarriers = await this.fetchEntryBarriers(marketCode, productCategories);
      
      // Get tariff information
      const tariffs = await this.fetchTariffInfo(marketCode, productCategories);
      
      // Generate opportunities, risks, and recommendations
      const opportunities = await this.generateOpportunities(marketCode, productCategories, marketSize, topCompetitors);
      const risks = this.generateRisks(marketCode, productCategories, entryBarriers, tariffs);
      const recommendations = this.generateRecommendations(
        marketCode, 
        productCategories, 
        businessProfile, 
        marketSize,
        topCompetitors,
        entryBarriers,
        tariffs
      );
      
      return {
        marketSize,
        topCompetitors,
        entryBarriers,
        tariffs,
        opportunities,
        risks,
        recommendations
      };
      
    } catch (error) {
      logger.error(`Error fetching market insight for ${marketCode}: ${error}`);
      throw error;
    }
  }
  
  private async fetchMarketSize(marketCode: string, productCategories: string[]): Promise<MarketSize> {
    try {
      // Check if we have the UN Comtrade API key for real data
      if (this.apiKeys.unComtrade) {
        try {
          // Use UN Comtrade API to get real market size data
          logger.info(`Fetching real market data from UN Comtrade for ${marketCode}`);
          const hsCode = this.getHSCodeForProductCategory(productCategories[0]);
          
          const response = await axios.get(this.dataSourceUrls.unComtrade, {
            params: {
              max: 5000,
              type: 'C',
              freq: 'A',
              px: 'HS',
              ps: new Date().getFullYear() - 1, // Previous year data
              r: marketCode,
              p: 'all', // All partner countries
              rg: '1', // Imports
              cc: hsCode,
              fmt: 'json',
              token: this.apiKeys.unComtrade
            }
          });
          
          // Type check for dataset property
          const responseData = response.data as any;
          if (responseData && responseData.dataset && Array.isArray(responseData.dataset)) {
            // Sum up the values from the dataset
            const totalValue = responseData.dataset.reduce((sum: number, record: any) => sum + (record.TradeValue || 0), 0);
            
            return {
              value: totalValue,
              currency: 'USD',
              year: new Date().getFullYear() - 1,
              growthRate: this.getMarketGrowthRate(marketCode)
            };
          }
        } catch (apiError) {
          logger.error(`Error accessing UN Comtrade API: ${apiError}`);
          // Fall back to mock data
        }
      }
      
      // Fallback to mock data
      const baseValue = this.getBaseMarketValue(marketCode);
      const growthRate = this.getMarketGrowthRate(marketCode);
      
      return {
        value: baseValue,
        currency: 'USD',
        year: new Date().getFullYear(),
        growthRate
      };
      
    } catch (error) {
      logger.error(`Error fetching market size for ${marketCode}: ${error}`);
      return {
        value: 0,
        currency: 'USD',
        year: new Date().getFullYear()
      };
    }
  }
  
  private getBaseMarketValue(marketCode: string): number {
    // Return different market values based on the market code
    const marketSizes: Record<string, number> = {
      'US': 5000000000, // $5B
      'CN': 4000000000, // $4B
      'DE': 2500000000, // $2.5B
      'UK': 2000000000, // $2B
      'FR': 1800000000, // $1.8B
      'JP': 1500000000, // $1.5B
      'CA': 1200000000, // $1.2B
      'AU': 900000000,  // $900M
      'BR': 700000000,  // $700M
      'IN': 600000000   // $600M
    };
    
    return marketSizes[marketCode] || 500000000; // Default $500M for unlisted markets
  }
  
  private getMarketGrowthRate(marketCode: string): number {
    // Return different growth rates based on the market code
    const growthRates: Record<string, number> = {
      'US': 2.5,
      'CN': 5.5,
      'DE': 1.8,
      'UK': 2.0,
      'FR': 1.5,
      'JP': 1.0,
      'CA': 2.2,
      'AU': 2.5,
      'BR': 3.5,
      'IN': 6.0
    };
    
    return growthRates[marketCode] || 2.0; // Default 2% for unlisted markets
  }
  
  private async fetchTopCompetitors(marketCode: string, productCategories: string[]): Promise<Competitor[]> {
    try {
      // Try to use Perplexity API for enriched data if available
      if (this.apiKeys.perplexity) {
        try {
          logger.info(`Fetching enriched competitor data from Perplexity for ${marketCode} and ${productCategories[0]}`);
          
          const prompt = `List the top 5 competitors in the ${productCategories[0]} industry in ${this.getCountryName(marketCode)}. 
          For each competitor, provide: 
          1. Company name
          2. Estimated market share percentage
          3. Country of origin
          4. 3 key strengths
          5. 2 key weaknesses
          Format as JSON array with properties: name, marketShare, country, strengths (array), weaknesses (array)`;
          
          const response = await axios.post('https://api.perplexity.ai/chat/completions', {
            model: 'llama-3-sonar-small-32k-online',
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant that provides accurate market intelligence data in JSON format.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1024
          }, {
            headers: {
              'Authorization': `Bearer ${this.apiKeys.perplexity}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Properly type the API response
          const responseData = response.data as any;
          if (responseData && responseData.choices && responseData.choices.length > 0) {
            const content = responseData.choices[0].message.content;
            // Extract JSON from the response
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\[([\s\S]*?)\]/);
            
            if (jsonMatch) {
              try {
                const competitors = JSON.parse(jsonMatch[0]);
                if (Array.isArray(competitors) && competitors.length > 0) {
                  logger.info(`Successfully retrieved competitor data from Perplexity API`);
                  return competitors;
                }
              } catch (parseError) {
                logger.error(`Error parsing Perplexity API response: ${parseError}`);
              }
            }
          }
        } catch (apiError) {
          logger.error(`Error accessing Perplexity API: ${apiError}`);
          // Fall back to mock data
        }
      }
      
      // Default competitors for most markets
      const defaultCompetitors: Competitor[] = [
        {
          name: 'Global Leader Corp',
          marketShare: 15.5,
          country: 'US',
          strengths: ['Brand recognition', 'Distribution network', 'Product quality'],
          weaknesses: ['Premium pricing', 'Limited customization']
        },
        {
          name: 'Regional Champion Ltd',
          marketShare: 12.2,
          country: marketCode,
          strengths: ['Local market knowledge', 'Government relationships', 'Competitive pricing'],
          weaknesses: ['Limited global presence', 'Smaller product range']
        },
        {
          name: 'Innovative Startups Inc',
          marketShare: 8.7,
          country: 'Various',
          strengths: ['Cutting-edge technology', 'Agility', 'Niche focus'],
          weaknesses: ['Limited scale', 'Brand awareness', 'Distribution reach']
        }
      ];
      
      // Add country-specific competitors for major markets
      if (marketCode === 'US') {
        defaultCompetitors.push({
          name: 'American Industries Corp',
          marketShare: 9.8,
          country: 'US',
          strengths: ['Made in USA branding', 'Extensive distribution', 'Customer service'],
          weaknesses: ['Higher costs', 'Limited international experience']
        });
      } else if (marketCode === 'CN') {
        defaultCompetitors.push({
          name: 'China Manufacturing Group',
          marketShare: 14.2,
          country: 'CN',
          strengths: ['Scale economies', 'Integrated supply chain', 'Cost advantage'],
          weaknesses: ['Quality perception', 'Intellectual property concerns']
        });
      } else if (marketCode === 'DE') {
        defaultCompetitors.push({
          name: 'Deutsche Quality AG',
          marketShare: 11.5,
          country: 'DE',
          strengths: ['Engineering excellence', 'Quality standards', 'Industry partnerships'],
          weaknesses: ['Higher pricing', 'Slower innovation cycles']
        });
      }
      
      return defaultCompetitors;
      
    } catch (error) {
      logger.error(`Error fetching competitors for ${marketCode}: ${error}`);
      return [];
    }
  }
  
  private async fetchEntryBarriers(marketCode: string, productCategories: string[]): Promise<string[]> {
    try {
      // In a real implementation, this would analyze market reports and regulatory data
      // For now, return realistic mock data
      
      // Common barriers across markets
      const commonBarriers = [
        'Existing customer loyalty to established brands',
        'Distribution channels controlled by incumbents',
        'High marketing costs to build brand awareness'
      ];
      
      // Market-specific barriers
      const marketSpecificBarriers: Record<string, string[]> = {
        'US': [
          'Complex regulatory compliance processes',
          'High litigation risk',
          'Need for local presence and customer support'
        ],
        'CN': [
          'Required partnerships with local companies',
          'Complicated licensing requirements',
          'Intellectual property protection concerns',
          'Language and cultural barriers'
        ],
        'DE': [
          'Strict quality and certification standards',
          'Strong local competition with established reputation',
          'Conservative buyer preferences'
        ],
        'UK': [
          'Post-Brexit regulatory changes',
          'Different standards than EU in some categories',
          'Well-established competitive landscape'
        ],
        'JP': [
          'Complex distribution network',
          'High quality expectations',
          'Language and cultural barriers',
          'Unique consumer preferences'
        ]
      };
      
      // Combine common barriers with market-specific ones
      const barriers = [...commonBarriers];
      
      if (marketSpecificBarriers[marketCode]) {
        barriers.push(...marketSpecificBarriers[marketCode]);
      }
      
      // Add product-specific barriers
      for (const category of productCategories) {
        const categoryBarriers = this.getProductCategoryBarriers(category, marketCode);
        barriers.push(...categoryBarriers);
      }
      
      return barriers;
      
    } catch (error) {
      logger.error(`Error fetching entry barriers for ${marketCode}: ${error}`);
      return [];
    }
  }
  
  private getProductCategoryBarriers(category: string, marketCode: string): string[] {
    const barriers: string[] = [];
    
    // Food products
    if (category.includes('food') || category.includes('beverage') || category.includes('agricultural')) {
      barriers.push(
        'Stringent food safety regulations',
        'Short shelf-life logistics challenges',
        'Consumer preference for local brands in food categories'
      );
    }
    
    // Electronics
    if (category.includes('electronics') || category.includes('electrical')) {
      barriers.push(
        'Product safety certifications and testing requirements',
        'Different electrical standards across regions',
        'Rapid technology changes requiring constant innovation'
      );
    }
    
    // Textiles
    if (category.includes('textile') || category.includes('apparel') || category.includes('clothing')) {
      barriers.push(
        'Different sizing standards across regions',
        'Seasonal fashion cycles',
        'Ethical and sustainable sourcing expectations'
      );
    }
    
    return barriers;
  }
  
  private async fetchTariffInfo(marketCode: string, productCategories: string[]): Promise<Record<string, TariffInfo>> {
    try {
      // In a real implementation, this would call a tariff data API
      // For now, return realistic mock data
      
      const tariffs: Record<string, TariffInfo> = {};
      
      // Base tariff rates for each market
      const baseTariffRates: Record<string, number> = {
        'US': 2.5,
        'CN': 8.0,
        'DE': 3.5, // EU rate
        'UK': 4.0,
        'FR': 3.5, // EU rate
        'JP': 5.0,
        'CA': 3.0,
        'AU': 4.5,
        'BR': 10.0,
        'IN': 12.0
      };
      
      // Get base rate for this market
      const baseRate = baseTariffRates[marketCode] || 5.0;
      
      // Add tariff info for each product category
      for (const category of productCategories) {
        const tariffRate = this.calculateTariffRate(category, baseRate);
        const tariffType = this.determineTariffType(category);
        const conditions = this.determineTariffConditions(category, marketCode);
        
        tariffs[category] = {
          rate: tariffRate,
          type: tariffType,
          conditions
        };
      }
      
      return tariffs;
      
    } catch (error) {
      logger.error(`Error fetching tariff info for ${marketCode}: ${error}`);
      return {};
    }
  }
  
  private calculateTariffRate(category: string, baseRate: number): number {
    // Adjust the base rate based on the product category
    
    // Food products often have higher tariffs
    if (category.includes('food') || category.includes('beverage') || category.includes('agricultural')) {
      return baseRate * 1.5;
    }
    
    // Electronics often have lower tariffs
    if (category.includes('electronics') || category.includes('electrical')) {
      return baseRate * 0.8;
    }
    
    // Luxury items often have higher tariffs
    if (category.includes('luxury') || category.includes('premium')) {
      return baseRate * 2.0;
    }
    
    return baseRate;
  }
  
  private determineTariffType(category: string): string {
    // Determine the type of tariff based on the product category
    
    // Some categories typically have specific tariffs
    if (category.includes('agricultural') || category.includes('food') || category.includes('beverage')) {
      return 'Mixed (Ad valorem and specific)';
    }
    
    return 'Ad valorem';
  }
  
  private determineTariffConditions(category: string, marketCode: string): string {
    // Determine any special conditions for tariffs
    
    // Check for preferential trade agreements
    if ((marketCode === 'UK' || marketCode === 'CA' || marketCode === 'AU') && 
        (category.includes('manufacturing') || category.includes('industrial'))) {
      return 'Preferential rates may apply under Commonwealth trade agreements';
    }
    
    if ((marketCode === 'DE' || marketCode === 'FR') && 
        (category.includes('manufacturing') || category.includes('industrial'))) {
      return 'Subject to EU trade regulations; preferential rates may apply under EU-South Africa EPA';
    }
    
    if (marketCode === 'US' && 
        (category.includes('manufacturing') || category.includes('industrial'))) {
      return 'May qualify for preferential treatment under AGOA';
    }
    
    // Special conditions for certain product types
    if (category.includes('electronics') || category.includes('electrical')) {
      return 'Must comply with ITA agreement tariff eliminations where applicable';
    }
    
    return 'Standard MFN rates apply';
  }
  
  private async generateOpportunities(
    marketCode: string, 
    productCategories: string[],
    marketSize: MarketSize,
    competitors: Competitor[]
  ): Promise<string[]> {
    // Try to use OpenAI API for enhanced opportunity analysis if available
    if (this.apiKeys.openai) {
      try {
        logger.info(`Generating enhanced market opportunities using OpenAI for ${marketCode} and ${productCategories[0]}`);
        
        // Create a detailed prompt using all available market data
        const marketDetails = {
          country: this.getCountryName(marketCode),
          product: productCategories[0],
          marketSize: `${marketSize.value} ${marketSize.currency} with ${marketSize.growthRate}% growth rate`,
          topCompetitors: competitors.map(c => `${c.name} (${c.marketShare}%, from ${c.country})`).join(', '),
          competitorWeaknesses: competitors.flatMap(c => c.weaknesses || []).join(', ')
        };
        
        const prompt = `Based on the following market data, identify 5-7 specific market opportunities for exporters looking to enter the ${marketDetails.product} market in ${marketDetails.country}:
        
        Market Size: ${marketDetails.marketSize}
        Top Competitors: ${marketDetails.topCompetitors}
        Competitor Weaknesses: ${marketDetails.competitorWeaknesses}
        
        Focus on specific, actionable opportunities that capitalize on market gaps, competitor weaknesses, and unique value propositions. Format each opportunity as a concise bullet point.`;
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a market intelligence specialist focused on identifying export opportunities.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.openai}`,
            'Content-Type': 'application/json'
          }
        });
        
        const responseData = response.data as any;
        if (responseData && responseData.choices && responseData.choices.length > 0) {
          const content = responseData.choices[0].message.content;
          
          // Extract bullet points from the response
          const bulletRegex = /[•\-\*]\s*(.+?)(?=(?:[•\-\*]|\n\n|$))/g;
          const matches = [...content.matchAll(bulletRegex)];
          
          if (matches.length > 0) {
            const opportunities = matches.map(match => match[1].trim());
            logger.info(`Successfully generated ${opportunities.length} market opportunities using OpenAI`);
            return opportunities;
          }
        }
      } catch (apiError) {
        logger.error(`Error accessing OpenAI API: ${apiError}`);
        // Fall back to standard opportunities
      }
    }
    
    // Standard opportunities generation - use existing code
    const opportunities: string[] = [];
    
    // General opportunities based on market growth
    if (marketSize.growthRate && marketSize.growthRate > 4) {
      opportunities.push(`High market growth rate of ${marketSize.growthRate}% indicates expanding opportunities`);
    }
    
    // Identify gaps in competitor offerings
    const competitorWeaknesses = competitors.flatMap(c => c.weaknesses || []);
    if (competitorWeaknesses.includes('Limited customization')) {
      opportunities.push('Opportunity to offer more customized products to differentiate from competitors');
    }
    if (competitorWeaknesses.includes('Premium pricing')) {
      opportunities.push('Potential to compete on price with cost-efficient offerings');
    }
    if (competitorWeaknesses.includes('Limited global presence')) {
      opportunities.push('Opportunity to leverage international experience in a market dominated by local players');
    }
    
    // Market-specific opportunities
    if (marketCode === 'US') {
      opportunities.push('Strong consumer spending power creates premium segment opportunities');
      opportunities.push('E-commerce growth offers direct-to-consumer possibilities');
    } else if (marketCode === 'CN') {
      opportunities.push('Rapidly growing middle class with increasing disposable income');
      opportunities.push('Strong demand for foreign branded products perceived as higher quality');
    } else if (marketCode === 'DE') {
      opportunities.push('High value placed on quality and durability creates premium segment opportunities');
      opportunities.push('Strong green/sustainable product preferences align with South African sustainability initiatives');
    }
    
    // Product-specific opportunities
    for (const category of productCategories) {
      if (category.includes('food') || category.includes('beverage')) {
        opportunities.push('Growing demand for exotic and ethnic food products');
        opportunities.push('Increasing interest in organic and sustainably sourced food products');
      } else if (category.includes('electronics')) {
        opportunities.push('Demand for energy-efficient and sustainable technology solutions');
      } else if (category.includes('textile') || category.includes('apparel')) {
        opportunities.push('Growing interest in ethically sourced and sustainable fashion');
        opportunities.push('Niche for unique, artisanal designs with cultural heritage');
      }
    }
    
    return opportunities;
  }
  
  private generateRisks(
    marketCode: string, 
    productCategories: string[],
    entryBarriers: string[],
    tariffs: Record<string, TariffInfo>
  ): string[] {
    // Convert entry barriers to risks and add additional market-specific risks
    const risks = [...entryBarriers];
    
    // Add risks based on tariff information
    const highTariffProducts = Object.entries(tariffs)
      .filter(([category, info]) => info.rate > 10)
      .map(([category]) => category);
    
    if (highTariffProducts.length > 0) {
      risks.push(`High tariff rates for ${highTariffProducts.join(', ')} affect price competitiveness`);
    }
    
    // Market-specific risks
    if (marketCode === 'US') {
      risks.push('Highly litigious business environment');
      risks.push('Complex regulatory compliance requirements');
    } else if (marketCode === 'CN') {
      risks.push('Intellectual property protection challenges');
      risks.push('Rapidly changing regulatory environment');
    } else if (marketCode === 'DE' || marketCode === 'FR') {
      risks.push('Stringent EU regulatory standards requiring certification');
      risks.push('Strong preference for local and EU-manufactured products');
    } else if (marketCode === 'JP') {
      risks.push('Unique cultural preferences requiring significant product adaptation');
      risks.push('Multi-layered distribution system adding complexity and cost');
    }
    
    // Currency and economic risks
    risks.push('Currency exchange rate fluctuations affecting profitability');
    risks.push('Economic downturns affecting consumer spending on non-essential items');
    
    // Logistics risks
    risks.push('Long shipping times from South Africa affecting time-sensitive products');
    risks.push('Higher logistics costs compared to regional competitors');
    
    return risks;
  }
  
  private generateRecommendations(
    marketCode: string,
    productCategories: string[],
    businessProfile: any,
    marketSize: MarketSize,
    competitors: Competitor[],
    entryBarriers: string[],
    tariffs: Record<string, TariffInfo>
  ): string[] {
    const recommendations: string[] = [];
    
    // Entry strategy recommendations
    recommendations.push('Establish partnership with local distributor to navigate market entry barriers');
    recommendations.push('Focus initial entry on most promising product segments with lowest barriers');
    
    // Competitive positioning recommendations
    const competitorStrengths = competitors.flatMap(c => c.strengths || []);
    if (competitorStrengths.includes('Brand recognition')) {
      recommendations.push('Develop clear value proposition emphasizing unique South African attributes');
    }
    if (competitorStrengths.includes('Distribution network')) {
      recommendations.push('Consider e-commerce and direct-to-consumer approaches to bypass traditional distribution');
    }
    
    // Market-specific recommendations
    if (marketCode === 'US') {
      recommendations.push('Invest in product liability insurance and thorough compliance review');
      recommendations.push('Consider state-by-state approach focusing on most receptive regions first');
    } else if (marketCode === 'CN') {
      recommendations.push('Secure appropriate intellectual property protection before market entry');
      recommendations.push('Establish local presence through trusted partner or representative office');
    } else if (marketCode === 'DE') {
      recommendations.push('Obtain necessary EU certifications and quality marks');
      recommendations.push('Emphasize sustainability and ethical production practices in marketing');
    }
    
    // Product adaptation recommendations
    for (const category of productCategories) {
      if (category.includes('food') || category.includes('beverage')) {
        recommendations.push('Adjust packaging and labeling to meet local regulatory requirements');
        recommendations.push('Consider shelf-life and preservation needs for international shipping');
      } else if (category.includes('electronics')) {
        recommendations.push('Ensure compliance with local safety standards and certification requirements');
        recommendations.push('Adapt plug types and voltage specifications for target market');
      } else if (category.includes('textile') || category.includes('apparel')) {
        recommendations.push('Adjust sizing to match local standards and preferences');
        recommendations.push('Adapt designs for local climate and cultural preferences');
      }
    }
    
    // Tariff optimization recommendations
    if (Object.values(tariffs).some(t => t.rate > 5)) {
      recommendations.push('Explore preferential trade agreements that may reduce applicable tariffs');
      recommendations.push('Consider HS code classification optimization for more favorable tariff treatment');
    }
    
    return recommendations;
  }
  
  private getHSCodeForProductCategory(category: string): string {
    // Map product categories to HS codes (Harmonized System codes)
    const hsCodeMap: Record<string, string> = {
      'food': '16',
      'beverage': '22',
      'agricultural': '10',
      'electronics': '85',
      'electrical': '85',
      'textile': '52',
      'apparel': '61',
      'clothing': '62',
      'furniture': '94',
      'automotive': '87',
      'chemicals': '28',
      'pharmaceuticals': '30',
      'cosmetics': '33',
      'toys': '95',
      'jewelry': '71'
    };
    
    // Find a matching HS code for the category
    for (const [key, code] of Object.entries(hsCodeMap)) {
      if (category.toLowerCase().includes(key)) {
        return code;
      }
    }
    
    // Default HS code for other categories
    return 'TOTAL'; // TOTAL will get all HS codes
  }
  
  private getCountryName(countryCode: string): string {
    const countryMap: Record<string, string> = {
      'US': 'United States',
      'CN': 'China',
      'DE': 'Germany',
      'UK': 'United Kingdom',
      'FR': 'France',
      'JP': 'Japan',
      'CA': 'Canada',
      'AU': 'Australia',
      'BR': 'Brazil',
      'IN': 'India'
    };
    
    return countryMap[countryCode] || countryCode;
  }
} 