import React from 'react';
import initializeEnvironment from '../utils/init-environment';
import { ApiKeyManager } from '../utils/api-key-manager';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Initialize environment and API keys
if (typeof window !== 'undefined') {
  initializeEnvironment();
  ApiKeyManager.getInstance(); // Initialize API Key Manager
}

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
