import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ReportItem from '../ReportItem.jsx';
import { itemService } from '../../services/itemService.js';
import { aiService } from '../../services/aiService.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/report/lost' }),
  };
});

vi.mock('../../services/itemService.js', () => ({
  itemService: {
    createItem: vi.fn(),
  },
}));

vi.mock('../../services/aiService.js', () => ({
  aiService: {
    getAssist: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ReportItem Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders report form fields for lost item', () => {
    render(
      <MemoryRouter>
        <ReportItem forcedType="LOST" />
      </MemoryRouter>
    );

    expect(screen.getByText(/What did you misplace\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Listing Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Detailed Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Item Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Campus Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date Lost/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Lost Report/i })).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    render(
      <MemoryRouter>
        <ReportItem forcedType="LOST" />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Publish Lost Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Title must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Description must be at least 10 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
      expect(screen.getByText(/Location must be at least 2 characters/i)).toBeInTheDocument();
    });

    expect(itemService.createItem).not.toHaveBeenCalled();
  });

  it('fetches AI assist recommendations on clicking "Help me describe it"', async () => {
    aiService.getAssist.mockResolvedValueOnce({
      suggestedTitle: 'Silver Sony WH-1000XM4 Headphones',
      category: 'ELECTRONICS',
      keywords: ['headphones', 'sony', 'silver'],
      likelyLocations: ['Library', 'Student Center'],
      clarifyingQuestions: ['Did it have a case?'],
    });

    render(
      <MemoryRouter>
        <ReportItem forcedType="LOST" />
      </MemoryRouter>
    );

    const descInput = screen.getByLabelText(/Detailed Description/i);
    fireEvent.change(descInput, { target: { value: 'I lost my silver sony noise cancelling headphones somewhere.' } });

    const aiBtn = screen.getByRole('button', { name: /Help me describe it/i });
    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(aiService.getAssist).toHaveBeenCalledWith({
        text: 'I lost my silver sony noise cancelling headphones somewhere.',
      });
      expect(screen.getByText('Silver Sony WH-1000XM4 Headphones')).toBeInTheDocument();
    });
  });

  it('submits valid form data and redirects to /my-reports', async () => {
    itemService.createItem.mockResolvedValueOnce({ id: 'item-new', title: 'Calculus Textbook' });

    render(
      <MemoryRouter>
        <ReportItem forcedType="LOST" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Listing Title/i), { target: { value: 'Calculus Stewart 8th Ed' } });
    fireEvent.change(screen.getByLabelText(/Detailed Description/i), { target: { value: 'Hardcover book left on 3rd floor study desk.' } });
    fireEvent.change(screen.getByLabelText(/Item Category/i), { target: { value: 'BOOKS_STATIONERY' } });
    fireEvent.change(screen.getByLabelText(/Campus Location/i), { target: { value: 'Library' } });
    fireEvent.change(screen.getByLabelText(/Date Lost/i), { target: { value: '2026-09-27' } });

    const submitBtn = screen.getByRole('button', { name: /Publish Lost Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(itemService.createItem).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/my-reports');
    });
  });
});
