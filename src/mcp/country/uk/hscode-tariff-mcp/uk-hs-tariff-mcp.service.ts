import axios from 'axios';
import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp/hs-code-mcp.service';
import { CacheService } from '@/services/cache-service';
import { UkHsCodeResult, UkHsCodeTariffInfo, UkHsTariffMCP } from './uk-hs-tariff-mcp.interface';
import { logger } from '@/utils/logger';

export class UkHsTariffMCPService implements UkHsTariffMCP {
  private readonly globalHsCodeMCP: GlobalHsCodeMCPService;
  private readonly cacheService: CacheService<UkHsCodeResult>;
  private readonly ukApiBaseUrl: string;
  
  constructor() {
    this.globalHsCodeMCP = new GlobalHsCodeMCPService();
    this.cacheService = new CacheService<UkHsCodeResult>({
      ttl: 60 * 60 * 24 * 1000, // 24 hours
      maxSize: 1000
    });
    this.ukApiBaseUrl = process.env.UK_TARIFF_API_URL || 'https://api.trade-tariff.service.gov.uk/api/v2';
  }
  
  async getExtendedHsCode(productDescription: string): Promise<UkHsCodeResult> {
    try {
      const cacheKey = `uk-hs-tariff:${productDescription.toLowerCase().trim()}`;
      
      // Try to get from cache first
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Get global classification first
      const globalClassification = await this.globalHsCodeMCP.classifyProduct(productDescription);
      
      // If no global classifications found, return empty result
      if (globalClassification.classifications.length === 0) {
        const emptyResult: UkHsCodeResult = {
          ukClassifications: [],
          query: productDescription,
          timestamp: new Date().toISOString(),
          globalClassification
        };
        return emptyResult;
      }
      
      // Get UK-specific tariff information for the top global result
      const ukClassifications = await this.getTariffByHsCode(
        globalClassification.classifications[0].hsCode
      );
      
      const result: UkHsCodeResult = {
        ukClassifications,
        query: productDescription,
        timestamp: new Date().toISOString(),
        globalClassification
      };
      
      // Cache the result
      this.cacheService.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error(`Error getting UK HS code for "${productDescription}":`, error);
      // Return empty result with error information
      return {
        ukClassifications: [],
        query: productDescription,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async getTariffByHsCode(hsCode: string): Promise<UkHsCodeTariffInfo[]> {
    try {
      const cacheKey = `uk-tariff:${hsCode}`;
      
      // Try to get from cache first
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Format HS code for UK API (remove spaces and dots)
      const formattedHsCode = hsCode.replace(/[\s.]/g, '');
      
      // Call UK Tariff API
      const response = await axios.get(`${this.ukApiBaseUrl}/commodities/${formattedHsCode}`);
      
      // Parse response and extract tariff information
      const tariffInfo = this.parseTariffResponse(response.data);
      
      // Cache the result
      this.cacheService.set(cacheKey, tariffInfo);
      
      return tariffInfo;
    } catch (error) {
      logger.error(`Error getting UK tariff for HS code ${hsCode}:`, error);
      return [];
    }
  }
  
  private parseTariffResponse(response: any): UkHsCodeTariffInfo[] {
    try {
      const commodity = response.data;
      
      if (!commodity) {
        return [];
      }
      
      // Extract measures (duties, prohibitions, etc.)
      const measures = commodity.relationships?.measures?.data || [];
      
      // Extract VAT information
      const vatMeasures = measures.filter((m: any) => m.attributes?.measure_type?.description?.includes('VAT'));
      const vat = vatMeasures.length > 0 
        ? vatMeasures[0]?.attributes?.duty_expression?.base 
        : 'Standard rate';
      
      // Extract tariff rates
      const tariffMeasures = measures.filter((m: any) => 
        m.attributes?.measure_type?.description?.includes('Third country duty'));
      
      // Extract license requirements
      const licenseRequired = measures.some((m: any) => 
        m.attributes?.measure_type?.description?.includes('License') || 
        m.attributes?.measure_type?.description?.includes('Licence'));
      
      // Create result object
      const tariffInfo: UkHsCodeTariffInfo = {
        hsCode: commodity.attributes?.goods_nomenclature_item_id || '',
        description: commodity.attributes?.description || '',
        tariffRate: tariffMeasures.length > 0 
          ? this.extractTariffRate(tariffMeasures[0]?.attributes?.duty_expression?.base) 
          : null,
        tariffCategory: 'Third country duty',
        measureType: tariffMeasures.length > 0 
          ? tariffMeasures[0]?.attributes?.measure_type?.description || '' 
          : '',
        unitOfMeasure: tariffMeasures.length > 0 
          ? tariffMeasures[0]?.attributes?.duty_expression?.unit || '' 
          : '',
        vat,
        additionalCodes: [],
        footnotes: commodity.relationships?.footnotes?.data?.map((f: any) => f.attributes?.description) || [],
        quotas: [],
        requiresLicense: licenseRequired
      };
      
      return [tariffInfo];
    } catch (error) {
      logger.error('Error parsing UK tariff response:', error);
      return [];
    }
  }
  
  private extractTariffRate(rateString: string): number | null {
    if (!rateString) {
      return null;
    }
    
    // Extract percentage rate (e.g., "12.00 %")
    const percentMatch = rateString.match(/(\d+(\.\d+)?)\s*%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    // Extract fixed amount (e.g., "£120.00 / 100 kg")
    const amountMatch = rateString.match(/£?(\d+(\.\d+)?)/);
    if (amountMatch) {
      return parseFloat(amountMatch[1]);
    }
    
    return null;
  }
} 