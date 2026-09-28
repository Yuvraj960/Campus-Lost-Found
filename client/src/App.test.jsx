import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the portal title and CTA buttons', () => {
    render(<App />);
    expect(screen.getAllByText(/Campus Lost & Found/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/I Lost Something/i)).toBeInTheDocument();
    expect(screen.getByText(/I Found Something/i)).toBeInTheDocument();
  });
});
