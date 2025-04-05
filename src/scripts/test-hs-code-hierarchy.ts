import { HSCodeHierarchyService, HSCodeRequest } from '../services/product/hsCodeHierarchy.service';
import { HSCodeTariffMCPService } from '../mcp/global/hscode-tariff-mcp/hscode-tariff-mcp.service';
import { CacheService } from '../services/cache-service';
import { logger } from '../utils/logger';

/**
 * Script to demonstrate the HS Code Hierarchy Service
 * Shows how to navigate from categories to HS codes
 */
async function main() {
  logger.info('=== HS Code Hierarchy Service Demonstration ===');
  
  // Initialize dependencies
  const cacheService = new CacheService<any>({
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  const hsCodeService = new HSCodeTariffMCPService();
  
  // Initialize our service
  const hsCodeHierarchyService = new HSCodeHierarchyService(
    hsCodeService,
    cacheService,
    {
      confidenceThreshold: 0.6,
      useCaching: true,
      maxSuggestions: 5
    }
  );
  
  logger.info('Initialization complete');
  
  // Example 1: Get HS code suggestions for a wine product
  logger.info('\n=== Example 1: Wine Product ===');
  const wineRequest: HSCodeRequest = {
    productCategory: 'beverages',
    productName: 'Red Wine',
    productDescription: 'Premium Cabernet Sauvignon from Stellenbosch, South Africa'
  };
  
  try {
    logger.info('Getting HS code suggestions for wine...');
    const wineSuggestions = await hsCodeHierarchyService.getSuggestedHSCodes(wineRequest);
    
    logger.info(`Found ${wineSuggestions.length} suggestions:`);
    wineSuggestions.forEach(suggestion => {
      logger.info(`- ${suggestion.code}: ${suggestion.description} (confidence: ${suggestion.confidence.toFixed(2)})`);
      
      // Show children for the first suggestion
      if (suggestion === wineSuggestions[0] && suggestion.children?.length) {
        logger.info('  Child codes:');
        suggestion.children.forEach(child => {
          logger.info(`  - ${child.code}: ${child.description}`);
        });
      }
    });
    
    // For the top suggestion, navigate down the hierarchy
    if (wineSuggestions.length > 0) {
      const topSuggestion = wineSuggestions[0];
      logger.info(`\nNavigating down the hierarchy for ${topSuggestion.code}...`);
      
      const children = await hsCodeHierarchyService.getHSCodeChildren(topSuggestion.code);
      logger.info(`Found ${children.length} child codes:`);
      children.forEach(child => {
        logger.info(`- ${child.code}: ${child.description}`);
      });
      
      // If we have children, go one level deeper
      if (children.length > 0) {
        const firstChild = children[0];
        logger.info(`\nNavigating down one more level for ${firstChild.code}...`);
        
        const grandchildren = await hsCodeHierarchyService.getHSCodeChildren(firstChild.code);
        logger.info(`Found ${grandchildren.length} subheadings:`);
        grandchildren.forEach(grandchild => {
          logger.info(`- ${grandchild.code}: ${grandchild.description}`);
        });
      }
    }
  } catch (error) {
    logger.error('Error in wine example:', error);
  }
  
  // Example 2: Get HS code suggestions for a clothing product
  logger.info('\n=== Example 2: Clothing Product ===');
  const clothingRequest: HSCodeRequest = {
    productCategory: 'ready_to_wear',
    productName: 'Mens Cotton T-Shirt',
    productDescription: 'Short-sleeve cotton t-shirt with printed design'
  };
  
  try {
    logger.info('Getting HS code suggestions for clothing...');
    const clothingSuggestions = await hsCodeHierarchyService.getSuggestedHSCodes(clothingRequest);
    
    logger.info(`Found ${clothingSuggestions.length} suggestions:`);
    clothingSuggestions.forEach(suggestion => {
      logger.info(`- ${suggestion.code}: ${suggestion.description} (confidence: ${suggestion.confidence.toFixed(2)})`);
    });
  } catch (error) {
    logger.error('Error in clothing example:', error);
  }
  
  // Example 3: Navigate categories without product details
  logger.info('\n=== Example 3: Category Navigation ===');
  const categories = [
    'food_products',
    'beverages',
    'ready_to_wear',
    'home_goods',
    'non_prescription_health'
  ];
  
  try {
    for (const category of categories) {
      logger.info(`\nHS code chapters for category: ${category}`);
      
      const request: HSCodeRequest = { productCategory: category };
      const suggestions = await hsCodeHierarchyService.getSuggestedHSCodes(request);
      
      logger.info(`Found ${suggestions.length} chapters:`);
      suggestions.forEach(suggestion => {
        logger.info(`- ${suggestion.code}: ${suggestion.description}`);
      });
    }
  } catch (error) {
    logger.error('Error in category navigation example:', error);
  }
  
  // Example 4: Ambiguous product that could be in multiple categories
  logger.info('\n=== Example 4: Ambiguous Product ===');
  const ambiguousRequest: HSCodeRequest = {
    productCategory: 'food_products',
    productName: 'Chocolate Wine',
    productDescription: 'Dessert wine infused with chocolate flavor'
  };
  
  try {
    logger.info('Getting HS code suggestions for ambiguous product...');
    const ambiguousSuggestions = await hsCodeHierarchyService.getSuggestedHSCodes(ambiguousRequest);
    
    logger.info(`Found ${ambiguousSuggestions.length} suggestions:`);
    ambiguousSuggestions.forEach(suggestion => {
      logger.info(`- ${suggestion.code}: ${suggestion.description} (confidence: ${suggestion.confidence.toFixed(2)})`);
    });
  } catch (error) {
    logger.error('Error in ambiguous product example:', error);
  }
  
  logger.info('\nDemo complete!');
}

// Run the demo
main().catch(error => {
  logger.error('Unhandled error in demo:', error);
  process.exit(1);
}); 