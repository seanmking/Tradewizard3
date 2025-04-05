import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Collapse, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface MockDataBannerProps {
  isVisible?: boolean;
  message?: string;
}

/**
 * A banner component that displays a warning when mock data is being used.
 * This provides clear visual feedback to users during development or when
 * API keys are not configured.
 */
export function MockDataBanner({
  isVisible = true,
  message = 'Using simulated HS code data for development. Real API keys not configured.'
}: MockDataBannerProps) {
  const [open, setOpen] = useState(isVisible);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // If the visibility prop changes, update the open state
    // but only if the user hasn't manually dismissed the banner
    if (!isDismissed) {
      setOpen(isVisible);
    }
  }, [isVisible, isDismissed]);

  const handleClose = () => {
    setOpen(false);
    setIsDismissed(true);
  };

  // If the banner was dismissed or shouldn't be visible, don't render anything
  if (!open) {
    return null;
  }

  return (
    <Box sx={{ mb: 2, position: 'sticky', top: 0, zIndex: 1000 }}>
      <Collapse in={open}>
        <Alert 
          severity="warning"
          sx={{ 
            backgroundColor: '#fff9db',
            border: '1px solid #fff3bf',
            borderRadius: 1,
            '& .MuiAlert-icon': {
              color: '#f59f00'
            }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <AlertTitle>Mock Data Active</AlertTitle>
          {message}
        </Alert>
      </Collapse>
    </Box>
  );
} 