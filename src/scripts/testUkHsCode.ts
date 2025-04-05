import 'reflect-metadata';
import { UkHsCodeMcpService } from '../mcp/uk-hs-code-mcp/uk-hs-code-mcp.service';
import { UkHsCodeResponseItem, MeasureInfo } from '../mcp/uk-hs-code-mcp/uk-hs-code-mcp.interface';

// Test function for UK HS Code service
async function testUkHsCode() {
  console.log('=================================================');
  console.log('       TESTING UK HS CODE SERVICE FOR SOUTH AFRICAN EXPORTS');
  console.log('=================================================\n');

  const ukHsCodeService = new UkHsCodeMcpService();
  const searchTerms = ['macadamia', 'wine', 'electric vehicle', 'laptop', 'coffee machine'];
  const originCountry = 'ZA'; // South Africa

  for (const term of searchTerms) {
    console.log('-------------------------------------------------');
    console.log(`SEARCHING FOR: "${term.toUpperCase()}" FROM SOUTH AFRICA`);
    console.log('-------------------------------------------------');

    try {
      const response = await ukHsCodeService.getHsCode({ 
        description: term,
        originCountry
      });
      
      if (response.success && response.data && response.data.length > 0) {
        const results = response.data as UkHsCodeResponseItem[];
        
        console.log(`\nFOUND ${results.length} RESULTS, SHOWING FIRST ${Math.min(2, results.length)}:\n`);
        
        for (let i = 0; i < Math.min(2, results.length); i++) {
          const item = results[i];
          printCommodityDetails(item, i + 1);
          
          // If this is the first result, get more detailed information
          if (i === 0) {
            console.log(`\n   [Getting additional details for this code...]\n`);
            const detailsResponse = await ukHsCodeService.getCommodityDetails({
              commodityCode: item.commodityCode,
              originCountry
            });
            
            if (detailsResponse.success && detailsResponse.data && detailsResponse.data.length > 0) {
              const detailedItem = detailsResponse.data[0] as UkHsCodeResponseItem;
              printDetailedInformation(detailedItem);
            }
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

  // Now test a specific code for comparison with a different origin country
  await testCompareDifferentOrigins();

  console.log('=================================================');
  console.log('       TEST COMPLETED SUCCESSFULLY');
  console.log('=================================================');
}

// Test function to compare tariffs for different origin countries
async function testCompareDifferentOrigins() {
  console.log('=================================================');
  console.log('       COMPARING TARIFFS BY ORIGIN COUNTRY');
  console.log('=================================================\n');

  const ukHsCodeService = new UkHsCodeMcpService();
  const commodityCode = '0802620000'; // Macadamia nuts, shelled
  const countries = [
    { code: 'ZA', name: 'South Africa' },
    { code: 'CN', name: 'China' },
    { code: 'US', name: 'United States' }
  ];

  console.log(`COMMODITY: ${commodityCode} - Macadamia nuts, shelled\n`);
  console.log('TARIFF COMPARISON BY COUNTRY OF ORIGIN:\n');

  for (const country of countries) {
    try {
      const response = await ukHsCodeService.getCommodityDetails({
        commodityCode,
        originCountry: country.code
      });
      
      if (response.success && response.data && response.data.length > 0) {
        const item = response.data[0] as UkHsCodeResponseItem;
        
        console.log(`${country.name} (${country.code}):`);
        
        // Print duties
        if (item.duty_calculations && item.duty_calculations.length > 0) {
          item.duty_calculations.forEach(duty => {
            console.log(` - ${duty.measure_type}: ${duty.duty_rate}`);
          });
        } else {
          console.log(' - No duty information available');
        }
        
        // Print preferential status
        const hasPreferential = item.duty_calculations.some(duty => duty.is_preferential);
        if (hasPreferential) {
          console.log(' - Benefits from preferential tariff treatment');
        }
        
        // Print required documents specific to this country
        const documentMeasures = item.applicable_measures.filter(measure => 
          measure.is_restriction && measure.conditions && measure.conditions.length > 0
        );
        
        if (documentMeasures.length > 0) {
          console.log(' - Required documents:');
          documentMeasures.forEach(measure => {
            measure.conditions?.forEach(condition => {
              if (condition.document_code) {
                console.log(`   * ${condition.document_code}: ${condition.requirement || 'Document required'}`);
              }
            });
          });
        }
        
        console.log('');
      }
    } catch (error) {
      console.error(`Error fetching data for ${country.name}:`, error);
    }
  }
}

// Helper function to print commodity details
function printCommodityDetails(item: UkHsCodeResponseItem, index: number) {
  console.log(`${index}. HS CODE: ${item.commodityCode}`);
  console.log(`   DESCRIPTION: ${item.description}`);
  
  // Print duty calculations
  if (item.duty_calculations && item.duty_calculations.length > 0) {
    console.log('   DUTY CALCULATIONS:');
    item.duty_calculations.forEach(duty => {
      console.log(`     - ${duty.measure_type}: ${duty.duty_rate}`);
    });
  }
  
  // Print VAT rate
  console.log(`   VAT: ${item.vat_rate.rate} (${item.vat_rate.type})`);
  
  // Print restrictive measures (prohibitions and restrictions)
  const restrictions = item.applicable_measures.filter(m => m.is_prohibition || m.is_restriction);
  if (restrictions.length > 0) {
    console.log('   RESTRICTIONS AND REQUIREMENTS:');
    restrictions.forEach(measure => {
      console.log(`     - ${measure.measure_type}`);
    });
  }
}

// Helper function to print detailed information
function printDetailedInformation(item: UkHsCodeResponseItem) {
  console.log('   DETAILED INFORMATION:');
  
  // Print footnotes if available
  if (item.footnotes && item.footnotes.length > 0) {
    console.log('   - Notes:');
    item.footnotes.forEach(footnote => {
      console.log(`     * ${footnote.description}`);
    });
  }
  
  // Print measure conditions with document requirements
  const measuresWithConditions = item.applicable_measures.filter(m => 
    m.conditions && m.conditions.length > 0
  );
  
  if (measuresWithConditions.length > 0) {
    console.log('   - Documentation Requirements:');
    measuresWithConditions.forEach(measure => {
      measure.conditions?.forEach(condition => {
        if (condition.document_code) {
          console.log(`     * ${condition.document_code}: ${condition.requirement || 'Document required'}`);
        }
      });
    });
  }
  
  // Print legal information
  if (item.legal_acts && item.legal_acts.length > 0) {
    console.log('   - Legal Acts:');
    item.legal_acts.forEach(act => {
      console.log(`     * ${act.name}`);
    });
  }
}

// Run the test
testUkHsCode().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 