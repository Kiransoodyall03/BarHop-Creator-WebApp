import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  updateDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

const db = getFirestore();

// ==============================
//  MEDIA UPLOADS
// ==============================

export async function uploadVenueImages(files, venueId) {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', `venues/${venueId}/images`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Failed to upload image to Cloudinary');
    const data = await response.json();
    return data.secure_url;
  });
  return Promise.all(uploadPromises);
}

// ==============================
//  VENUE CORE OPERATIONS
// ==============================

export async function createVenue(venueData, ownerId) {
  const venueRef = doc(collection(db, 'venues'));
  const venueId = venueRef.id;

  const venueDoc = {
    id: venueId,
    placeId: venueData.placeId || '',
    ownerId: ownerId,
    name: venueData.name,
    address: venueData.address,
    phone: venueData.phone || '',
    website: venueData.website || '',
    // Primary category stays singular for consumer-app compatibility;
    // categories carries the full multi-select (up to 3).
    category:
      venueData.category ||
      (venueData.categories && venueData.categories[0]) ||
      '',
    categories:
      venueData.categories && venueData.categories.length > 0
        ? venueData.categories
        : venueData.category
          ? [venueData.category]
          : [],
    description: venueData.description,
    images: venueData.images || [],
    hours: venueData.hours || {},
    socialLinks: venueData.socialLinks || {
      instagram: '',
      facebook: '',
      tiktok: '',
    },
    subscriptionTier: 'trial', // Default B2B SaaS tier
    cardBorderStyle: venueData.cardBorderStyle || 'default',
    published: false,
    // Ownership is verified during registration (Paystack subaccount),
    // so anyone who can reach venue creation is already verified.
    verified: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(venueRef, venueDoc);
  return venueId;
}

export async function getVenuesByOwner(ownerId) {
  const venuesRef = collection(db, 'venues');
  const q = query(
    venuesRef,
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export const updateVenue = async (venueId, data) => {
  const venueRef = doc(db, 'venues', venueId);
  await updateDoc(venueRef, { ...data, updatedAt: Timestamp.now() });
};

export const deleteVenue = async (venueId) => {
  await deleteDoc(doc(db, 'venues', venueId));
};

// ==============================
//  B2B OPERATIONS: VIP RESERVATIONS
// ==============================

export async function getTonightReservations(venueId) {
  // In a real app, you would query by today's date bounds.
  // For now, we fetch recent reservations ordered by date.
  const reservationsRef = collection(db, `venues/${venueId}/reservations`);
  const q = query(reservationsRef, orderBy('reservationDate', 'asc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    reservationDate: doc.data().reservationDate?.toDate(),
  }));
}

export async function createReservation(venueId, reservationData) {
  const reservationsRef = collection(db, `venues/${venueId}/reservations`);
  const newRes = {
    ...reservationData,
    venueId,
    status: reservationData.status || 'Pending',
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(reservationsRef, newRes);
  return docRef.id;
}

// ==============================
//  B2B OPERATIONS: STAFF & PAYOUTS
// ==============================

export async function getVenueStaff(venueId) {
  const staffRef = collection(db, `venues/${venueId}/staff`);
  const q = query(staffRef, where('status', '==', 'Active'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// ==============================
//  B2B OPERATIONS: REVENUE ANALYTICS
// ==============================

export async function getRevenueAnalytics(venueId) {
  const analyticsRef = collection(db, `venues/${venueId}/analytics`);
  const q = query(analyticsRef, orderBy('date', 'desc')); // Add limits/bounds as needed
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
  }));
}

// ==============================
//  B2B OPERATIONS: VERIFICATION (PAYSTACK SUBACCOUNT)
// ==============================

// Creates the owner's Paystack Subaccount from their SA bank details.
// Paystack validates the account synchronously, so a successful call
// means the owner is verified — the backend flips
// users/{uid}.verificationStatus to VERIFIED, which VerificationContext
// picks up live. Resolves to { success, subaccountCode }.
export const callCreatePaystackSubaccount = async ({
  businessName,
  settlementBank,
  accountNumber,
}) => {
  const createPaystackSubaccount = httpsCallable(
    getFunctions(),
    'createPaystackSubaccount'
  );
  const response = await createPaystackSubaccount({
    businessName,
    settlementBank,
    accountNumber,
  });
  return response.data;
};
