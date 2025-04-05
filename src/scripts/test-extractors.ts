// Using CommonJS require syntax
const { LLMWebsiteExtractor } = require('../ai-agent/extractors/llm-website-extractor');
const { ProductConsolidationService } = require('../services/product/productConsolidation.service');
const { setTimeout } = require('timers/promises');

async function testExtraction() {
  console.log('=================================================');
  console.log('       TESTING WEBSITE EXTRACTOR');
  console.log('=================================================\n');

  try {
    // Initialize extractor
    const extractor = new LLMWebsiteExtractor();
    console.log('Extractor initialized successfully');
    
    // Test URL - public e-commerce site that doesn't require authentication
    const testUrl = 'https://www.amazon.com/s?k=macadamia+nuts';
    
    console.log(`Starting extraction from: ${testUrl}`);
    const result = await extractor.extract(testUrl);
    
    console.log(`\nExtraction completed. Found ${result.extractedEntities.length} products.`);
    console.log('\nSample Products (first 3):');
    
    // Display the first 3 products
    result.extractedEntities.slice(0, 3).forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`Name: ${product.name}`);
      console.log(`Value: ${product.value}`);
      console.log(`Type: ${product.type}`);
      console.log(`Confidence: ${product.confidence}`);
      console.log(`Attributes: ${JSON.stringify(product.attributes, null, 2)}`);
    });
    
    // Test product consolidation if products were found
    if (result.extractedEntities.length > 0) {
      // Convert extracted entities to product variants
      const productVariants = result.extractedEntities.map(entity => {
        return {
          name: entity.name,
          description: entity.attributes.description || '',
          price: entity.attributes.price,
          attributes: entity.attributes
        };
      });
      
      await testProductConsolidation(productVariants);
    }
    
  } catch (error) {
    console.error('Extraction failed:', error);
  }
}

async function testProductConsolidation(products) {
  console.log('\n=================================================');
  console.log('       TESTING PRODUCT CONSOLIDATION');
  console.log('=================================================\n');
  
  try {
    // Initialize consolidation service
    const consolidationService = new ProductConsolidationService();
    console.log('Product Consolidation Service initialized successfully');
    
    // Process the products
    console.log(`Processing ${products.length} products for consolidation...`);
    const consolidatedProducts = await consolidationService.consolidateProducts(products);
    
    console.log(`\nConsolidation completed. Found ${consolidatedProducts.length} product groups.`);
    console.log('\nSample Product Groups (first 2):');
    
    // Display the first 2 product groups
    consolidatedProducts.slice(0, 2).forEach((group, groupIndex) => {
      console.log(`\nProduct Group ${groupIndex + 1}:`);
      console.log(`Base Type: ${group.baseType}`);
      console.log(`Description: ${group.description || 'N/A'}`);
      console.log(`Variants: ${group.variants.length}`);
      
      console.log('\nVariants:');
      group.variants.slice(0, 3).forEach((variant, variantIndex) => {
        console.log(`  ${variantIndex + 1}. ${variant.name}`);
      });
    });
    
  } catch (error) {
    console.error('Product consolidation failed:', error);
  }
}

// Run the test
console.log('Starting test script...');
testExtraction().catch(error => {
  console.error('Test failed with uncaught error:', error);
  process.exit(1);
}); 