'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { FADE_IN_ANIMATION } from '@/lib/animation';
import { cn } from '@/utils/cn';
import { useAssessment } from '@/contexts/assessment-context';

export function BusinessProfileStep() {
  const { dispatch } = useAssessment();
  const [url, setUrl] = React.useState('');
  const [isAnalysing, setIsAnalysing] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const handleAnalyse = async () => {
    if (!url) {
      setError('Please enter a valid website URL');
      return;
    }
    
    setIsAnalysing(true);
    setError('');
    dispatch({ type: 'SET_ANALYSING', payload: true });
    
    try {
      // Make API call to analyse the website
      const response = await fetch('/api/extract-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyse website');
      }
      
      const data = await response.json();
      console.log('Analysis result:', data);
      
      // Update the assessment context with the result
      dispatch({ type: 'SET_BUSINESS_PROFILE', payload: data.data });
      
      // Move to the next step
      dispatch({ type: 'SET_STEP', payload: 2 });
      
    } catch (err) {
      console.error('Error analysing website:', err);
      setError('Failed to analyse the website. Please try again or enter information manually.');
    } finally {
      setIsAnalysing(false);
      dispatch({ type: 'SET_ANALYSING', payload: false });
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <motion.h1 
        className="text-3xl font-bold"
        initial="hidden"
        animate="visible"
        variants={FADE_IN_ANIMATION}
      >
        Business Profile Analysis
      </motion.h1>
      <motion.p 
        className="mt-2 text-gray-600"
        initial="hidden"
        animate="visible"
        variants={FADE_IN_ANIMATION}
        transition={{ delay: 0.1 }}
      >
        Let's start by analysing your business website to gather essential information.
      </motion.p>
      
      <motion.div 
        className="mt-6 p-4 bg-blue-600 text-white rounded-lg"
        initial="hidden"
        animate="visible"
        variants={FADE_IN_ANIMATION}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-semibold text-lg">Sarah - Export Consultant</h3>
        <p className="mt-1">
          Hi! I'm Sarah, your export consultant. I'll help analyse your website and guide you through the assessment. Please enter your business website URL below to get started.
        </p>
      </motion.div>
      
      <div className="mt-8">
        <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Business Website URL
        </label>
        <div className="flex">
          <input
            id="websiteUrl"
            type="url"
            placeholder="https://your-business.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={cn(
              'flex-1 p-3 border border-gray-300 rounded-lg mr-2',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
          />
          <button
            onClick={handleAnalyse}
            disabled={!url || isAnalysing}
            className={cn(
              'px-6 py-2.5 rounded-lg font-medium transition-colors',
              'bg-primary text-white hover:bg-primary/90',
              'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
            )}
          >
            {isAnalysing ? 'Analysing...' : 'Analyse Website'}
          </button>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Marketing Hook */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100"
      >
        <h3 className="text-sm font-semibold text-blue-900">Why this matters</h3>
        <p className="mt-1 text-sm text-blue-700">
          A thorough analysis of your business website helps us understand your current market position,
          product offerings, and potential for international expansion. This information is crucial for
          creating a tailored export strategy.
        </p>
      </motion.div>
    </div>
  );
} 