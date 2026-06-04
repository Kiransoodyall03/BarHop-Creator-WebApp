import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/authService';

// 1. Mock the Auth Context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// 2. Mock Firebase auth service
jest.mock('../../firebase/authService', () => ({
  logout: jest.fn(),
}));

// 3. The PURE Mock for react-router-dom with the VIRTUAL flag
const mockedNavigate = jest.fn();
jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockedNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    // Manually fake the Link component to output a simple HTML anchor tag
    Link: ({ children, to, className }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
); // <--- THIS IS THE MAGIC KEY

describe('Navbar Component', () => {
  const mockUser = {
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockUser });
  });

  test('renders the logo and desktop navigation links', () => {
    render(<Navbar />);

    expect(screen.getByText('BarHop')).toBeInTheDocument();

    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Venue Card')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Manage')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Preview')[0]).toBeInTheDocument();
  });

  test('displays the user information correctly', () => {
    render(<Navbar />);

    // Check if name is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Check if avatar is displayed
    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('handles user logout successfully', async () => {
    render(<Navbar />);

    // Get the desktop Sign Out button
    const signOutButton = screen.getAllByText('Sign Out')[0];

    // Simulate clicking it
    fireEvent.click(signOutButton);

    // Verify logout logic fired
    expect(logout).toHaveBeenCalledTimes(1);

    // Tell Jest to WAIT for the async promise to resolve before checking navigate
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('toggles the mobile drawer menu when the hamburger is clicked', () => {
    render(<Navbar />);

    const hamburgerBtn = screen.getByLabelText('Toggle menu');

    // Drawer is closed, should only be 1 Dashboard link
    expect(screen.getAllByText('Dashboard').length).toBe(1);

    // Click to open
    fireEvent.click(hamburgerBtn);

    // Drawer is open, should be 2 Dashboard links
    expect(screen.getAllByText('Dashboard').length).toBe(2);

    // Find and click the drawer container to close it
    const drawerContainer = screen
      .getAllByText('Dashboard')[1]
      .closest('.navbar__drawer');
    fireEvent.click(drawerContainer);

    // Drawer is closed, back to 1 link
    expect(screen.getAllByText('Dashboard').length).toBe(1);
  });
});
