import React from 'react';
import { render, screen } from '@testing-library/react';
import VenueCardPreview from '../../components/VenueCardPreview';

describe('VenueCardPreview Component', () => {
  it('renders default placeholders when venue data is empty', () => {
    const emptyData = {
      title: '',
      address: '',
      category: '',
      images: [],
      description: '',
      hours: null,
      phone: '',
      website: '',
      socialLinks: {},
    };

    render(<VenueCardPreview venueData={emptyData} />);

    expect(screen.getByText('Venue Title')).toBeInTheDocument();
    expect(screen.getByText('Location of Place')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    // Updated assertion to match the new shorter text
    expect(
      screen.getByText('No description available yet.')
    ).toBeInTheDocument();
    expect(screen.getByText('No Images')).toBeInTheDocument();
  });

  it('renders populated venue data correctly', () => {
    const mockData = {
      title: 'The Golden Pint',
      address: '456 Main St, Downtown',
      category: 'bar',
      images: ['https://example.com/mock-image.jpg'],
      description: 'A cozy local pub with great drinks.',
      hours: null,
      phone: '555-1234',
      website: 'https://goldenpint.com',
      socialLinks: {},
    };

    render(<VenueCardPreview venueData={mockData} />);

    expect(screen.getByText('The Golden Pint')).toBeInTheDocument();
    expect(screen.getByText('456 Main St, Downtown')).toBeInTheDocument();

    // Updated assertion to look for the single capitalized category
    expect(screen.getByText('Bar')).toBeInTheDocument();

    expect(
      screen.getByText('A cozy local pub with great drinks.')
    ).toBeInTheDocument();
    expect(screen.getByText('📞 555-1234')).toBeInTheDocument();
  });
});
