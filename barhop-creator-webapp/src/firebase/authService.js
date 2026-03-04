import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "./config";

// --- Email / Password ---

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// --- Google ---

export const loginWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

// --- Sign Out ---

export const logout = () => signOut(auth);

// --- Auth state observer ---

export const onAuthChange = (callback) =>
  onAuthStateChanged(auth, callback);