# WITS API Integration Fixes for TradeWizard 3.0

This document provides instructions for applying the WITS API integration fixes to resolve CORS issues and improve error handling in the TradeWizard 3.0 application.

## Overview of Changes

These fixes address the following issues:
- CORS errors when accessing the WITS API directly from the browser
- 403 Forbidden errors with tariff data endpoints
- Silent failures with mock data fallback instead of clear error messages
- Inconsistent API URL structures for different endpoint types

## Files to Update

The zip archive contains these files:
1. `wits-api-client.ts` - API client that uses the proxy approach
2. `hscode-tariff-mcp.service.ts` - Updated tariff service with proper error handling
3. `wits-proxy.ts` - New server-side proxy API route
4. `page.tsx` - Test page for verifying the integration
5. `README.md` - Instructions (this file)

## Step-by-Step Installation

1. **Create the server-side proxy API route:**
   ```bash
   # Create the directory if it doesn't exist
   mkdir -p src/pages/api
   
   # Copy the proxy implementation
   cp wits-proxy.ts src/pages/api/
   ```

2. **Update the WITS API client:**
   ```bash
   # Copy the updated client
   cp wits-api-client.ts src/utils/
   ```

3. **Update the tariff service:**
   ```bash
   # Copy the updated service
   cp hscode-tariff-mcp.service.ts src/mcp/global/hscode-tariff-mcp/
   ```

4. **Add the test page:**
   ```bash
   # Create the directory if it doesn't exist
   mkdir -p src/app/verification/wits-test
   
   # Copy the test page
   cp page.tsx src/app/verification/wits-test/
   ```

5. **Restart the application:**
   ```bash
   npm run dev
   ```

## Verification

After applying the changes, follow these steps to verify the integration:

1. Open your browser and navigate to: http://localhost:3000/verification/wits-test
2. The test page will show if the WITS API is responding correctly
3. Try different endpoints from the dropdown menu:
   - "Get All Chapters" - Should return a list of HS code chapters
   - "Get Headings" - Enter a chapter code (e.g., "85") and click Test
   - "Get Subheadings" - Enter a heading code (e.g., "8517") and click Test
   - "Search" - Uses "laptop" as a search query
   - "Get Examples" - Enter an HS code (e.g., "851712") and click Test
   - "Get Tariff Data" - Enter an HS code (e.g., "851712") and click Test

If there are errors, they will be clearly displayed on the page instead of silently using mock data.

## Server Logs

Check your server console logs to see the proxy in action. You should see messages like:

```
Proxying request to: https://wits.worldbank.org/API/V1/wits/datasource/trn/nomenclature/chapters
With params: {"format":"json","subscription-key":"your-api-key"}
WITS API response status: 200
```

## Troubleshooting

If you encounter issues:

1. Ensure your `WITS_API_KEY` is correctly set in your environment variables
2. Check the server logs for detailed error messages
3. Use the test page to isolate which specific endpoints are failing
4. Make sure all files are copied to the correct locations

## Questions or Issues?

If you have any questions or encounter issues with these fixes, please:
1. Comment on the GitHub issue
2. Include any error messages from the browser console or server logs 