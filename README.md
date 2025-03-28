# TradeWizard 3.0

TradeWizard is an intelligent business analysis tool that combines advanced web scraping with AI-powered insights.

## Features

- **Smart Web Scraping**: Tiered approach using Axios+Cheerio for static sites and Puppeteer for JavaScript-heavy pages
- **Perplexity AI Integration**: Intelligent validation and enrichment of business data
- **Efficient Caching**: Built-in caching system for API responses
- **Robust Error Handling**: Comprehensive error handling and retry mechanisms

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Create .env.local file
cp .env.example .env.local

# Add your Perplexity API key
PERPLEXITY_API_KEY=your_api_key_here
```

3. Start the development server:
```bash
npm run dev
```

## Architecture

### Web Scraping

The system uses a tiered approach to web scraping:
1. First attempts with Axios+Cheerio (faster, lighter)
2. Falls back to Puppeteer for JavaScript-heavy sites
3. Intelligent detection of when to use each method

### Intelligence MCP

The Intelligence MCP powered by Perplexity AI:
1. Validates extracted business and product information
2. Enriches data with additional details
3. Provides confidence scores for extracted information
4. Implements caching and retry mechanisms

## Usage

```typescript
// Example usage of the scraping service
const scraper = new ScrapingService();
const result = await scraper.scrapeUrl('https://example.com');

// Example usage of the Intelligence MCP
const intelligenceMCP = new IntelligenceMCPService();
const enrichedData = await intelligenceMCP.enrichBusinessData({
  sourceUrl: 'https://example.com',
  extractedEntities: [/* ... */]
});
```

## Error Handling

The system includes comprehensive error handling:
- Automatic retries with exponential backoff
- Fallback mechanisms for failed scraping attempts
- Detailed logging of errors and warnings
- Cache management for failed requests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.
