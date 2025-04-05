import { HSCode } from '../../types/classification.types';

export interface WITSCacheConfig {
  // Different TTLs for different data types (in milliseconds)
  ttl: {
    hsCode: number;        // Basic HS code data
    tariff: number;        // Tariff information
    restrictions: number;  // Trade restrictions
    metadata: number;     // Additional metadata
  };
  maxSize: number;        // Maximum cache size
  staleness: {
    warning: number;      // Time before showing staleness warning
    critical: number;     // Time before data is considered critically stale
  };
}

export interface WITSCacheEntry<T> {
  data: T;
  timestamp: number;
  lastVerified: number;   // Last time data was verified with WITS API
  version: string;        // Version of the HS code data
  source: 'api' | 'fallback' | 'user';
  staleLevel: 'fresh' | 'warning' | 'critical';
  metadata?: {
    modifiedBy?: string;
    modifiedAt?: number;
    changeReason?: string;
  };
}

export interface WITSChangelogEntry {
  id: string;
  timestamp: number;
  version: string;
  hsCode: string;
  type: 'update' | 'delete' | 'create';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  isCritical: boolean;  // Indicates if change affects existing classifications
  affectedClassifications?: string[]; // IDs of classifications that need review
}

export interface WITSQueueItem {
  id: string;
  hsCode: string;
  operation: 'fetch' | 'update' | 'verify';
  priority: number;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// Default configuration
export const DEFAULT_WITS_CONFIG: WITSCacheConfig = {
  ttl: {
    hsCode: 24 * 60 * 60 * 1000,      // 24 hours
    tariff: 12 * 60 * 60 * 1000,      // 12 hours
    restrictions: 6 * 60 * 60 * 1000,  // 6 hours
    metadata: 7 * 24 * 60 * 60 * 1000  // 7 days
  },
  maxSize: 10000,
  staleness: {
    warning: 12 * 60 * 60 * 1000,     // 12 hours
    critical: 48 * 60 * 60 * 1000     // 48 hours
  }
}; 