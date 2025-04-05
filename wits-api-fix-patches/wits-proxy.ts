import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface MockResponse {
  metadata: {
    source: string;
    status: string;
  };
  data: any;
}

/**
 * Proxy API route for WITS API requests to avoid CORS issues
 * 
 * This endpoint handles WITS API requests by forwarding them from the server
 * rather than making them directly from the browser, bypassing CORS restrictions.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get parameters from the query
    const { 
      endpoint,
      hsCode,
      chapterCode,
      headingCode,
      query,
      limit,
      includeMetadata,
      countries,
      format,
      reporter,
      partner,
      frequency,
      year,
      startperiod,
      endperiod,
      detail,
      indicator,
      useMockData
    } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }
    
    // Get API key from environment variables
    const apiKey = process.env.WITS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'WITS API key not configured' });
    }
    
    // If useMockData is true, return mock data (only for testing)
    if (useMockData === 'true') {
      console.log('Using mock data as requested for testing');
      return sendMockResponse(req, res);
    }
    
    // Handle various WITS API formats
    let url = '';
    const params: Record<string, any> = {
      format: format || 'json',
      'subscription-key': apiKey
    };
    
    // Set up the correct URL and params based on the requested endpoint
    switch (endpoint) {
      case 'tariffs/query':
        url = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN`;
        
        // Add required path components
        if (reporter) url += `/reporter/${reporter}`;
        if (partner) url += `/partner/${partner || '000'}`;
        if (hsCode) url += `/product/${hsCode}`;
        if (year) url += `/year/${year}`;
        url += `/datatype/reported`;
        break;
        
      case 'tariffs/trains': 
        url = `https://wits.worldbank.org/API/V1/SDMX/V21/rest/data/DF_WITS_Tariff_TRAINS`;
        
        // Add the pattern A.reporter.partner.hsCode for SDMX syntax
        let sdmxPath = '/';
        if (frequency) sdmxPath += `${frequency}.`;
        if (reporter) sdmxPath += `${reporter}.`;
        if (partner) sdmxPath += `${partner}.`;
        if (hsCode) sdmxPath += `${hsCode}.`;
        sdmxPath += 'reported';
        
        url += sdmxPath;
        
        // Add period parameters
        if (startperiod) params.startperiod = startperiod;
        if (endperiod) params.endperiod = endperiod;
        if (detail) params.detail = detail;
        break;
      
      // Direct TARIFF/H6 format
      case 'TARIFF/H6':
        url = `https://wits.worldbank.org/API/V1/SDMX/V21/rest/data/TARIFF/H6`;
        
        // Add HS code to the URL path
        if (hsCode) url += `/${hsCode}`;
        break;
        
      // Nomenclature endpoints
      case 'nomenclature/search':
        url = 'https://wits.worldbank.org/API/V1/wits/datasource/trn/nomenclature/search';
        if (query) params.query = query;
        if (limit) params.limit = limit;
        if (includeMetadata) params.includeMetadata = includeMetadata;
        break;
        
      case 'nomenclature/examples':
        url = 'https://wits.worldbank.org/API/V1/wits/datasource/trn/nomenclature/examples';
        if (hsCode) params.code = hsCode;
        if (limit) params.limit = limit;
        break;
        
      case 'nomenclature/chapters':
        url = 'https://wits.worldbank.org/API/V1/wits/datasource/trn/nomenclature/chapters';
        break;
        
      case 'nomenclature/headings':
        url = 'https://wits.worldbank.org/API/V1/wits/datasource/trn/nomenclature/headings';
        if (chapterCode) params.chapterCode = chapterCode;
        break;
        
      case 'nomenclature/subheadings':
        url = 'https://wits.worldbank.org/API/V1/wits/datasource/trn/nomenclature/subheadings';
        if (headingCode) params.headingCode = headingCode;
        break;
        
      // Trade Stats endpoints  
      case 'tradestats-trade':
      case 'tradestats-tariff':
      case 'tradestats-development':
        url = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/${endpoint}`;
        if (reporter) url += `/reporter/${reporter}`;
        if (year) url += `/year/${year}`;
        if (partner) url += `/partner/${partner}`;
        if (hsCode) url += `/product/${hsCode}`;
        if (indicator) url += `/indicator/${indicator}`;
        break;
        
      default:
        return res.status(400).json({ error: `Invalid endpoint: ${endpoint}` });
    }
    
    console.log(`Proxying request to: ${url}`);
    console.log('With params:', JSON.stringify(params));
    
    try {
      // Make the request to the WITS API
      const response = await axios.get(url, {
        params,
        headers: {
          'Content-Type': 'application/json',
        },
        // Increase timeout for potentially slow API
        timeout: 30000
      });
      
      // Return the response from the WITS API
      console.log(`WITS API response status: ${response.status}`);
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('WITS API request failed:', error.message);
      
      // Return the actual error
      if (error.response) {
        return res.status(error.response.status).json({
          error: 'WITS API error',
          status: error.response.status,
          message: error.message,
          details: error.response.data
        });
      } else {
        return res.status(500).json({
          error: 'WITS API request failed',
          message: error.message
        });
      }
    }
  } catch (error: any) {
    console.error('WITS API proxy error:', error.message);
    
    // Return appropriate error response
    return res.status(500).json({ 
      error: 'WITS API proxy error', 
      message: error.message 
    });
  }
}

/**
 * Generate mock data for WITS API response based on the requested endpoint
 * Only used when explicitly requested for testing
 */
function sendMockResponse(req: NextApiRequest, res: NextApiResponse) {
  const { endpoint, hsCode, chapterCode, headingCode } = req.query;
  let mockData: MockResponse = {
    metadata: {
      source: 'mock-data',
      status: 'success'
    },
    data: null
  };
  
  // Generate appropriate mock data based on the endpoint
  switch (String(endpoint)) {
    case 'nomenclature/chapters':
      mockData.data = {
        chapters: [
          { code: '01', title: 'Live animals' },
          { code: '02', title: 'Meat and edible meat offal' },
          { code: '84', title: 'Machinery, mechanical appliances, etc' },
          { code: '85', title: 'Electrical machinery and equipment' }
        ]
      };
      break;
      
    case 'nomenclature/headings':
      mockData.data = {
        headings: [
          { code: '8471', title: 'Automatic data processing machines and units thereof' },
          { code: '8472', title: 'Other office machines' },
          { code: '8473', title: 'Parts and accessories for machines of 84.70 to 84.72' }
        ]
      };
      break;
      
    case 'nomenclature/subheadings':
      mockData.data = {
        subheadings: [
          { code: '847130', title: 'Portable automatic data processing machines, weighing not more than 10 kg' },
          { code: '847141', title: 'Other automatic data processing machines comprising in the same housing a CPU and input/output unit' },
          { code: '847149', title: 'Other automatic data processing machines, presented in the form of systems' }
        ]
      };
      break;
      
    case 'nomenclature/search':
      mockData.data = {
        products: [
          { 
            productCode: hsCode || '847130', 
            productName: 'Portable automatic data processing machines, weighing not more than 10 kg',
            relevance: 0.95
          }
        ]
      };
      break;
      
    case 'nomenclature/examples':
      mockData.data = {
        examples: [
          { description: 'Laptop computer', hsCode: hsCode || '847130' },
          { description: 'Tablet computer', hsCode: hsCode || '847130' }
        ]
      };
      break;
      
    case 'tariffs/query':
    case 'TARIFF/H6':
      mockData.data = {
        dataSets: [{}],
        structure: {
          descriptions: [{ description: `Tariff data for HS code ${hsCode || '847130'}` }],
          dimensions: {
            section: 'Section XVI: Machinery and Mechanical Appliances',
            chapter: 'Chapter 84: Nuclear reactors, boilers, machinery'
          }
        }
      };
      break;
      
    case 'tariffs/trains':
      mockData.data = {
        dataSets: [{}],
        observation: [{ value: 5.0 }] // Mock 5% tariff rate
      };
      break;
      
    default:
      mockData.data = { message: 'Mock data for unsupported endpoint' };
  }
  
  // Return mock data with 200 status
  console.log('Returning mock data for endpoint:', endpoint);
  return res.status(200).json(mockData);
} 