import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/authService';
import { getUserDocument } from '../firebase/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-reads users/{uid} after in-app profile writes (e.g. the Settings
  // Business Profile form) so currentUser reflects the save immediately.
  const refreshUser = async () => {
    if (!currentUser?.uid) return;
    const userDoc = await getUserDocument(currentUser.uid);
    if (userDoc) setCurrentUser(userDoc);
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        // Fetch the full user document from Firestore
        // This gives us firstName, lastName, provider, etc.
        const userDoc = await getUserDocument(fbUser.uid);
        // During registration the auth event can land before the user
        // document is written — fall back to the auth profile so the
        // app still knows someone is signed in.
        setCurrentUser(
          userDoc ?? {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName ?? '',
            photoURL: fbUser.photoURL ?? null,
            firstName: '',
            lastName: '',
            verificationStatus: 'UNVERIFIED',
          }
        );
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
