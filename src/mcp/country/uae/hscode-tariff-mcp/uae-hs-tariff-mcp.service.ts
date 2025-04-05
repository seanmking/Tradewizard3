import axios from 'axios';
import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp/hs-code-mcp.service';
import { CacheService } from '@/services/cache-service';
import { UaeHsCodeResult, UaeHsCodeTariffInfo, UaeHsTariffMCP } from './uae-hs-tariff-mcp.interface';
import { logger } from '@/utils/logger';

export class UaeHsTariffMCPService implements UaeHsTariffMCP {
  private readonly globalHsCodeMCP: GlobalHsCodeMCPService;
  private readonly cacheService: CacheService<UaeHsCodeResult>;
  private readonly uaeApiBaseUrl: string;
  
  constructor() {
    this.globalHsCodeMCP = new GlobalHsCodeMCPService();
    this.cacheService = new CacheService<UaeHsCodeResult>({
      ttl: 60 * 60 * 24 * 1000, // 24 hours
      maxSize: 1000
    });
    this.uaeApiBaseUrl = process.env.UAE_TARIFF_API_URL || 'https://api.tradewizard.app/uae-tariff';
  }
  
  async getExtendedHsCode(productDescription: string): Promise<UaeHsCodeResult> {
    try {
      const cacheKey = `uae-hs-tariff:${productDescription.toLowerCase().trim()}`;
      
      // Try to get from cache first
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Get global classification first
      const globalClassification = await this.globalHsCodeMCP.classifyProduct(productDescription);
      
      // If no global classifications found, return empty result
      if (globalClassification.classifications.length === 0) {
        const emptyResult: UaeHsCodeResult = {
          uaeClassifications: [],
          query: productDescription,
          timestamp: new Date().toISOString(),
          globalClassification
        };
        return emptyResult;
      }
      
      // Get UAE-specific tariff information for the top global result
      const uaeClassifications = await this.getTariffByHsCode(
        globalClassification.classifications[0].hsCode
      );
      
      const result: UaeHsCodeResult = {
        uaeClassifications,
        query: productDescription,
        timestamp: new Date().toISOString(),
        globalClassification
      };
      
      // Cache the result
      this.cacheService.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error(`Error getting UAE HS code for "${productDescription}":`, error);
      // Return empty result with error information
      return {
        uaeClassifications: [],
        query: productDescription,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async getTariffByHsCode(hsCode: string): Promise<UaeHsCodeTariffInfo[]> {
    try {
      const cacheKey = `uae-tariff:${hsCode}`;
      
      // Try to get from cache first
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Format HS code for UAE API (remove spaces and dots)
      const formattedHsCode = hsCode.replace(/[\s.]/g, '');
      
      // This would be a real API call in a production implementation
      // For now, we'll generate mock data based on HS code patterns
      const tariffInfo = this.generateMockTariffData(formattedHsCode);
      
      // Cache the result
      this.cacheService.set(cacheKey, tariffInfo);
      
      return tariffInfo;
    } catch (error) {
      logger.error(`Error getting UAE tariff for HS code ${hsCode}:`, error);
      return [];
    }
  }
  
  private generateMockTariffData(hsCode: string): UaeHsCodeTariffInfo[] {
    // Check for exemptions - usually for essential goods and raw materials
    const isExempt = ['01', '10', '90', '49'].some(prefix => hsCode.startsWith(prefix));
    
    // High tariff items - usually for luxury and protective industries
    const isHighTariff = ['22', '24', '87', '71'].some(prefix => hsCode.startsWith(prefix));
    
    // The GCC has a common external tariff for most items at 5%
    const rate = isExempt ? 0 : isHighTariff ? 10 : 5;
    
    // Create mock tariff data
    return [{
      hsCode,
      description: `Products under ${hsCode}`,
      tariffRate: rate,
      tariffCategory: isExempt ? 'Exempt' : isHighTariff ? 'High Tariff' : 'Standard Rate',
      gccCommonTariff: !isHighTariff, // High tariff items might be UAE-specific
      dutyExemptions: isExempt ? ['All imports'] : ['Imports from GCC countries'],
      additionalFees: [
        { name: 'VAT', rate: '5%' },
        { name: 'Customs processing', rate: '1%' }
      ]
    }];
  }
} 