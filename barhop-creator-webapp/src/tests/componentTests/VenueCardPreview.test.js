import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VenueCardPreview from '../../components/VenueCardPreview';

describe('VenueCardPreview Component', () => {
  // Mock data for a fully populated venue
  const populatedVenueData = {
    title: 'The Golden Pint',
    address: '456 Main St, Downtown',
    categories: ['bar', 'pub'],
    images: ['https://example.com/mock-image.jpg'],
    description: 'A cozy local pub with great drinks.',
  };

  // Mock data for an empty venue (initial state)
  const emptyVenueData = {
    title: '',
    address: '',
    categories: [],
    images: [],
    description: '',
  };

  test('renders populated venue data correctly', () => {
    render(<VenueCardPreview venueData={populatedVenueData} />);

    // Check if title and address are rendered
    expect(screen.getByText('The Golden Pint')).toBeInTheDocument();
    expect(screen.getByText('456 Main St, Downtown')).toBeInTheDocument();

    // Check if description is rendered in the bottom sheet
    expect(
      screen.getByText('A cozy local pub with great drinks.')
    ).toBeInTheDocument();

    // Check if categories are formatted and rendered (capitalized)
    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Pub')).toBeInTheDocument();

    // Check if the image is rendered instead of the placeholder
    const image = screen.getByRole('img', { name: /venue/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/mock-image.jpg');
  });

  test('renders default placeholders when venue data is empty', () => {
    render(<VenueCardPreview venueData={emptyVenueData} />);

    // Check default title and address
    expect(screen.getByText('Venue Title')).toBeInTheDocument();
    expect(screen.getByText('Location of Place')).toBeInTheDocument();

    // Check default description
    expect(
      screen.getByText(
        'No description available yet. Add a description to tell people more about your venue!'
      )
    ).toBeInTheDocument();

    // Check default categories
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('Category 3')).toBeInTheDocument();

    // Check if the image placeholder is rendered
    expect(screen.getByText('Add Image')).toBeInTheDocument();
  });

  test('toggles the bottom sheet open when double-clicked', () => {
    const { container } = render(
      <VenueCardPreview venueData={emptyVenueData} />
    );

    // Find the bottom sheet container
    const bottomSheet = container.querySelector('.card-bottom-sheet');

    // Initially, it should NOT have the 'open' class
    expect(bottomSheet).not.toHaveClass('open');

    // Find the indicator bar (the handle we double-click)
    const indicator = container.querySelector('.sheet-indicator');

    // Simulate a double click on the indicator
    fireEvent.doubleClick(indicator);

    // Now, the sheet should have the 'open' class
    expect(bottomSheet).toHaveClass('open');

    // Simulate another double click to close it
    fireEvent.doubleClick(indicator);

    // It should be closed again
    expect(bottomSheet).not.toHaveClass('open');
  });
});
