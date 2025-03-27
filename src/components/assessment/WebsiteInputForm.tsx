'use client';

import { useState } from 'react';
import { WebsiteAnalyzerService } from '../../services/website-analyzer.service';
import { BusinessProfile } from '../../types/business-profile.types';

interface WebsiteInputFormProps {
  onComplete: (businessProfile: BusinessProfile) => void;
}

export const WebsiteInputForm = ({ onComplete }: WebsiteInputFormProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const websiteAnalyzer = new WebsiteAnalyzerService();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a website URL');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const businessProfile = await websiteAnalyzer.extractBusinessInfo(url);
      onComplete(businessProfile);
    } catch (error) {
      setError('Failed to analyze website. Please check the URL and try again.');
      console.error('Website analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-1">
          Business Website URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="website-url"
            name="website-url"
            placeholder="https://your-business-website.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
            required
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Enter your business website URL to automatically extract information
        </p>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Website...
            </div>
          ) : (
            'Analyze Website'
          )}
        </button>
      </div>
    </form>
  );
}; 