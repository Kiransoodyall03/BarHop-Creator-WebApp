import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export const createUserDocument = async (fbUser, extraData = {}) => {
  try {
    console.log("userService: creating doc for uid:", fbUser.uid);
    const userRef  = doc(db, "users", fbUser.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      console.log("userService: doc already exists, skipping.");
      return;
    }

    const provider  = fbUser.providerData[0]?.providerId === "google.com" ? "google" : "email";
    const nameParts = fbUser.displayName?.split(" ") ?? [];
    const firstName = extraData.firstName ?? nameParts[0] ?? "";
    const lastName  = extraData.lastName  ?? nameParts.slice(1).join(" ") ?? "";

    const userData = {
      uid:           fbUser.uid,
      email:         fbUser.email,
      displayName:   fbUser.displayName ?? `${firstName} ${lastName}`.trim(),
      photoURL:      fbUser.photoURL    ?? null,
      emailVerified: fbUser.emailVerified,
      firstName,
      lastName,
      provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("userService: writing to Firestore:", userData);
    await setDoc(userRef, userData);
    console.log("userService: write successful.");

  } catch (err) {
    console.error("userService: Firestore write failed:", err.code, err.message);
    throw err; // re-throw so Register.js catches it too
  }
};

export const getUserDocument = async (uid) => {
  try {
    const userRef  = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      console.warn("userService: no document found for uid:", uid);
      return null;
    }

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
  } catch (err) {
    console.error("userService: Firestore read failed:", err.code, err.message);
    throw err;
  }
};