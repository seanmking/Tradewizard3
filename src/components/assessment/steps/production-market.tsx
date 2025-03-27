'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAssessment } from '@/contexts/assessment-context';
import { cn } from '@/utils/cn';
import type { ProductionCapacity, MarketInfo } from '@/contexts/assessment-context';

export function ProductionMarketStep() {
  const { state, dispatch } = useAssessment();
  const [productionCapacity, setProductionCapacity] = React.useState<ProductionCapacity>(
    state.productionCapacity || {
      monthlyCapacity: 0,
      unit: 'units',
      leadTime: 0,
      minimumOrderQuantity: 0,
    }
  );
  const [marketInfo, setMarketInfo] = React.useState<MarketInfo>(
    state.marketInfo || {
      targetMarkets: [],
      existingMarkets: [],
      competitorAnalysis: '',
    }
  );

  const handleNext = () => {
    if (productionCapacity.monthlyCapacity <= 0 || productionCapacity.leadTime <= 0) return;

    dispatch({ type: 'SET_PRODUCTION_CAPACITY', payload: productionCapacity });
    dispatch({ type: 'SET_MARKET_INFO', payload: marketInfo });
    dispatch({ type: 'SET_STEP', payload: 4 }); // Move to next step
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Production & Market Assessment</h2>
        <p className="mt-2 text-gray-600">
          Let's evaluate your production capacity and identify potential target markets.
        </p>
      </div>

      {/* Production Capacity */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Production Capacity</h3>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="monthly-capacity" className="block text-sm font-medium text-gray-700">
              Monthly Production Capacity *
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="monthly-capacity"
                type="number"
                min="0"
                value={productionCapacity.monthlyCapacity}
                onChange={(e) =>
                  setProductionCapacity({
                    ...productionCapacity,
                    monthlyCapacity: parseInt(e.target.value) || 0,
                  })
                }
                className={cn(
                  'flex-1 rounded-lg border border-gray-300 px-4 py-2',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                )}
              />
              <select
                value={productionCapacity.unit}
                onChange={(e) =>
                  setProductionCapacity({
                    ...productionCapacity,
                    unit: e.target.value as 'units' | 'kg' | 'tons' | 'pieces',
                  })
                }
                className={cn(
                  'rounded-lg border border-gray-300 px-4 py-2',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                )}
              >
                <option value="units">Units</option>
                <option value="kg">Kilograms</option>
                <option value="tons">Tons</option>
                <option value="pieces">Pieces</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="lead-time" className="block text-sm font-medium text-gray-700">
              Lead Time (days) *
            </label>
            <input
              id="lead-time"
              type="number"
              min="0"
              value={productionCapacity.leadTime}
              onChange={(e) =>
                setProductionCapacity({
                  ...productionCapacity,
                  leadTime: parseInt(e.target.value) || 0,
                })
              }
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>

          <div>
            <label htmlFor="moq" className="block text-sm font-medium text-gray-700">
              Minimum Order Quantity *
            </label>
            <input
              id="moq"
              type="number"
              min="0"
              value={productionCapacity.minimumOrderQuantity}
              onChange={(e) =>
                setProductionCapacity({
                  ...productionCapacity,
                  minimumOrderQuantity: parseInt(e.target.value) || 0,
                })
              }
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>
        </div>
      </div>

      {/* Market Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Market Information</h3>
        
        <div className="grid gap-6">
          <div>
            <label htmlFor="target-markets" className="block text-sm font-medium text-gray-700">
              Target Markets
            </label>
            <input
              id="target-markets"
              type="text"
              placeholder="e.g., USA, EU, Japan (comma separated)"
              value={marketInfo.targetMarkets.join(', ')}
              onChange={(e) =>
                setMarketInfo({
                  ...marketInfo,
                  targetMarkets: e.target.value.split(',').map((m) => m.trim()),
                })
              }
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>

          <div>
            <label htmlFor="existing-markets" className="block text-sm font-medium text-gray-700">
              Existing Markets
            </label>
            <input
              id="existing-markets"
              type="text"
              placeholder="e.g., Local, Regional (comma separated)"
              value={marketInfo.existingMarkets.join(', ')}
              onChange={(e) =>
                setMarketInfo({
                  ...marketInfo,
                  existingMarkets: e.target.value.split(',').map((m) => m.trim()),
                })
              }
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>

          <div>
            <label htmlFor="competitor-analysis" className="block text-sm font-medium text-gray-700">
              Competitor Analysis
            </label>
            <textarea
              id="competitor-analysis"
              placeholder="Describe your main competitors and their market position..."
              value={marketInfo.competitorAnalysis}
              onChange={(e) =>
                setMarketInfo({
                  ...marketInfo,
                  competitorAnalysis: e.target.value,
                })
              }
              rows={4}
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          disabled={productionCapacity.monthlyCapacity <= 0 || productionCapacity.leadTime <= 0}
          className={cn(
            'px-8 py-3 rounded-lg font-medium transition-colors',
            'bg-primary text-white hover:bg-primary/90',
            'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
          )}
        >
          Continue to Certifications & Budget
        </button>
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
          Understanding your production capacity and target markets is crucial for developing a
          successful export strategy. This information helps us identify potential challenges and
          opportunities in your chosen markets.
        </p>
      </motion.div>
    </div>
  );
} 