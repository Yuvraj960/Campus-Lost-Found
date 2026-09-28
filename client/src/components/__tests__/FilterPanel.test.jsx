import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from '../FilterPanel.jsx';

describe('FilterPanel Component', () => {
  const initialValues = {
    category: '',
    location: '',
    status: 'ACTIVE',
  };

  it('renders filter headings, category options, location options, and status', () => {
    render(<FilterPanel values={initialValues} onChange={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByText('Filter Listings')).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Status$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('triggers onChange when a category is selected', () => {
    const handleChange = vi.fn();
    render(<FilterPanel values={initialValues} onChange={handleChange} onReset={vi.fn()} />);

    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'ELECTRONICS' } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'ELECTRONICS' })
    );
  });

  it('triggers onChange when a location is selected', () => {
    const handleChange = vi.fn();
    render(<FilterPanel values={initialValues} onChange={handleChange} onReset={vi.fn()} />);

    const locationSelect = screen.getByLabelText(/Location/i);
    fireEvent.change(locationSelect, { target: { value: 'Library' } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Library' })
    );
  });

  it('triggers onReset when clicking the reset button', () => {
    const handleReset = vi.fn();
    render(<FilterPanel values={initialValues} onChange={vi.fn()} onReset={handleReset} />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
