'use client';

import * as React from 'react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          TradeWizard 3.0
        </h1>
        <p className="mb-4 text-center text-gray-600">
          Your international trade assistant
        </p>
        <div className="mt-8 flex justify-center">
          <div className="rounded-md bg-blue-500 px-4 py-2 text-white shadow-sm hover:bg-blue-600">
            Get Started
          </div>
        </div>
      </div>
    </div>
  );
}
