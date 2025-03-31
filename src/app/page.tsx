'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', my: 6 }}>
        <Typography variant="h3" color="primary" gutterBottom>
          TradeWizard 3.0
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your Export Readiness Assistant
        </Typography>
        
        <Box sx={{ mt: 6, display: 'flex', gap: 3, justifyContent: 'center' }}>
          <Link href="/assessment" passHref style={{ textDecoration: 'none' }}>
            <Button variant="contained" size="large">
              Start Assessment
            </Button>
          </Link>
          
          <Link href="/report" passHref style={{ textDecoration: 'none' }}>
            <Button variant="outlined" size="large">
              View Report Demo
            </Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
} 