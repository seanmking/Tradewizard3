import 'reflect-metadata';
import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://www.trade-tariff.service.gov.uk/api/v2';
const USER_AGENT = 'TradeWizard/3.0 (https://tradewizard.app; support@tradewizard.app)';

// Test the UK Trade Tariff API directly
async function testUkTradeApi() {
  console.log('=================================================');
  console.log('       TESTING UK TRADE TARIFF API ENDPOINTS');
  console.log('=================================================\n');

  // Test search endpoint with exact phrases
  console.log('-------------------------------------------------');
  console.log('TESTING SEARCH ENDPOINT');
  console.log('-------------------------------------------------\n');
  
  const searchTerms = ['avocado', 'macadamia', 'wine'];
  
  for (const term of searchTerms) {
    try {
      console.log(`Searching for: "${term}"`);
      const response = await axios.get(`${API_BASE_URL}/search`, { 
        params: { 
          q: term,
          as_of: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
        },
        headers: {
          'User-Agent': USER_AGENT 
        }
      });
      
      if (response.data?.data?.attributes?.goods_nomenclature_match?.commodities) {
        // Handle fuzzy match results
        const matches = response.data.data.attributes.goods_nomenclature_match.commodities;
        console.log(`Found ${matches.length} results through fuzzy match`);
        
        if (matches.length > 0) {
          // Print the top 3 matches
          const topMatches = matches.slice(0, 3);
          topMatches.forEach((match: any, index: number) => {
            console.log(`Match ${index + 1}:`);
            console.log(`  Code: ${match._source.goods_nomenclature_item_id}`);
            console.log(`  Description: ${match._source.description}`);
            console.log(`  Declarable: ${match._source.declarable}`);
          });
        }
      } 
      else if (response.data?.data?.attributes?.type === 'exact_match') {
        // Handle exact match result
        console.log(`Found exact match for "${term}"`);
        const entry = response.data.data.attributes.entry;
        console.log(`  Endpoint: ${entry.endpoint}`);
        console.log(`  ID: ${entry.id}`);
        
        // For exact matches, we need to fetch the section/heading/chapter
        try {
          const detailsResponse = await axios.get(`${API_BASE_URL}/${entry.endpoint}/${entry.id}`, {
            headers: {
              'User-Agent': USER_AGENT 
            }
          });
          console.log(`  Details retrieved successfully`);
          if (detailsResponse.data?.data) {
            console.log(`  Title: ${detailsResponse.data.data.attributes?.formatted_description || 'N/A'}`);
          }
        } catch (detailsError) {
          console.log(`  Could not retrieve additional details: ${(detailsError as Error).message}`);
        }
      } 
      else {
        console.log('No matches found or unexpected response format');
        console.log('Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
      }
      
      console.log(); // Empty line for readability
    } catch (error) {
      const err = error as Error | AxiosError;
      if (axios.isAxiosError(err)) {
        console.error(`Error searching for "${term}": ${err.message}`);
        if (err.response) {
          console.error(`Status: ${err.response.status}`);
          console.error(`Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
        }
      } else {
        console.error(`Error searching for "${term}": ${(err as Error).message}`);
      }
    }
  }
  
  // Test specific commodity codes for food subsector
  // Using declarable commodity codes from search results
  const specificCommodityCodes = [
    '0804400090', // Avocados - Other (declarable)
    '0802620000', // Macadamia nuts, shelled (declarable)
    '2204109800'  // Wine of fresh grapes - Other (declarable)
  ];
  
  console.log('-------------------------------------------------');
  console.log('TESTING COMMODITY DETAILS ENDPOINT');
  console.log('-------------------------------------------------\n');
  
  for (const code of specificCommodityCodes) {
    await testCommodityDetails(code);
  }
  
  console.log('=================================================');
  console.log('       TEST COMPLETED');
  console.log('=================================================');
}

// Test the commodity details endpoint
async function testCommodityDetails(commodityCode: string) {
  try {
    console.log(`Getting details for commodity code: ${commodityCode}`);
    
    // Format the current date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const url = `${API_BASE_URL}/commodities/${commodityCode}`;
    console.log(`Request URL: ${url}`);
    
    const response = await axios.get(url, { 
      headers: { 
        'User-Agent': USER_AGENT 
      },
      params: {
        as_of: today
      }
    });
    
    if (response.data && response.data.data) {
      const item = response.data.data;
      const attributes = item.attributes || item;
      
      console.log(`\nCommodity Code: ${attributes.goods_nomenclature_item_id}`);
      console.log(`Description: ${attributes.description}`);
      console.log(`Declarable: ${attributes.declarable}`);
      
      // Check if the commodity has any measures
      if (response.data.included) {
        // Look for measures and measure types
        const measures = response.data.included.filter(
          (inc: any) => inc.type === 'measure'
        );
        
        const measureTypes = response.data.included.filter(
          (inc: any) => inc.type === 'measure_type'
        );
        
        const geographicalAreas = response.data.included.filter(
          (inc: any) => inc.type === 'geographical_area'
        );
        
        const dutyExpressions = response.data.included.filter(
          (inc: any) => inc.type === 'duty_expression'
        );
        
        // Create maps for easy lookup
        const measureTypeMap = new Map();
        measureTypes.forEach((type: any) => {
          if (type.id && type.attributes?.description) {
            measureTypeMap.set(type.id, type.attributes.description);
          }
        });
        
        const geoAreaMap = new Map();
        geographicalAreas.forEach((area: any) => {
          if (area.id && area.attributes) {
            geoAreaMap.set(area.id, {
              id: area.attributes.id || area.id,
              description: area.attributes.description || 'Unknown'
            });
          }
        });
        
        const dutyExpressionMap = new Map();
        dutyExpressions.forEach((duty: any) => {
          if (duty.id && duty.attributes) {
            dutyExpressionMap.set(duty.id, {
              base: duty.attributes.base || '',
              formatted_base: duty.attributes.formatted_base || '',
              verbose_duty: duty.attributes.verbose_duty || ''
            });
          }
        });
        
        if (measures.length > 0) {
          console.log(`\nFound ${measures.length} measures. Showing first 5:`);
          
          for (let i = 0; i < Math.min(5, measures.length); i++) {
            const measure = measures[i];
            const measureAttributes = measure.attributes || {};
            
            // Get the measure type from the relationships
            let measureType = 'N/A';
            if (measure.relationships?.measure_type?.data?.id) {
              const typeId = measure.relationships.measure_type.data.id;
              measureType = measureTypeMap.get(typeId) || `Type ID: ${typeId}`;
            }
            
            // Get the geographical area from relationships if available
            let geographicalArea = 'N/A';
            if (measure.relationships?.geographical_area?.data?.id) {
              const geoId = measure.relationships.geographical_area.data.id;
              const geoInfo = geoAreaMap.get(geoId);
              if (geoInfo) {
                geographicalArea = `${geoInfo.description} (${geoInfo.id})`;
              } else {
                geographicalArea = `Area ID: ${geoId}`;
              }
            }
            
            // Get duty expression
            let dutyExpression = 'N/A';
            if (measure.relationships?.duty_expression?.data?.id) {
              const dutyId = measure.relationships.duty_expression.data.id;
              const dutyInfo = dutyExpressionMap.get(dutyId);
              if (dutyInfo && dutyInfo.verbose_duty) {
                dutyExpression = dutyInfo.verbose_duty;
              }
            }
            
            console.log(`- Measure ID: ${measure.id}`);
            console.log(`  Type: ${measureType}`);
            console.log(`  Geography: ${geographicalArea}`);
            console.log(`  Duty: ${dutyExpression}`);
            console.log(`  Effective From: ${measureAttributes.effective_start_date || 'N/A'}`);
            console.log(`  Import/Export: ${measureAttributes.import ? 'Import' : ''}${measureAttributes.export ? 'Export' : ''}`);
          }
        } else {
          console.log('\nNo measures found in the included data.');
        }
      } else {
        console.log('\nNo included data found in the response.');
      }
    } else {
      console.log('Invalid response format for commodity details.');
      if (response.data) {
        console.log('Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
      }
    }
  } catch (error: unknown) {
    console.error(`Error getting details for commodity code ${commodityCode}:`, (error as Error).message);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('-------------------------------------------------\n');
}

// Run the test
testUkTradeApi().catch((error: unknown) => {
  console.error('Test failed with error:', (error as Error).message);
  process.exit(1);
}); 