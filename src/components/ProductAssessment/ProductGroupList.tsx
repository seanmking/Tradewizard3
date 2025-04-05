'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Switch,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ProductGroup } from '../../services/product/productConsolidation.service';
import { MappingResult } from '../../services/hs-code/hsChapterMapping.service';
import { toggleGroupSelection } from '../../store/productAssessment/productAssessmentSlice';
import type { RootState } from '../../store/types';

export interface ProductGroupListProps {
  groups: ProductGroup[];
  classifications: Record<string, MappingResult>;
  onEditProduct?: (product: ProductGroup) => void;
}

export const ProductGroupList: React.FC<ProductGroupListProps> = ({
  groups,
  classifications,
  onEditProduct,
}) => {
  const dispatch = useDispatch();
  const selectedGroups = useSelector((state: RootState) => 
    state.productAssessment.selectedGroups
  );

  // Handle edit click for a product
  const handleEditClick = (group: ProductGroup, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEditProduct) {
      onEditProduct(group);
    }
  };

  // Handle selection toggle
  const handleSelectionToggle = (groupId: string) => {
    dispatch(toggleGroupSelection(groupId));
  };

  // Function to determine confidence color
  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.7) return 'success';
    if (confidence >= 0.4) return 'warning';
    return 'error';
  };

  // Function to get confidence icon
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return <CheckCircleIcon fontSize="small" />;
    if (confidence >= 0.4) return <WarningIcon fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  if (groups.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Typography variant="body1" color="text.secondary">
          No products found. Add products to begin classification.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {groups.map((group) => {
        const classification = classifications[group.baseType];
        
        return (
          <Box 
            key={group.baseType}
            sx={{ 
              width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 10.667px)' }
            }}
          >
            <Paper 
              sx={{ 
                p: 2, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" component="h3">
                  {group.baseType}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={(e) => handleEditClick(group, e)}
                  aria-label={`Edit ${group.baseType}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {group.variants.length > 0 ? `${group.variants.length} variants` : 'No variants'}
              </Typography>
              
              {classification && (
                <Box sx={{ mb: 'auto', mt: 1 }}>
                  <Tooltip 
                    title={`Confidence: ${Math.round(classification.confidence * 100)}%`}
                    arrow
                  >
                    <Chip
                      icon={getConfidenceIcon(classification.confidence)}
                      label={`HS Chapter ${classification.chapter}`}
                      color={getConfidenceColor(classification.confidence)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Tooltip>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {classification.description}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Switch
                  checked={selectedGroups.includes(group.baseType)}
                  onChange={() => handleSelectionToggle(group.baseType)}
                  color="primary"
                />
                <Typography variant="body2" color="text.secondary">
                  Include in assessment
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}; 