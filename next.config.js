/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use SWC instead of Babel for faster compilation
  swcMinify: true,
  // Keep server-only packages in the server bundle
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', 'undici']
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