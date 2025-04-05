import React, { useState } from 'react';
import { EnhancedHSCodeClassification } from './index';

const ClassificationDemo: React.FC = () => {
  const [hsCode, setHsCode] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isClassified, setIsClassified] = useState<boolean>(false);

  // Sample product data
  const productName = "Wireless Bluetooth Headphones";
  const productDescription = "Over-ear noise cancelling wireless headphones with Bluetooth 5.0, 30-hour battery life, and built-in microphone for calls.";

  const handleClassificationComplete = (selectedHsCode: string, confidenceScore: number) => {
    setHsCode(selectedHsCode);
    setConfidence(confidenceScore);
    setIsClassified(true);
  };

  const formatHSCode = (code: string): string => {
    if (!code) return '';
    const cleanCode = code.replace(/\./g, '');
    if (cleanCode.length <= 2) return cleanCode;
    if (cleanCode.length <= 4) return `${cleanCode.substring(0, 2)}.${cleanCode.substring(2)}`;
    return `${cleanCode.substring(0, 2)}.${cleanCode.substring(2, 4)}.${cleanCode.substring(4)}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HS Code Classification Demo</h1>
        <p className="text-lg text-gray-600">
          Try out our enhanced HS Code classification system with the sample product below.
        </p>
      </div>

      {isClassified && (
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Classification Result</h2>
          <div className="flex items-center bg-green-50 p-4 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Product</p>
              <p className="font-medium text-gray-900">{productName}</p>
            </div>
            <div className="px-6">
              <p className="text-sm text-gray-500">HS Code</p>
              <p className="font-medium text-gray-900">{formatHSCode(hsCode)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Confidence</p>
              <p className="font-medium text-gray-900">{Math.round(confidence)}%</p>
            </div>
          </div>
          <button 
            className="mt-4 text-purple-600 font-medium"
            onClick={() => setIsClassified(false)}
          >
            Try again
          </button>
        </div>
      )}

      {!isClassified && (
        <EnhancedHSCodeClassification
          productName={productName}
          productDescription={productDescription}
          onClassificationComplete={handleClassificationComplete}
        />
      )}
    </div>
  );
};

export default ClassificationDemo; 