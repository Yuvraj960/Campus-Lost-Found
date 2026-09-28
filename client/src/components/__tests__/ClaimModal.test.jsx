import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClaimModal from '../ClaimModal.jsx';
import { claimService } from '../../services/claimService.js';

vi.mock('../../services/claimService.js', () => ({
  claimService: {
    createClaim: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ClaimModal Component', () => {
  const mockItem = {
    id: 'item-found-99',
    title: 'Blue Water Bottle',
    type: 'FOUND',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with message and proof input fields when open', () => {
    render(<ClaimModal item={mockItem} open={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Claim this item/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Claim Message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Proof & Identifying Details/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Claim/i })).toBeInTheDocument();
  });

  it('validates minimum 10 characters for message and proof fields', async () => {
    render(<ClaimModal item={mockItem} open={true} onClose={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /Submit Claim/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Proof details must be at least 10 characters/i)).toBeInTheDocument();
    });

    expect(claimService.createClaim).not.toHaveBeenCalled();
  });

  it('submits claim successfully when inputs are valid', async () => {
    claimService.createClaim.mockResolvedValueOnce({ id: 'claim-1', status: 'PENDING' });
    const handleClose = vi.fn();
    const handleSubmitted = vi.fn();

    render(
      <ClaimModal
        item={mockItem}
        open={true}
        onClose={handleClose}
        onSubmitted={handleSubmitted}
      />
    );

    const messageInput = screen.getByLabelText(/Claim Message/i);
    const proofInput = screen.getByLabelText(/Proof & Identifying Details/i);

    fireEvent.change(messageInput, { target: { value: 'This is my lost water bottle from the library.' } });
    fireEvent.change(proofInput, { target: { value: 'It has a distinct scratch near the cap and sticker.' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Claim/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(claimService.createClaim).toHaveBeenCalledWith({
        itemId: 'item-found-99',
        message: 'This is my lost water bottle from the library.',
        proof: 'It has a distinct scratch near the cap and sticker.',
      });
      expect(handleSubmitted).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
