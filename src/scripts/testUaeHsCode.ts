import 'reflect-metadata';
import { UaeHsCodeMcpService } from '../mcp/uae-hs-code-mcp/uae-hs-code-mcp.service';

// Test function for UAE HS Code service
async function testUaeHsCode() {
  console.log('=================================================');
  console.log('       TESTING UAE HS CODE SERVICE');
  console.log('=================================================\n');

  const uaeHsCodeService = new UaeHsCodeMcpService();
  const searchTerms = ['macadamia', 'laptop', 'mobile phone', 'coffee machine', 'electric vehicle'];

  for (const term of searchTerms) {
    console.log('-------------------------------------------------');
    console.log(`SEARCHING FOR: "${term.toUpperCase()}"`);
    console.log('-------------------------------------------------');

    try {
      const response = await uaeHsCodeService.getHsCode({ description: term });
      
      if (response.success && response.data) {
        // For single item responses
        if (!Array.isArray(response.data)) {
          console.log(`HS CODE: ${response.data.hsCode}`);
          console.log(`DESCRIPTION: ${response.data.description}`);
          
          if (response.data.additionalDetails) {
            console.log('ADDITIONAL DETAILS:');
            console.log(`  - Duty Rate: ${response.data.additionalDetails.dutyRate}`);
            console.log(`  - Import Restrictions: ${response.data.additionalDetails.importRestrictions}`);
            console.log('  - Required Documents:');
            response.data.additionalDetails.requiredDocuments.forEach((doc: string) => {
              console.log(`    * ${doc}`);
            });
          }
        } 
        // For array responses
        else {
          console.log(`FOUND ${response.data.length} RESULTS, SHOWING FIRST ${Math.min(3, response.data.length)}:\n`);
          
          for (let i = 0; i < Math.min(3, response.data.length); i++) {
            const item = response.data[i];
            console.log(`${i + 1}. HS CODE: ${item.hsCode}`);
            console.log(`   DESCRIPTION: ${item.description}`);
            
            if (item.additionalDetails) {
              console.log('   ADDITIONAL DETAILS:');
              console.log(`     - Duty Rate: ${item.additionalDetails.dutyRate}`);
              console.log(`     - Import Restrictions: ${item.additionalDetails.importRestrictions}`);
              console.log('     - Required Documents:');
              item.additionalDetails.requiredDocuments.forEach((doc: string) => {
                console.log(`       * ${doc}`);
              });
            }
            console.log('');
          }
        }
      } else {
        console.log(`No results found: ${response.message || 'Unknown error'}`);
        if (response.error) {
          console.log(`Error details: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Error during test:', error);
    }
    
    console.log('');
  }

  console.log('=================================================');
  console.log('       TEST COMPLETED SUCCESSFULLY');
  console.log('=================================================');
}

// Run the test
testUaeHsCode().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 