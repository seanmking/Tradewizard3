/**
 * HS Code Classification Module
 * Provides services for classifying products using HS codes through multiple methods
 */

// Export services
export { HsCodeMCPService } from './hs-code-mcp.service';
export { WITSAPIClient } from './wits-api-client';

// Export all types
export * from './hs-code.types';

// Create and export singleton instance for easier imports
import { HsCodeMCPService } from './hs-code-mcp.service';
export const hsCodeMCPService = new HsCodeMCPService();

// Default export for convenience
export default hsCodeMCPService;