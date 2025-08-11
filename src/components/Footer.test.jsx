import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer.jsx';

describe('Footer component', () => {
  it('renders company name', () => {
    render(<Footer />);
    expect(screen.getByText('TicketWayz')).toBeTruthy();
  });
});
