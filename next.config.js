/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use SWC instead of Babel for faster compilation
  swcMinify: true,
  // Keep server-only packages in the server bundle
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', 'undici']
  },
  // Environment variables that will be exposed to the client
  env: {
    // Note: We only expose the base URLs, not the API keys for security reasons
    MARKET_DATA_API_URL: process.env.MARKET_DATA_API_URL,
    TARIFF_API_URL: process.env.TARIFF_API_URL,
    COMPETITOR_API_URL: process.env.COMPETITOR_API_URL,
    WITS_API_BASE_URL: process.env.WITS_API_BASE_URL
  },
  // Configure webpack for node modules compatibility
  webpack: (config, { isServer }) => {
    // Handle node.js modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        http2: false,
        path: false,
        os: false,
        stream: false,
        https: false,
        http: false,
        zlib: false,
        crypto: false,
      };
    }
    
    // Enable top-level await
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
    };
    
    return config;
  },
};

module.exports = nextConfig; 