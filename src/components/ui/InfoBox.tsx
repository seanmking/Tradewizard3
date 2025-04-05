import React from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';

interface InfoBoxProps {
  title?: string;
  tooltipText?: string;
  children: React.ReactNode;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

const StyledInfoBox = styled(Paper, {
  shouldForwardProp: (prop) => 
    prop !== 'bgColor' && prop !== 'borderColor' && prop !== 'textColor',
})<{ bgColor?: string; borderColor?: string; textColor?: string }>(
  ({ theme, bgColor, borderColor, textColor }) => {
    // We need to pre-calculate or eliminate theme functions
    const padding = 24; // theme.spacing(3)
    const marginTop = 32; // theme.spacing(4)
    const marginBottom = 8; // theme.spacing(1)
    const contrastText = textColor && bgColor ? '#ffffff' : '#0c4a6e';

    return {
      padding,
      backgroundColor: bgColor || '#f0f9ff',
      border: `1px solid ${borderColor || '#bae6fd'}`,
      borderRadius: 8,
      marginTop,
      '& .title': {
        color: textColor || '#0369a1',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        marginBottom,
      },
      '& .content': {
        color: textColor ? contrastText : '#0c4a6e',
      },
    };
  }
);

export function InfoBox({
  title = 'Why this matters',
  tooltipText,
  children,
  bgColor,
  borderColor,
  textColor,
}: InfoBoxProps) {
  return (
    <StyledInfoBox
      bgColor={bgColor}
      borderColor={borderColor}
      textColor={textColor}
      elevation={0}
    >
      <Typography variant="subtitle1" className="title">
        {title}
        {tooltipText && (
          <Tooltip title={tooltipText}>
            <InfoIcon fontSize="small" sx={{ ml: 1, color: textColor || '#0369a1' }} />
          </Tooltip>
        )}
      </Typography>
      <Box className="content">
        {children}
      </Box>
    </StyledInfoBox>
  );
} 