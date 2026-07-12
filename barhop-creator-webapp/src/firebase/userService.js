import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const createUserDocument = async (fbUser, extraData = {}) => {
  try {
    console.log('userService: creating doc for uid:', fbUser.uid);
    const userRef = doc(db, 'users', fbUser.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      console.log('userService: doc already exists, skipping.');
      return;
    }

    const provider =
      fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
    const nameParts = fbUser.displayName?.split(' ') ?? [];
    const firstName = extraData.firstName ?? nameParts[0] ?? '';
    const lastName = extraData.lastName ?? nameParts.slice(1).join(' ') ?? '';

    const userData = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName ?? `${firstName} ${lastName}`.trim(),
      photoURL: fbUser.photoURL ?? null,
      emailVerified: fbUser.emailVerified,
      firstName,
      lastName,
      provider,
      // Onboarding state — new fields from types.ts
      venueId: null,
      onboardingComplete: false,
      // Paystack compliance state, updated by createPaystackSubaccount
      verificationStatus: 'UNVERIFIED',
      detailsSubmitted: false,
      payoutsEnabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('userService: writing to Firestore:', userData);
    await setDoc(userRef, userData);
    console.log('userService: write successful.');
  } catch (err) {
    console.error(
      'userService: Firestore write failed:',
      err.code,
      err.message
    );
    throw err;
  }
};

// Saves the owner + business details collected during registration onto
// users/{uid}. Merge-only, so it is safe to re-run when a user retries
// verification with corrected details.
export const saveBusinessProfile = async (
  uid,
  { phone, businessRole, businessProfile }
) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      { phone, businessRole, businessProfile, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error(
      'userService: business profile write failed:',
      err.code,
      err.message
    );
    throw err;
  }
};

// Updates only users/{uid}.businessProfile (Settings → Business Profile
// form). Callers must pass the FULL profile object (spread the existing
// one first) — this replaces the map rather than deep-merging it, so
// dropped keys would be lost otherwise.
export const updateBusinessProfile = async (uid, businessProfile) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      { businessProfile, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error(
      'userService: business profile update failed:',
      err.code,
      err.message
    );
    throw err;
  }
};

export const getUserDocument = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      console.warn('userService: no document found for uid:', uid);
      return null;
    }

    const data = snapshot.data();
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      emailVerified: data.emailVerified,
      firstName: data.firstName,
      lastName: data.lastName,
      provider: data.provider,
      phone: data.phone ?? '',
      businessRole: data.businessRole ?? '',
      businessProfile: data.businessProfile ?? null,
      paystackSubaccountId: data.paystackSubaccountId ?? null,
      paystackCustomerCode: data.paystackCustomerCode ?? null,
      venueId: data.venueId ?? null,
      onboardingComplete: data.onboardingComplete ?? false,
      verificationStatus: data.verificationStatus ?? 'UNVERIFIED',
      detailsSubmitted: data.detailsSubmitted ?? false,
      payoutsEnabled: data.payoutsEnabled ?? false,
      createdAt: data.createdAt?.toDate() ?? null,
      updatedAt: data.updatedAt?.toDate() ?? null,
    };
  } catch (err) {
    console.error('userService: Firestore read failed:', err.code, err.message);
    throw err;
  }
};
