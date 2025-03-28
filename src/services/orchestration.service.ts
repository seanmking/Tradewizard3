import { logger } from '@/utils/logger';
import { ExtractedEntity } from '@/types/extraction';
import { IntelligenceMCPService } from '@/mcp/intelligence-mcp/intelligence-mcp.service';
import { MarketIntelligenceMCPService } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.service';
import { ComplianceMCPService } from '@/mcp/compliance-mcp/compliance-mcp.service';

interface OrchestrationResult {
  entities: ExtractedEntity[];
  metadata: {
    totalProducts: number;
    validatedProducts: number;
    categorizedProducts: number;
    hsCodedProducts: number;
    processingTime: number;
  };
}

export class OrchestrationService {
  private intelligenceMCP: IntelligenceMCPService;
  private marketIntelligenceMCP: MarketIntelligenceMCPService;
  private complianceMCP: ComplianceMCPService;

  constructor() {
    this.intelligenceMCP = new IntelligenceMCPService();
    this.marketIntelligenceMCP = new MarketIntelligenceMCPService();
    this.complianceMCP = new ComplianceMCPService();
  }

  public async processExtractedData(
    sourceUrl: string,
    extractedEntities: ExtractedEntity[]
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    let entities = [...extractedEntities];
    
    try {
      // Step 1: Initial validation and enrichment with Perplexity
      logger.info(`Starting Perplexity validation for ${sourceUrl}`);
      const enrichedData = await this.intelligenceMCP.enrichBusinessData({
        sourceUrl,
        extractedEntities: entities
      });
      entities = enrichedData.enrichedEntities;
      
      // Step 2: Process products with Market Intelligence MCP
      logger.info('Enriching products with Market Intelligence MCP');
      const productEntities = entities.filter(e => e.type === 'product' && e.verified);
      
      for (const product of productEntities) {
        try {
          // First, determine product category and storage type
          const categoryResult = await this.marketIntelligenceMCP.categorizeProduct(product);
          product.attributes.category = categoryResult.category;
          product.attributes.storageType = categoryResult.storageType;
          
          // Then, get HS code based on category
          const hsCodeResult = await this.marketIntelligenceMCP.getHSCode(
            product.name,
            categoryResult.category,
            categoryResult.storageType
          );
          product.attributes.hsCode = hsCodeResult.code;
          product.attributes.hsCodeDescription = hsCodeResult.description;
          
          // Finally, get market data
          const marketData = await this.marketIntelligenceMCP.getMarketData(hsCodeResult.code);
          product.attributes.marketData = marketData;
          
          logger.info(`Successfully processed product ${product.name} with HS code ${hsCodeResult.code}`);
        } catch (error) {
          logger.error(`Error processing product ${product.name} with Market Intelligence MCP: ${error}`);
          // Don't invalidate the product, just mark it as needing review
          product.attributes.needsReview = true;
        }
      }
      
      // Step 3: Compliance checks
      logger.info('Running compliance checks');
      for (const product of productEntities) {
        try {
          const complianceResult = await this.complianceMCP.checkCompliance(
            product,
            product.attributes.hsCode
          );
          product.attributes.complianceStatus = complianceResult.status;
          product.attributes.requiredCertifications = complianceResult.requiredCertifications;
        } catch (error) {
          logger.error(`Error checking compliance for ${product.name}: ${error}`);
          product.attributes.complianceStatus = 'needs_review';
        }
      }
      
      // Calculate metadata
      const metadata = {
        totalProducts: productEntities.length,
        validatedProducts: entities.filter(e => e.type === 'product' && e.verified).length,
        categorizedProducts: entities.filter(e => e.type === 'product' && e.attributes.category).length,
        hsCodedProducts: entities.filter(e => e.type === 'product' && e.attributes.hsCode).length,
        processingTime: Date.now() - startTime
      };
      
      return { entities, metadata };
      
    } catch (error) {
      logger.error(`Error in orchestration process: ${error}`);
      throw error;
    }
  }
} 