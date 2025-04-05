import { configureStore } from '@reduxjs/toolkit';
import productAssessmentReducer from './productAssessment/productAssessmentSlice';

export const store = configureStore({
  reducer: {
    productAssessment: productAssessmentReducer,
    // Other reducers will be added here
  },
});

export type AppDispatch = typeof store.dispatch; 