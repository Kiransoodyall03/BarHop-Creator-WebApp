import {
  createVenue,
  getVenuesByOwner,
  getTonightReservations,
} from '../../firebase/venueService';
import { setDoc, getDocs } from 'firebase/firestore';
import { doc } from 'firebase/firestore';

// Bulletproof ES6 mock for Firestore
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(() => ({ id: 'mock-venue-id' })),
  setDoc: jest.fn().mockResolvedValue(),
  getDocs: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: { now: jest.fn(() => ({ toDate: () => new Date() })) },
}));

// Mock Cloudinary Config
jest.mock('../../config/cloudinary.js', () => ({
  CLOUDINARY_CONFIG: { uploadPreset: 'test_preset', cloudName: 'test_cloud' },
}));

describe('venueService B2B Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue({ id: 'mock-venue-id' });
  });

  describe('createVenue', () => {
    it('should create a venue with default B2B trial subscription tier', async () => {
      const mockVenueData = { name: 'Test Club', category: 'club' };
      const ownerId = 'user123';

      await createVenue(mockVenueData, ownerId);

      expect(setDoc).toHaveBeenCalledTimes(1);
      const passedData = setDoc.mock.calls[0][1];

      expect(passedData.name).toBe('Test Club');
      expect(passedData.ownerId).toBe('user123');
      expect(passedData.subscriptionTier).toBe('trial'); // Enforcing B2B default
      expect(passedData.published).toBe(false);
    });
  });

  describe('getVenuesByOwner', () => {
    it('should fetch and map venues correctly', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'v1',
            data: () => ({ name: 'Venue 1', subscriptionTier: 'pro' }),
          },
          {
            id: 'v2',
            data: () => ({ name: 'Venue 2', subscriptionTier: 'trial' }),
          },
        ],
      };
      getDocs.mockResolvedValueOnce(mockSnapshot);

      const venues = await getVenuesByOwner('user123');

      expect(venues).toHaveLength(2);
      expect(venues[0].id).toBe('v1');
      expect(venues[0].name).toBe('Venue 1');
    });
  });

  describe('getTonightReservations', () => {
    it('should map Firestore timestamps to JS Dates', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'res1',
            data: () => ({
              guestName: 'John Doe',
              reservationDate: { toDate: () => new Date('2023-10-27') },
            }),
          },
        ],
      };
      getDocs.mockResolvedValueOnce(mockSnapshot);

      const reservations = await getTonightReservations('venue123');

      expect(reservations).toHaveLength(1);
      expect(reservations[0].reservationDate).toBeInstanceOf(Date);
      expect(reservations[0].guestName).toBe('John Doe');
    });
  });
});
