import { getFirestore, doc, setDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { CLOUDINARY_CONFIG } from "../config/cloudinary";

const db = getFirestore();

/**
 * Upload images to Cloudinary
 * @param {File[]} files - Array of image files
 * @param {string} venueId - Venue ID for folder structure
 * @returns {Promise<string[]>} - Array of download URLs
 */
export async function uploadVenueImages(files, venueId) {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', `venues/${venueId}/images`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url; // HTTPS URL
  });

  return Promise.all(uploadPromises);
}

/**
 * Upload video to Cloudinary
 * @param {File} file - Video file
 * @param {string} venueId - Venue ID for folder structure
 * @returns {Promise<string>} - Download URL
 */
export async function uploadVenueVideo(file, venueId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', `venues/${venueId}/video`);
  formData.append('resource_type', 'video');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload video to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Create a new venue in Firestore
 * @param {Object} venueData - Venue information
 * @param {string} ownerId - User ID of the venue owner
 * @returns {Promise<string>} - The created venue ID
 */
export async function createVenue(venueData, ownerId) {
  const venueRef = doc(collection(db, "venues"));
  const venueId = venueRef.id;
  
  const venueDoc = {
    placeId: venueId,
    ownerId: ownerId,
    name: venueData.name,
    address: venueData.address,
    phone: venueData.phone || "",
    website: venueData.website || "",
    category: venueData.category,
    description: venueData.description,
    tagline: venueData.tagline || "",
    images: venueData.images || [],
    video: venueData.video || null,
    offers: venueData.offers?.filter(offer => offer.trim() !== "") || [],
    hours: venueData.hours || {
      monday: { open: "", close: "", closed: false },
      tuesday: { open: "", close: "", closed: false },
      wednesday: { open: "", close: "", closed: false },
      thursday: { open: "", close: "", closed: false },
      friday: { open: "", close: "", closed: false },
      saturday: { open: "", close: "", closed: false },
      sunday: { open: "", close: "", closed: false },
    },
    socialLinks: venueData.socialLinks || {
      instagram: "",
      facebook: "",
      tiktok: "",
    },
    useCustomCard: true,
    published: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(venueRef, venueDoc);
  
  return venueId;
}

/**
 * Get all venues for a specific owner
 * @param {string} ownerId - User ID of the venue owner
 * @returns {Promise<Array>} - Array of venue objects
 */
export async function getVenuesByOwner(ownerId) {
  const db = getFirestore();
  const venuesRef = collection(db, "venues");
  const q = query(
    venuesRef,
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const venues = [];
  
  querySnapshot.forEach((doc) => {
    venues.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return venues;
}