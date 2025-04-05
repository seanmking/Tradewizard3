'use client';

import { useState } from 'react';
import { createOpenAIClient } from '@/utils/openai-client';

export default function OpenAITestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const testOpenAI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const openai = createOpenAIClient();
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello and confirm that Project API key authentication is working' }],
        max_tokens: 100
      });
      
      setResult(response.choices[0].message.content || 'No response content');
    } catch (err: any) {
      console.error('OpenAI test failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">OpenAI Project API Key Test</h1>
      
      <button
        onClick={testOpenAI}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
      >
        {loading ? 'Testing...' : 'Test OpenAI Integration'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-500 rounded">
          <h2 className="font-bold text-red-700">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && !error && (
        <div className="mt-4 p-4 bg-green-100 border border-green-500 rounded">
          <h2 className="font-bold text-green-700">Success!</h2>
          <p className="mt-2">{result}</p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Information</h2>
        <p>This page tests if your OpenAI Project API key is properly configured by making a real API call.</p>
        <p className="mt-2">If successful, you'll see a response from the AI. If there's an error, check your API key configuration in <code>.env.local</code>.</p>
      </div>
    </div>
  );
} 