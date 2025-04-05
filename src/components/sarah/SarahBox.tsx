import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

interface SarahBoxProps {
  title?: string;
  children: React.ReactNode;
}

const StyledSarahBox = styled(Box)({
  backgroundColor: '#ebf8ff',
  border: '1px solid #bee3f8',
  borderRadius: 8,
  padding: 24,
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: 32,
});

const StyledAvatar = styled(Avatar)({
  width: 60,
  height: 60,
  backgroundColor: '#4299e1',
  marginRight: 24,
  fontWeight: 'bold',
  fontSize: 24,
});

export function SarahBox({ title = "Sarah - Export Consultant", children }: SarahBoxProps) {
  return (
    <StyledSarahBox>
      <StyledAvatar>S</StyledAvatar>
      <Box>
        <Typography variant="h6" color="#2b6cb0" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body1">
          {children}
        </Typography>
      </Box>
    </StyledSarahBox>
  );
} 