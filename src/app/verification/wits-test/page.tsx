'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface WITSResponse {
  metadata?: {
    source?: string;
    status?: string;
  };
  data?: any;
  error?: string;
  message?: string;
  status?: number;
  details?: any;
}

export default function WITSTestPage() {
  const [results, setResults] = useState<WITSResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState('nomenclature/chapters');
  const [hsCode, setHsCode] = useState('');
  const [selectedTest, setSelectedTest] = useState('chapters');
  const [useMockData, setUseMockData] = useState(false);
  const [isApiAlive, setIsApiAlive] = useState<boolean | null>(null);

  // Check if the WITS API is alive on component mount
  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axios.get<WITSResponse>('/api/wits-proxy', { 
          params: { 
            endpoint: 'nomenclature/chapters',
          }
        });
        
        setIsApiAlive(true);
      } catch (err: any) {
        console.error('API check error:', err);
        setIsApiAlive(false);
        setError(`WITS API is not responding: ${err.response?.data?.message || err.message}`);
      }
    };
    
    checkApiStatus();
  }, []);

  const testWITSApi = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      let params: any = { 
        endpoint,
        useMockData: useMockData ? 'true' : 'false'
      };
      
      switch (selectedTest) {
        case 'chapters':
          params = { 
            endpoint: 'nomenclature/chapters',
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
        case 'headings':
          params = { 
            endpoint: 'nomenclature/headings', 
            chapterCode: hsCode,
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
        case 'subheadings':
          params = { 
            endpoint: 'nomenclature/subheadings', 
            headingCode: hsCode,
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
        case 'search':
          params = { 
            endpoint: 'nomenclature/search', 
            query: 'laptop', 
            limit: 10,
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
        case 'examples':
          params = { 
            endpoint: 'nomenclature/examples', 
            hsCode: hsCode,
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
        case 'tariff':
          params = {
            endpoint: 'TARIFF/H6',
            hsCode: hsCode,
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
        case 'tariffTrain':
          params = {
            endpoint: 'tariffs/trains',
            frequency: 'A',
            reporter: '840', // USA
            partner: '000', // World
            hsCode: hsCode,
            startperiod: '2020',
            endperiod: '2021',
            useMockData: useMockData ? 'true' : 'false'
          };
          break;
      }
      
      console.log('Making request with params:', params);
      const response = await axios.get<WITSResponse>('/api/wits-proxy', { params });
      console.log('WITS API Response:', response.data);
      setResults(response.data);
    } catch (err: any) {
      console.error('WITS API Test Error:', err);
      setError(getErrorMessage(err));
      
      // Set the error response for display
      if (err.response?.data) {
        setResults(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract a useful error message
  const getErrorMessage = (error: any): string => {
    if (error.response?.data?.error) {
      const errorData = error.response.data;
      return `${errorData.error}${errorData.message ? ': ' + errorData.message : ''}${errorData.status ? ' (Status: ' + errorData.status + ')' : ''}`;
    }
    return error.message || 'Unknown error occurred';
  };

  // Function to determine if the response is using mock data
  const isMockData = (data: WITSResponse | null) => {
    return data?.metadata?.source === 'mock-data';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WITS API Test</h1>
      
      {isApiAlive !== null && (
        <div className={`p-3 mb-4 rounded ${isApiAlive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-bold">
            {isApiAlive 
              ? '✅ WITS API is responding' 
              : '❌ WITS API is not responding'}
          </p>
        </div>
      )}
      
      <p className="mb-4">
        This page tests the WITS API integration via our proxy to ensure it's working correctly.
        Any errors will be displayed clearly rather than automatically falling back to mock data.
      </p>
      
      <div className="mb-4">
        <label className="flex items-center mb-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={useMockData}
            onChange={(e) => setUseMockData(e.target.checked)}
            className="mr-2 h-4 w-4"
          />
          <span className="text-gray-700">
            Use mock data for testing (bypasses real API calls)
          </span>
        </label>
        {useMockData && (
          <div className="text-sm text-amber-600 ml-6">
            ⚠️ Mock mode enabled: API calls will return test data, not real results
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Test Type:</label>
        <select 
          value={selectedTest} 
          onChange={(e) => {
            setSelectedTest(e.target.value);
            switch (e.target.value) {
              case 'chapters':
                setEndpoint('nomenclature/chapters');
                setHsCode('');
                break;
              case 'headings':
                setEndpoint('nomenclature/headings');
                setHsCode('85');
                break;
              case 'subheadings':
                setEndpoint('nomenclature/subheadings');
                setHsCode('8517');
                break;
              case 'search':
                setEndpoint('nomenclature/search');
                setHsCode('');
                break;
              case 'examples':
                setEndpoint('nomenclature/examples');
                setHsCode('851712');
                break;
              case 'tariff':
                setEndpoint('TARIFF/H6');
                setHsCode('851712');
                break;
              case 'tariffTrain':
                setEndpoint('tariffs/trains');
                setHsCode('851712');
                break;
            }
          }}
          className="p-2 border rounded w-full max-w-md"
        >
          <option value="chapters">Get All Chapters</option>
          <option value="headings">Get Headings (requires Chapter Code)</option>
          <option value="subheadings">Get Subheadings (requires Heading Code)</option>
          <option value="search">Search (uses "laptop" as query)</option>
          <option value="examples">Get Examples (requires HS Code)</option>
          <option value="tariff">Get Tariff Data (TARIFF/H6)</option>
          <option value="tariffTrain">Get Tariff Trains Data</option>
        </select>
      </div>
      
      {(selectedTest === 'headings' || 
        selectedTest === 'subheadings' || 
        selectedTest === 'examples' ||
        selectedTest === 'tariff' ||
        selectedTest === 'tariffTrain') && (
        <div className="mb-4">
          <label className="block mb-2">
            {selectedTest === 'headings' ? 'Chapter Code:' : 
             selectedTest === 'subheadings' ? 'Heading Code:' : 
             'HS Code:'}
          </label>
          <input
            type="text"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder={
              selectedTest === 'headings' ? 'e.g., 85' : 
              selectedTest === 'subheadings' ? 'e.g., 8517' : 
              'e.g., 851712'
            }
            className="p-2 border rounded w-full max-w-md"
          />
        </div>
      )}
      
      <button
        onClick={testWITSApi}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test WITS API'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">
            {results.error ? 'Error Response:' : 'Results:'}
          </h3>
          
          {isMockData(results) && (
            <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              <strong>Note:</strong> This is mock data, not actual API results.
            </div>
          )}
          
          {results.error && (
            <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-800 rounded">
              <strong>API Error:</strong> {results.error}
              {results.message && <p>Message: {results.message}</p>}
              {results.status && <p>Status: {results.status}</p>}
            </div>
          )}
          
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 