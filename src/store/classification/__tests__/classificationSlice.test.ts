import { configureStore } from '@reduxjs/toolkit';
import classificationReducer, {
  addChapter,
  addChapters,
  setSelectedChapter,
  setSelectedHeading,
  setSelectedSubheading,
  setStatus,
  setConfidence,
  setError,
  addToHistory,
  selectChapters,
  selectProgress,
  selectHistory
} from '../classificationSlice';
import { HSChapter, HSHeading, HSSubheading } from '../../../types/classification.types';

describe('classificationSlice', () => {
  // Test data
  const mockSubheading: HSSubheading = {
    level: 'subheading',
    code: '080390',
    description: 'Fresh or dried bananas',
    confidence: 0.95,
    parentHeading: '0803'
  };

  const mockHeading: HSHeading = {
    level: 'heading',
    code: '0803',
    description: 'Bananas, including plantains, fresh or dried',
    confidence: 0.9,
    parentChapter: '08',
    subheadings: [mockSubheading]
  };

  const mockChapter: HSChapter = {
    level: 'chapter',
    code: '08',
    description: 'Edible fruit and nuts; peel of citrus fruit or melons',
    confidence: 0.85,
    headings: [mockHeading]
  };

  // Create test store
  const createTestStore = () => configureStore({
    reducer: {
      classification: classificationReducer
    }
  });

  it('should handle adding a single chapter', () => {
    const store = createTestStore();
    store.dispatch(addChapter(mockChapter));

    const chapters = selectChapters(store.getState());
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toEqual(mockChapter);
  });

  it('should handle adding multiple chapters', () => {
    const store = createTestStore();
    const chapters = [mockChapter];
    store.dispatch(addChapters(chapters));

    const storedChapters = selectChapters(store.getState());
    expect(storedChapters).toHaveLength(chapters.length);
    expect(storedChapters[0]).toEqual(chapters[0]);
  });

  it('should handle selecting chapter, heading, and subheading in sequence', () => {
    const store = createTestStore();

    // Select chapter
    store.dispatch(setSelectedChapter(mockChapter));
    let progress = selectProgress(store.getState());
    expect(progress.selectedChapter).toEqual(mockChapter);
    expect(progress.selectedHeading).toBeUndefined();
    expect(progress.selectedSubheading).toBeUndefined();
    expect(progress.status).toBe('reviewing');

    // Select heading
    store.dispatch(setSelectedHeading(mockHeading));
    progress = selectProgress(store.getState());
    expect(progress.selectedHeading).toEqual(mockHeading);
    expect(progress.selectedSubheading).toBeUndefined();

    // Select subheading
    store.dispatch(setSelectedSubheading(mockSubheading));
    progress = selectProgress(store.getState());
    expect(progress.selectedSubheading).toEqual(mockSubheading);
    expect(progress.status).toBe('complete');
  });

  it('should prevent selecting heading without chapter', () => {
    const store = createTestStore();
    
    expect(() => {
      store.dispatch(setSelectedHeading(mockHeading));
    }).toThrow('Cannot select heading without chapter');
  });

  it('should prevent selecting subheading without heading', () => {
    const store = createTestStore();
    store.dispatch(setSelectedChapter(mockChapter));
    
    expect(() => {
      store.dispatch(setSelectedSubheading(mockSubheading));
    }).toThrow('Cannot select subheading without heading');
  });

  it('should handle adding to history with confidence levels', () => {
    const store = createTestStore();
    
    store.dispatch(addToHistory({
      chapter: mockChapter,
      heading: mockHeading,
      subheading: mockSubheading,
      confidence: 0.95
    }));

    const history = selectHistory(store.getState());
    expect(history).toHaveLength(1);
    expect(history[0].chapter).toEqual(mockChapter);
    expect(history[0].selectedHeading).toEqual(mockHeading);
    expect(history[0].selectedSubheading).toEqual(mockSubheading);
    expect(history[0].confidenceLevel).toBe('high');
    expect(history[0].needsReview).toBe(false);
  });

  it('should limit history to 10 items', () => {
    const store = createTestStore();
    
    // Add 11 items
    for (let i = 0; i < 11; i++) {
      store.dispatch(addToHistory({
        chapter: mockChapter,
        confidence: 0.95
      }));
    }

    const history = selectHistory(store.getState());
    expect(history).toHaveLength(10);
  });

  it('should handle error states', () => {
    const store = createTestStore();
    
    store.dispatch(setError({
      type: 'low_confidence',
      message: 'Classification confidence too low',
      suggestions: [mockChapter]
    }));

    const state = store.getState().classification;
    expect(state.error?.type).toBe('low_confidence');
    expect(state.error?.message).toBe('Classification confidence too low');
    expect(state.progress.status).toBe('error');
  });
}); 