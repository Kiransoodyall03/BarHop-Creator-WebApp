import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "../firebase/authService";
import { getUserDocument } from "../firebase/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        // Fetch the full user document from Firestore
        // This gives us firstName, lastName, provider, etc.
        const userDoc = await getUserDocument(fbUser.uid);
        setCurrentUser(userDoc);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);