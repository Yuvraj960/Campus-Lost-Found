import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ItemCard from '../ItemCard.jsx';

describe('ItemCard Component', () => {
  const mockItem = {
    id: 'item-123',
    title: 'Silver Dell Laptop',
    category: 'ELECTRONICS',
    type: 'LOST',
    location: 'Main Library 2nd Floor',
    date: '2026-09-20T10:00:00.000Z',
    status: 'ACTIVE',
    images: [{ url: 'https://images.unsplash.com/photo-laptop' }],
  };

  it('renders item title, category, location, and formatted date', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('Silver Dell Laptop')).toBeInTheDocument();
    expect(screen.getByText('ELECTRONICS')).toBeInTheDocument();
    expect(screen.getByText('Main Library 2nd Floor')).toBeInTheDocument();
    expect(screen.getByText(/Sep 20, 2026/i)).toBeInTheDocument();
  });

  it('displays the correct type badge (Lost vs Found)', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );
    expect(screen.getByText('Lost')).toBeInTheDocument();

    const foundItem = { ...mockItem, type: 'FOUND' };
    rerender(
      <MemoryRouter>
        <ItemCard item={foundItem} />
      </MemoryRouter>
    );
    expect(screen.getByText('Found')).toBeInTheDocument();
  });

  it('renders status badge and links to item details page', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Active/i)).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/items/item-123');
  });

  it('renders fallback image placeholder when images array is empty', () => {
    const noImageItem = { ...mockItem, images: [] };
    render(
      <MemoryRouter>
        <ItemCard item={noImageItem} />
      </MemoryRouter>
    );

    expect(screen.getByText(/No photo provided/i)).toBeInTheDocument();
  });

  it('returns null safely when item is undefined', () => {
    const { container } = render(
      <MemoryRouter>
        <ItemCard item={null} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});
