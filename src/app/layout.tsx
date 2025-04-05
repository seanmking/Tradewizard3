import React from 'react';
import initializeEnvironment from '../utils/init-environment';
import { ApiKeyManager } from '../utils/api-key-manager';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from './providers';

// Fonts configuration
const inter = Inter({
  subsets: ["latin"],
});

// Initialize environment and API keys on the server side
// This ensures the environment is ready before any server components
if (typeof window === 'undefined') {
  initializeEnvironment();
  ApiKeyManager.getInstance(); // Initialize API Key Manager
}

// Client-side initialization will happen in the providers.tsx file
// which is wrapped in 'use client'

// This metadata export needs to be outside the client component
export const metadata: Metadata = {
  title: "TradeWizard 3.0",
  description: "Intelligent trade compliance platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
