import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateVenue from '../../pages/CreateVenue';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { createVenue, uploadVenueImages } from '../../firebase/venueService';

// --- Mocks ---
jest.mock('../../context/AuthContext');
jest.mock('../../context/ErrorContext');
jest.mock('../../firebase/venueService');

// 100% Manual Mock for React Router
const mockNavigate = jest.fn();
jest.mock(
  'react-router-dom',
  () => ({
    BrowserRouter: function MockBrowserRouter({ children }) {
      return <div>{children}</div>;
    },
    useNavigate: () => mockNavigate,
    Link: function MockLink({ children, to }) {
      return <a href={to}>{children}</a>;
    },
  }),
  { virtual: true }
);

// Mock the VenueCardPreview to avoid complex drag/drop DOM event issues in Jest
jest.mock(
  '../../components/VenueCardPreview',
  () =>
    function MockVenueCardPreview() {
      return <div data-testid="mock-venue-preview">Card Preview</div>;
    }
);

// Mock dynamic Firebase Firestore imports used in the component
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('CreateVenue Component - B2B Wizard', () => {
  const mockShowError = jest.fn();

  beforeAll(() => {
    // Mock URL.createObjectURL which is used for image previews
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    // Mock window.alert
    global.alert = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user123' } });
    useError.mockReturnValue({ showError: mockShowError });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <CreateVenue />
      </BrowserRouter>
    );

  it('renders Step 1 (Identity) initially', () => {
    renderComponent();
    expect(screen.getByText(/Venue Identity & Contact/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Venue Name/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-venue-preview')).toBeInTheDocument();
  });

  it('allows navigation between steps using Next and Back buttons', () => {
    renderComponent();

    // Currently on Step 1. Click Next -> Step 2
    const nextBtn = screen.getByText(/Next/i);
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Primary Category/i)).toBeInTheDocument();

    // Click Next -> Step 3
    fireEvent.click(screen.getByText(/Next/i));
    expect(screen.getByText(/High-Resolution Media/i)).toBeInTheDocument();

    // Click Back -> Step 2
    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);
    expect(screen.getByText(/Primary Category/i)).toBeInTheDocument();
  });

  it('triggers validation error if required fields are missing on submit', async () => {
    renderComponent();

    // Skip to Step 4 without filling anything out
    fireEvent.click(screen.getByText(/Next/i)); // To Step 2
    fireEvent.click(screen.getByText(/Next/i)); // To Step 3
    fireEvent.click(screen.getByText(/Next/i)); // To Step 4

    // Click Launch Venue
    fireEvent.click(screen.getByText(/Launch Venue/i));

    // Should catch the empty fields
    expect(mockShowError).toHaveBeenCalledWith(
      'Please fill in Title, Address, Phone, and Category.'
    );
    expect(createVenue).not.toHaveBeenCalled();
  });

  it('triggers validation error if no images are uploaded', async () => {
    renderComponent();

    // Fill Step 1
    fireEvent.change(screen.getByPlaceholderText(/Venue Name/i), {
      target: { value: 'Test Club' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Full Address/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Public Phone Number/i), {
      target: { value: '555-0000' },
    });
    fireEvent.click(screen.getByText(/Next/i));

    // Fill Step 2
    fireEvent.click(screen.getByText('Club')); // Select Category
    fireEvent.click(screen.getByText(/Next/i));

    // Skip Step 3 (Images)
    fireEvent.click(screen.getByText(/Next/i));

    // Submit at Step 4
    fireEvent.click(screen.getByText(/Launch Venue/i));

    // Should catch the missing image
    expect(mockShowError).toHaveBeenCalledWith(
      'Please upload at least one image.'
    );
    expect(createVenue).not.toHaveBeenCalled();
  });

  it('successfully creates a venue and navigates to dashboard', async () => {
    createVenue.mockResolvedValueOnce('new-venue-id');
    uploadVenueImages.mockResolvedValueOnce([
      'https://mock-image-url.com/1.jpg',
    ]);

    renderComponent();

    // --- STEP 1 ---
    fireEvent.change(screen.getByPlaceholderText(/Venue Name/i), {
      target: { value: 'Test Club' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Full Address/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Public Phone Number/i), {
      target: { value: '555-0000' },
    });
    fireEvent.click(screen.getByText(/Next/i));

    // --- STEP 2 ---
    fireEvent.click(screen.getByText('Club'));
    fireEvent.click(screen.getByText(/Next/i));

    // --- STEP 3 ---
    // Mock a file upload
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const fileInput = document.getElementById('image-upload-0');
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/Next/i));

    // --- STEP 4 ---
    fireEvent.change(screen.getByPlaceholderText(/Instagram URL/i), {
      target: { value: 'https://ig.com/test' },
    });

    // Submit
    fireEvent.click(screen.getByText(/Launch Venue/i));

    await waitFor(() => {
      // 1. Verifies the venue document was created with the right core payload
      expect(createVenue).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Club',
          address: '123 Main St',
          phone: '555-0000',
          category: 'club',
          socialLinks: expect.objectContaining({
            instagram: 'https://ig.com/test',
          }),
        }),
        'user123'
      );

      // 2. Verifies images were uploaded
      expect(uploadVenueImages).toHaveBeenCalled();

      // 3. Verifies success alert and routing
      expect(global.alert).toHaveBeenCalledWith(
        '✅ Venue created successfully!'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
