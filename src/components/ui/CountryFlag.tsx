'use client';

import React from 'react';
import { Box } from '@mui/material';

interface CountryFlagProps {
  countryCode: string;
  size?: 'small' | 'medium' | 'large';
}

export function CountryFlag({ countryCode, size = 'medium' }: CountryFlagProps) {
  // Size mapping
  const sizeMap = {
    small: { width: 24, height: 16 },
    medium: { width: 36, height: 24 },
    large: { width: 48, height: 32 },
  };
  
  const { width, height } = sizeMap[size];
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(https://flagcdn.com/w320/${countryCode.toLowerCase()}.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 1,
      }}
    />
  );
} 