'use client';

import React from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

// Define a static theme object that avoids function references
const theme = createTheme({
  palette: {
    primary: {
      main: '#4299e1',
      dark: '#2b6cb0',
      light: '#63b3ed',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1a365d',
      dark: '#0c2546',
      light: '#2a4a73',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a365d',
      secondary: '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#1a365d',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      color: '#1a365d',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#1a365d',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#1a365d',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#1a365d',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#1a365d',
    },
    subtitle1: {
      fontSize: '1rem',
      color: '#4a5568',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#4a5568',
    },
    body1: {
      fontSize: '1rem',
      color: '#4a5568',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#4a5568',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

interface MUIProviderProps {
  children: React.ReactNode;
}

export function MUIProvider({ children }: MUIProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 