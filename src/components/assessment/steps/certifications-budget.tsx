'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAssessment } from '@/contexts/assessment-context';
import { cn } from '@/utils/cn';
import type { Certification, Budget } from '@/contexts/assessment-context';

const commonCertifications = [
  { id: 'iso9001', name: 'ISO 9001 - Quality Management' },
  { id: 'iso14001', name: 'ISO 14001 - Environmental Management' },
  { id: 'haccp', name: 'HACCP - Food Safety' },
  { id: 'fda', name: 'FDA Registration' },
  { id: 'ce', name: 'CE Marking (European Conformity)' },
  { id: 'halal', name: 'Halal Certification' },
  { id: 'fair-trade', name: 'Fair Trade Certification' },
];

export function CertificationsBudgetStep() {
  const { state, dispatch } = useAssessment();
  const [certifications, setCertifications] = React.useState<Certification[]>(
    state.certifications || []
  );
  const [budget, setBudget] = React.useState<Budget>(
    state.budget || {
      amount: 0,
      currency: 'USD',
      timeline: 12,
      allocation: {
        certifications: 0,
        marketing: 0,
        logistics: 0,
        other: 0,
      },
    }
  );

  const handleCertificationToggle = (cert: typeof commonCertifications[0]) => {
    const existing = certifications.find((c) => c.id === cert.id);
    if (existing) {
      setCertifications(certifications.filter((c) => c.id !== cert.id));
    } else {
      setCertifications([
        ...certifications,
        { id: cert.id, name: cert.name, status: 'planned' },
      ]);
    }
  };

  const handleCertificationStatusChange = (id: string, status: Certification['status']) => {
    setCertifications(
      certifications.map((cert) =>
        cert.id === id ? { ...cert, status } : cert
      )
    );
  };

  const handleBudgetAllocationChange = (
    key: keyof Budget['allocation'],
    value: number
  ) => {
    setBudget((prev) => ({
      ...prev,
      allocation: {
        ...prev.allocation,
        [key]: value,
      },
    }));
  };

  const handleFinish = () => {
    if (budget.amount <= 0) return;

    dispatch({ type: 'SET_CERTIFICATIONS', payload: certifications });
    dispatch({ type: 'SET_BUDGET', payload: budget });
    // Here you would typically generate the report
    console.log('Assessment completed!');
  };

  const totalAllocation = Object.values(budget.allocation).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Certifications & Budget Planning</h2>
        <p className="mt-2 text-gray-600">
          Let's plan your certification requirements and budget allocation for your export journey.
        </p>
      </div>

      {/* Certifications */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Required Certifications</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {commonCertifications.map((cert) => {
            const selected = certifications.find((c) => c.id === cert.id);
            return (
              <div
                key={cert.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors cursor-pointer',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                )}
                onClick={() => handleCertificationToggle(cert)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{cert.name}</h4>
                    {selected && (
                      <select
                        value={selected.status}
                        onChange={(e) =>
                          handleCertificationStatusChange(
                            cert.id,
                            e.target.value as Certification['status']
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'mt-2 text-sm rounded-md border-gray-300',
                          'focus:border-primary focus:ring-2 focus:ring-primary/20'
                        )}
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="obtained">Obtained</option>
                      </select>
                    )}
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300'
                    )}
                  >
                    {selected && '✓'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Planning */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Budget Planning</h3>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700">
              Total Budget *
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="budget-amount"
                type="number"
                min="0"
                value={budget.amount}
                onChange={(e) =>
                  setBudget({
                    ...budget,
                    amount: parseInt(e.target.value) || 0,
                  })
                }
                className={cn(
                  'flex-1 rounded-lg border border-gray-300 px-4 py-2',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                )}
              />
              <select
                value={budget.currency}
                onChange={(e) =>
                  setBudget({
                    ...budget,
                    currency: e.target.value,
                  })
                }
                className={cn(
                  'rounded-lg border border-gray-300 px-4 py-2',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                )}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">
              Timeline (months) *
            </label>
            <input
              id="timeline"
              type="number"
              min="1"
              max="60"
              value={budget.timeline}
              onChange={(e) =>
                setBudget({
                  ...budget,
                  timeline: parseInt(e.target.value) || 12,
                })
              }
              className={cn(
                'mt-1 w-full rounded-lg border border-gray-300 px-4 py-2',
                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
              )}
            />
          </div>
        </div>

        {/* Budget Allocation */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Budget Allocation</h4>
          
          <div className="space-y-4">
            {Object.entries(budget.allocation).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm">
                  <label htmlFor={`allocation-${key}`} className="font-medium text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <span className="text-gray-500">{value}%</span>
                </div>
                <input
                  id={`allocation-${key}`}
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) =>
                    handleBudgetAllocationChange(
                      key as keyof Budget['allocation'],
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full mt-2"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">Total Allocation</span>
            <span
              className={cn(
                'font-medium',
                totalAllocation === 100
                  ? 'text-green-600'
                  : totalAllocation > 100
                  ? 'text-red-600'
                  : 'text-gray-900'
              )}
            >
              {totalAllocation}%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleFinish}
          disabled={budget.amount <= 0 || totalAllocation !== 100}
          className={cn(
            'px-8 py-3 rounded-lg font-medium transition-colors',
            'bg-primary text-white hover:bg-primary/90',
            'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
          )}
        >
          Generate Export Readiness Report
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
          Proper certification and budget planning are essential for successful market entry.
          This helps ensure compliance with international standards and adequate resource
          allocation for your export journey.
        </p>
      </motion.div>
    </div>
  );
} 