'use client';

import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent, Stack } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          TradeWizard 3.0
        </Typography>
        
        <Typography variant="h5" gutterBottom align="center" color="text.secondary" sx={{ mb: 6 }}>
          Your AI-powered export companion
        </Typography>
        
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Export Readiness Assessment
              </Typography>
              <Typography variant="body1" paragraph>
                Get a personalized assessment of your products' export readiness. 
                Our AI will help classify your products and provide tailored recommendations.
              </Typography>
              <Button 
                component={Link} 
                href="/export-readiness" 
                variant="contained" 
                color="primary"
              >
                Start Assessment
              </Button>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Market Research
              </Typography>
              <Typography variant="body1" paragraph>
                Explore potential markets for your products. 
                Our AI will analyze global trade data to find the best opportunities.
              </Typography>
              <Button 
                component={Link} 
                href="/market-research" 
                variant="contained" 
                color="secondary"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
} 