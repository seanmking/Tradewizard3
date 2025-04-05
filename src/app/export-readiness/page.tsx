'use client';

import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { ExportReadinessAssessment } from '../../pages/ExportReadinessAssessment';

export default function ExportReadinessPage() {
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <ExportReadinessAssessment />
    </Box>
  );
} 