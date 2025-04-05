import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductGroup } from '../../services/product/productConsolidation.service';

// Enhanced MappingResult interface to support full HS code hierarchy
export interface MappingResult {
  chapter: string;
  heading?: string;
  subheading?: string;
  confidence: number;
  description: string;
  alternativeChapters: Array<{
    chapter: string;
    confidence: number;
    description: string;
  }>;
  needsReview: boolean;
}

export interface ProductAssessmentState {
  consolidatedGroups: ProductGroup[];
  hsClassifications: Record<string, MappingResult>;
  selectedGroups: string[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductAssessmentState = {
  consolidatedGroups: [],
  hsClassifications: {},
  selectedGroups: [],
  loading: false,
  error: null,
};

const productAssessmentSlice = createSlice({
  name: 'productAssessment',
  initialState,
  reducers: {
    setConsolidatedGroups(state, action: PayloadAction<ProductGroup[]>) {
      state.consolidatedGroups = action.payload;
    },
    setHSClassifications(state, action: PayloadAction<Record<string, MappingResult>>) {
      state.hsClassifications = action.payload;
    },
    toggleGroupSelection(state, action: PayloadAction<string>) {
      const groupId = action.payload;
      if (state.selectedGroups.includes(groupId)) {
        state.selectedGroups = state.selectedGroups.filter(id => id !== groupId);
      } else {
        state.selectedGroups.push(groupId);
      }
    },
    selectAllGroups(state) {
      state.selectedGroups = state.consolidatedGroups.map(group => group.baseType);
    },
    deselectAllGroups(state) {
      state.selectedGroups = [];
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    }
  }
});

export const {
  setConsolidatedGroups,
  setHSClassifications,
  toggleGroupSelection,
  selectAllGroups,
  deselectAllGroups,
  setLoading,
  setError
} = productAssessmentSlice.actions;

export default productAssessmentSlice.reducer; 