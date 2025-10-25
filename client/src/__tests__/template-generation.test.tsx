import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenerateDocumentDialog } from '../components/GenerateDocumentDialog';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Template Generation System', () => {
  it('should render GenerateDocumentDialog component', () => {
    render(
      <GenerateDocumentDialog
        documentType="price_offer"
        orderId="test-order-123"
      />
    );
    
    expect(screen.getByText('Generate Document')).toBeInTheDocument();
  });

  it('should show template selection when opened', async () => {
    // Mock successful template fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        templates: [
          {
            id: 'template-1',
            nameEn: 'Standard Price Offer',
            nameAr: 'عرض السعر القياسي',
            descriptionEn: 'Professional price offer template',
            descriptionAr: 'قالب عرض سعر احترافي',
            category: 'price_offer',
            language: 'both',
            variables: ['clientName', 'validUntil', 'totalAmount'],
            isActive: true,
          },
        ],
      }),
    });

    render(
      <GenerateDocumentDialog
        documentType="price_offer"
        orderId="test-order-123"
      />
    );
    
    // Click to open dialog
    fireEvent.click(screen.getByText('Generate Document'));
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Select Template')).toBeInTheDocument();
    });
  });

  it('should handle template generation request', async () => {
    // Mock successful template fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        templates: [
          {
            id: 'template-1',
            nameEn: 'Standard Price Offer',
            nameAr: 'عرض السعر القياسي',
            descriptionEn: 'Professional price offer template',
            descriptionAr: 'قالب عرض سعر احترافي',
            category: 'price_offer',
            language: 'both',
            variables: ['clientName', 'validUntil', 'totalAmount'],
            isActive: true,
          },
        ],
      }),
    });

    // Mock successful document generation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        documentId: 'doc-123',
        fileName: 'price-offer-123.pdf',
      }),
    });

    // Mock successful token generation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'download-token-123',
      }),
    });

    render(
      <GenerateDocumentDialog
        documentType="price_offer"
        orderId="test-order-123"
      />
    );
    
    // Open dialog
    fireEvent.click(screen.getByText('Generate Document'));
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Select Template')).toBeInTheDocument();
    });

    // Select template
    const templateSelect = screen.getAllByRole('combobox')[0]; // First combobox is template selector
    fireEvent.click(templateSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Standard Price Offer')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Standard Price Offer'));

    // Fill in variables
    await waitFor(() => {
      const clientNameInput = screen.getByDisplayValue('');
      fireEvent.change(clientNameInput, { target: { value: 'Test Client' } });
    });

    // Generate document
    const generateButton = screen.getByText('Generate & Download');
    fireEvent.click(generateButton);

    // Verify API calls were made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/documents/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('template-1'),
        })
      );
    });
  });

  it('should validate required variables before generation', async () => {
    // Mock successful template fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        templates: [
          {
            id: 'template-1',
            nameEn: 'Standard Price Offer',
            nameAr: 'عرض السعر القياسي',
            descriptionEn: 'Professional price offer template',
            descriptionAr: 'قالب عرض سعر احترافي',
            category: 'price_offer',
            language: 'both',
            variables: ['clientName', 'validUntil', 'totalAmount'],
            isActive: true,
          },
        ],
      }),
    });

    render(
      <GenerateDocumentDialog
        documentType="price_offer"
        orderId="test-order-123"
      />
    );
    
    // Open dialog
    fireEvent.click(screen.getByText('Generate Document'));
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Select Template')).toBeInTheDocument();
    });

    // Select template
    const templateSelect = screen.getAllByRole('combobox')[0]; // First combobox is template selector
    fireEvent.click(templateSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Standard Price Offer')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Standard Price Offer'));

    // Try to generate without filling variables
    const generateButton = screen.getByText('Generate & Download');
    fireEvent.click(generateButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Please fill in all required variables/)).toBeInTheDocument();
    });
  });
});