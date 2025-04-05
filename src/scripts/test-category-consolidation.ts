import { CategoryBasedConsolidationService } from '../services/product/categoryBasedConsolidation.service';
import { ProductVariant } from '../services/product/productConsolidation.service';
import { EmbeddingService } from '../services/classification/embeddingService';
import { IntelligenceMCPService } from '../mcp/intelligence-mcp/intelligence-mcp.service';
import { CacheService } from '../services/cache-service';

/**
 * Test script to demonstrate the CategoryBasedConsolidationService
 */
async function testCategoryConsolidation() {
  console.log('Testing CategoryBasedConsolidationService...');
  
  // Create dependencies
  const embeddingService = new EmbeddingService();
  const llmService = new IntelligenceMCPService();
  const cacheService = new CacheService<any>({ ttl: 30 * 60 * 1000 }); // 30 minutes TTL
  
  // Create the service
  const consolidationService = new CategoryBasedConsolidationService(
    embeddingService,
    llmService,
    cacheService,
    {
      enableLLM: false, // Set to true to use LLM integration
      useCaching: true,
      similarityThreshold: 0.75
    }
  );
  
  // Sample products for testing
  const sampleProducts: ProductVariant[] = [
    // Wine products
    {
      id: '1',
      name: 'Stellenbosch Reserve Cabernet Sauvignon 2018, 750ml',
      description: 'A full-bodied red wine with notes of blackcurrant and cedar, from the Stellenbosch region.',
      category: 'Wine'
    },
    {
      id: '2',
      name: 'Cape Point Vineyards Sauvignon Blanc 2021, 750ml',
      description: 'A crisp and refreshing white wine with citrus and tropical fruit notes.',
      category: 'Wine'
    },
    {
      id: '3',
      name: 'Graham Beck Brut Rose NV, 750ml',
      description: 'A sparkling wine made using the traditional Méthode Cap Classique.',
      category: 'Sparkling Wine'
    },
    
    // Processed foods
    {
      id: '4',
      name: 'Browns Frozen Chicken Corn Dogs, Original Recipe, 10pk',
      description: 'Breaded chicken sausages on sticks, ready to cook from frozen.',
      category: 'Frozen Food'
    },
    {
      id: '5',
      name: 'Eskort Bacon-wrapped Pork Bangers, 500g',
      description: 'Premium pork sausages wrapped in bacon, refrigerated.',
      category: 'Processed Meat'
    },
    {
      id: '6',
      name: 'Rhodes Peach Slices in Syrup, 410g',
      description: 'Canned peach slices in sweet syrup, ambient storage.',
      category: 'Canned Fruit'
    },
    
    // Fresh produce
    {
      id: '7',
      name: 'Outspan Valencia Oranges, 2kg bag',
      description: 'Sweet and juicy Valencia oranges from South Africa.',
      category: 'Fresh Fruit'
    },
    
    // Beauty products
    {
      id: '8',
      name: 'Africology Marula & Neroli Body Oil, 100ml',
      description: 'Nourishing body oil made with African marula oil and neroli essential oil.',
      category: 'Skincare'
    }
  ];
  
  try {
    console.log(`Processing ${sampleProducts.length} products...`);
    
    // Consolidate products
    const start = Date.now();
    const result = await consolidationService.consolidateProducts(sampleProducts);
    const duration = Date.now() - start;
    
    console.log(`Consolidation completed in ${duration}ms`);
    console.log(`Found ${result.length} categories:`);
    
    // Print results
    result.forEach((categoryResult, index) => {
      console.log(`\nCategory ${index + 1}: ${categoryResult.category.name}`);
      console.log(`Description: ${categoryResult.category.description}`);
      console.log(`Confidence: ${(categoryResult.confidence * 100).toFixed(1)}%`);
      console.log(`Attributes: ${JSON.stringify(categoryResult.attributes)}`);
      console.log(`Products (${categoryResult.variants.length}):`);
      
      categoryResult.variants.forEach(product => {
        console.log(`  - ${product.name}`);
      });
    });
    
  } catch (error) {
    console.error('Error testing category consolidation:', error);
  }
}

// Run the test
testCategoryConsolidation().catch(console.error); 