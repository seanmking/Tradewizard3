This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

1. Create a `.env.local` file in the root directory
2. Add the following API keys:

```
# API Keys
UN_COMTRADE_API_KEY=your_un_comtrade_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
OPENAI_API_KEY=your_openai_api_key

# WITS API Configuration
WITS_API_BASE_URL=https://wits.worldbank.org/API/V1/SDMX/V21/rest/data/
WITS_TARIFF_URL=https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/
WITS_TRADESTATS_URL=https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/

# Other environment variables
NODE_ENV=development
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## API Integrations

This application uses the following APIs:

- **UN Comtrade API**: For international trade data
- **WITS API**: For tariff and trade statistics data
- **Perplexity API**: For enriched market intelligence data
- **OpenAI API**: For advanced data analysis and insights

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
