import React, { useState } from 'react';
import {
  IconButton,
  Popover,
  Typography,
  Box,
  Link
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface HSCodeInfoPopoverProps {
  iconSize?: number;
}

/**
 * A component that displays a popover with information about HS codes
 * when the user clicks on an info icon
 */
const HSCodeInfoPopover: React.FC<HSCodeInfoPopoverProps> = ({ iconSize = 20 }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'hs-code-info-popover' : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
        size="small"
        color="primary"
        sx={{ ml: 0.5, p: 0.5 }}
      >
        <InfoOutlinedIcon sx={{ fontSize: iconSize }} />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 3, maxWidth: 360 }}>
          <Typography variant="h6" gutterBottom>
            What are HS Codes?
          </Typography>
          <Typography variant="body2" paragraph>
            Harmonized System (HS) codes are standardized numerical codes used worldwide to classify 
            traded products. They consist of 6 digits, with countries often adding more digits for further classification.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Chapter (2-digit):</strong> Broad category of products<br />
            <strong>Heading (4-digit):</strong> More specific group within a chapter<br />
            <strong>Subheading (6-digit):</strong> Specific product classification
          </Typography>
          <Typography variant="body2">
            HS codes determine tariffs, trade requirements, and customs procedures for international trade.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link href="https://www.trade.gov/harmonized-system-hs-codes" target="_blank" rel="noopener">
              Learn more about HS codes
            </Link>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default HSCodeInfoPopover; 