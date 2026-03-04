// ==============================
//  USER SERVICE
//  src/firebase/userService.js
// ==============================

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

// -----------------------------------------------
//  Create a user document in Firestore
//  Called once on registration (email or Google)
// -----------------------------------------------
export const createUserDocument = async (fbUser, extraData = {}) => {
  const userRef  = doc(db, "users", fbUser.uid);
  const snapshot = await getDoc(userRef);

  // Don't overwrite if the document already exists
  if (snapshot.exists()) return;

  const provider   = fbUser.providerData[0]?.providerId === "google.com" ? "google" : "email";
  const nameParts  = fbUser.displayName?.split(" ") ?? [];
  const firstName  = extraData.firstName ?? nameParts[0] ?? "";
  const lastName   = extraData.lastName  ?? nameParts.slice(1).join(" ") ?? "";

  await setDoc(userRef, {
    uid:           fbUser.uid,
    email:         fbUser.email,
    displayName:   fbUser.displayName,
    photoURL:      fbUser.photoURL,
    emailVerified: fbUser.emailVerified,
    firstName,
    lastName,
    provider,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// -----------------------------------------------
//  Fetch a user document from Firestore by uid
// -----------------------------------------------
export const getUserDocument = async (uid) => {
  const userRef  = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    uid:           data.uid,
    email:         data.email,
    displayName:   data.displayName,
    photoURL:      data.photoURL,
    emailVerified: data.emailVerified,
    firstName:     data.firstName,
    lastName:      data.lastName,
    provider:      data.provider,
    createdAt:     data.createdAt?.toDate() ?? null,
    updatedAt:     data.updatedAt?.toDate() ?? null,
  };
};