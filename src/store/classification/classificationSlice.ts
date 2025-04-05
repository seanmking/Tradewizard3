import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  ClassificationState, 
  ClassificationStatus,
  ClassificationErrorType,
  HSChapter,
  HSHeading,
  HSSubheading,
  ClassificationProgress,
  ClassificationMetrics
} from '../../types/classification.types';

// Initial state
const initialState: ClassificationState = {
  chapters: {},
  progress: {
    status: 'idle',
    confidence: 0
  },
  history: [],
  metrics: []
};

const classificationSlice = createSlice({
  name: 'classification',
  initialState,
  reducers: {
    // Chapter management
    addChapter(state, action: PayloadAction<HSChapter>) {
      state.chapters[action.payload.code] = action.payload;
    },

    addChapters(state, action: PayloadAction<HSChapter[]>) {
      action.payload.forEach(chapter => {
        state.chapters[chapter.code] = chapter;
      });
    },

    // Progress management
    setSelectedChapter(state, action: PayloadAction<HSChapter>) {
      state.progress.selectedChapter = action.payload;
      state.progress.selectedHeading = undefined;
      state.progress.selectedSubheading = undefined;
      state.progress.status = 'reviewing';
    },

    setSelectedHeading(state, action: PayloadAction<HSHeading>) {
      if (!state.progress.selectedChapter) {
        throw new Error('Cannot select heading without chapter');
      }
      state.progress.selectedHeading = action.payload;
      state.progress.selectedSubheading = undefined;
    },

    setSelectedSubheading(state, action: PayloadAction<HSSubheading>) {
      if (!state.progress.selectedHeading) {
        throw new Error('Cannot select subheading without heading');
      }
      state.progress.selectedSubheading = action.payload;
      state.progress.status = 'complete';
    },

    // Status management
    setStatus(state, action: PayloadAction<ClassificationStatus>) {
      state.progress.status = action.payload;
    },

    setConfidence(state, action: PayloadAction<number>) {
      state.progress.confidence = action.payload;
    },

    // Error handling
    setError(state, action: PayloadAction<{
      type: ClassificationErrorType;
      message: string;
      suggestions?: (HSChapter | HSHeading | HSSubheading)[];
    }>) {
      state.error = action.payload;
      state.progress.status = 'error';
    },

    // History management
    addToHistory(state, action: PayloadAction<{
      chapter: HSChapter;
      heading?: HSHeading;
      subheading?: HSSubheading;
      confidence: number;
    }>) {
      state.history.unshift({
        chapter: action.payload.chapter,
        selectedHeading: action.payload.heading,
        selectedSubheading: action.payload.subheading,
        confidence: action.payload.confidence,
        confidenceLevel: action.payload.confidence > 0.8 ? 'high' : 
                       action.payload.confidence > 0.5 ? 'medium' : 'low',
        needsReview: action.payload.confidence < 0.8
      });
      
      // Keep only last 10 classifications
      if (state.history.length > 10) {
        state.history.pop();
      }
    },

    // Metrics tracking
    addMetrics(state, action: PayloadAction<ClassificationMetrics>) {
      state.metrics.push(action.payload);
    },

    // Reset state
    reset(state) {
      state.progress = {
        status: 'idle',
        confidence: 0
      };
      state.error = undefined;
    }
  }
});

// Export actions
export const {
  addChapter,
  addChapters,
  setSelectedChapter,
  setSelectedHeading,
  setSelectedSubheading,
  setStatus,
  setConfidence,
  setError,
  addToHistory,
  addMetrics,
  reset
} = classificationSlice.actions;

// Export selectors
export const selectChapters = (state: { classification: ClassificationState }) => 
  Object.values(state.classification.chapters);

export const selectProgress = (state: { classification: ClassificationState }) => 
  state.classification.progress;

export const selectHistory = (state: { classification: ClassificationState }) => 
  state.classification.history;

export const selectMetrics = (state: { classification: ClassificationState }) => 
  state.classification.metrics;

// Export reducer
export default classificationSlice.reducer; 