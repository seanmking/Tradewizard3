import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import ClassificationWizard from '../ClassificationWizard';
import { createTestStore, createTestQueryClient } from './setup';
import { mockClassificationService } from '../__mocks__/classificationService';
import '@testing-library/jest-dom';

const renderWithProviders = (ui: React.ReactElement) => {
  const store = createTestStore();
  const queryClient = createTestQueryClient();
  
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </Provider>
  );
};

describe('ClassificationWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with accessibility features', () => {
    renderWithProviders(<ClassificationWizard />);
    
    expect(screen.getByRole('textbox', { name: /product description/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('status'))
      .toBeInTheDocument();
  });

  it('handles keyboard navigation in suggestions list', async () => {
    renderWithProviders(<ClassificationWizard />);
    
    const input = screen.getByRole('textbox', { name: /product description/i });
    fireEvent.change(input, { target: { value: 'test product' } });
    
    await waitFor(() => {
      expect(mockClassificationService.getSuggestions).toHaveBeenCalledWith('test product');
      const suggestionsList = screen.getByRole('listbox');
      expect(suggestionsList).toBeInTheDocument();
    });

    const suggestionsList = screen.getByRole('listbox');
    fireEvent.keyDown(suggestionsList, { key: 'ArrowDown' });
    
    expect(screen.getByRole('option', { selected: true }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('announces classification results', async () => {
    renderWithProviders(<ClassificationWizard />);
    
    const input = screen.getByRole('textbox', { name: /product description/i });
    fireEvent.change(input, { target: { value: 'test product' } });
    
    await waitFor(() => {
      expect(mockClassificationService.classifyProduct).toHaveBeenCalledWith('test product');
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/classification complete/i);
    });
  });

  it('displays error messages accessibly', async () => {
    mockClassificationService.classifyProduct.mockRejectedValueOnce(new Error('Classification failed'));
    renderWithProviders(<ClassificationWizard />);
    
    const input = screen.getByRole('textbox', { name: /product description/i });
    fireEvent.change(input, { target: { value: 'test product' } });
    
    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent(/classification failed/i);
    });
  });

  it('supports manual classification selection', async () => {
    renderWithProviders(<ClassificationWizard />);
    
    const input = screen.getByRole('textbox', { name: /product description/i });
    fireEvent.change(input, { target: { value: 'test product' } });
    
    await waitFor(() => {
      const suggestions = screen.getAllByRole('option');
      expect(suggestions.length).toBeGreaterThan(0);
      
      fireEvent.click(suggestions[0]);
      expect(mockClassificationService.manualClassify).toHaveBeenCalled();
    });
  });
});

// Accessibility-specific tests
describe('ClassificationWizard Accessibility', () => {
  it('supports screen reader announcements', () => {
    render(
      <Provider store={createTestStore()}>
        <QueryClientProvider client={createTestQueryClient()}>
          <ClassificationWizard />
        </QueryClientProvider>
      </Provider>
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('provides keyboard access to all interactive elements', () => {
    render(
      <Provider store={createTestStore()}>
        <QueryClientProvider client={createTestQueryClient()}>
          <ClassificationWizard />
        </QueryClientProvider>
      </Provider>
    );

    const interactiveElements = screen.getAllByRole('button');
    interactiveElements.forEach(element => {
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  });

  it('maintains proper heading hierarchy', () => {
    render(
      <Provider store={createTestStore()}>
        <QueryClientProvider client={createTestQueryClient()}>
          <ClassificationWizard />
        </QueryClientProvider>
      </Provider>
    );

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    headings.forEach(heading => {
      expect(heading).toHaveAttribute('aria-level');
    });
  });
}); 