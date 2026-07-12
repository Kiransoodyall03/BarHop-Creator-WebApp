import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// 1. Import the functions modules
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Initialize the functions service
export const functions = getFunctions(app);

// 3. Force local emulator if running on localhost.
// Set REACT_APP_USE_EMULATORS=false in .env to call deployed functions
// instead (without the emulator running, every callable fails with
// ERR_CONNECTION_REFUSED / "internal").
if (
  window.location.hostname === 'localhost' &&
  process.env.REACT_APP_USE_EMULATORS !== 'false'
) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default app;