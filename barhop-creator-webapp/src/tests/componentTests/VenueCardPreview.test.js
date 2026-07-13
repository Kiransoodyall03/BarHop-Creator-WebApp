import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('renders a chip for every selected category', () => {
    render(
      <VenueCardPreview
        venueData={{
          title: 'The Golden Pint',
          address: '456 Main St',
          categories: ['bar', 'rooftop', 'sports bar'],
          images: [],
          description: '',
          hours: null,
          phone: '',
          website: '',
          socialLinks: {},
        }}
      />
    );

    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Rooftop')).toBeInTheDocument();
    expect(screen.getByText('Sports bar')).toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  describe('media cycling', () => {
    const mediaData = (overrides = {}) => ({
      title: 'The Golden Pint',
      address: '456 Main St',
      categories: ['bar'],
      images: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
      description: '',
      hours: null,
      phone: '',
      website: '',
      socialLinks: {},
      ...overrides,
    });

    it('advances to the next image on click and wraps around', () => {
      render(<VenueCardPreview venueData={mediaData()} />);

      const media = screen.getByTestId('venue-media');
      expect(media).toHaveAttribute('src', 'https://example.com/one.jpg');

      fireEvent.click(media, { clientX: 5 });
      expect(screen.getByTestId('venue-media')).toHaveAttribute(
        'src',
        'https://example.com/two.jpg'
      );

      fireEvent.click(screen.getByTestId('venue-media'), { clientX: 5 });
      expect(screen.getByTestId('venue-media')).toHaveAttribute(
        'src',
        'https://example.com/one.jpg'
      );
    });

    it('steps back when the left edge is clicked', () => {
      render(<VenueCardPreview venueData={mediaData()} />);

      // Left-third tap from the first item wraps to the last.
      fireEvent.click(screen.getByTestId('venue-media'), { clientX: -10 });
      expect(screen.getByTestId('venue-media')).toHaveAttribute(
        'src',
        'https://example.com/two.jpg'
      );
    });

    it('includes the venue video as the final slide', () => {
      render(
        <VenueCardPreview
          venueData={mediaData({
            images: ['https://example.com/one.jpg'],
            video: 'https://example.com/promo.mp4',
          })}
        />
      );

      expect(screen.getByTestId('venue-media').tagName).toBe('IMG');
      fireEvent.click(screen.getByTestId('venue-media'), { clientX: 5 });

      const video = screen.getByTestId('venue-media');
      expect(video.tagName).toBe('VIDEO');
      expect(video).toHaveAttribute('src', 'https://example.com/promo.mp4');
    });

    it('does not cycle when there is only one image', () => {
      render(
        <VenueCardPreview
          venueData={mediaData({ images: ['https://example.com/one.jpg'] })}
        />
      );

      fireEvent.click(screen.getByTestId('venue-media'), { clientX: 5 });
      expect(screen.getByTestId('venue-media')).toHaveAttribute(
        'src',
        'https://example.com/one.jpg'
      );
    });
  });
});
