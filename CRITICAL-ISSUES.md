# TradeWizard 3.0 - Critical Issues

## High Priority Issues

1. **API Key Configuration Issues** 
   - **File:** `.env.local`
   - **Problem:** HS Code API and WITS API keys not properly configured
   - **Fix:** Update API keys in environment variables file
   - **Impact:** Product classification and HS code selection fails without this

2. **OpenAI Authentication Failure** 
   - **File:** `src/ai-agent/extractors/llm-website-extractor.ts`
   - **Problem:** Authentication fails on first attempt due to URL/key format mismatch
   - **Fix:** Align OpenAI API URL with key format (ChatGPT Project vs. Standard API)
   - **Impact:** Causes extra latency and potential for complete extraction failure

3. **Perplexity Over-Filtering Products** 
   - **File:** `src/ai-agent/extractors/llm-website-extractor.ts`
   - **Problem:** Perplexity validation is too strict and filters out valid products
   - **Fix:** Lower confidence thresholds in `validateWithPerplexity` method
   - **Impact:** No products found for classification and assessment

4. **HSCodeNavigator Integration Issues** 
   - **File:** `src/components/assessment/steps/product-selection.tsx`
   - **Problem:** HS code selection not fully integrated with product editing
   - **Fix:** Complete implementation of HS code selection UI
   - **Impact:** Users can't properly categorize products for export assessment

5. **Product Consolidation Not Working** 
   - **File:** `src/services/product/productConsolidation.service.ts`
   - **Problem:** Product attribute extraction methods incomplete or failing
   - **Fix:** Complete implementation of attribute extraction methods
   - **Impact:** Similar products not consolidated, affecting assessment quality

## Steps to Reproduce

1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000
3. Complete the business profile step
4. Observe in the console:
   - "HS Code API key not configured"
   - "WITS API key not configured"
5. Attempt to edit a product and select an HS code
6. Observe failures in product classification

## Troubleshooting Tips

1. Run the API key checker script: `./fix-api-keys.sh`
2. Check the console for authentication errors
3. Test the product extraction with a real e-commerce site (not example.com)
4. Set environment variable `LOG_LEVEL=debug` for more verbose logging

## Recent Changes

Recent code changes have addressed:
1. Syntax errors in the `setImmediate` implementation
2. Logger calls replaced with console equivalents
3. Restructured try-catch blocks in extraction service
4. Improved error handling for API failures

These changes allow the application to run without crashing, but the core functionality issues listed above remain to be fixed. 