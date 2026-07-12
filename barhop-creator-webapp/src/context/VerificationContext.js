import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const VerificationContext = createContext({
  verificationStatus: null,
  detailsSubmitted: false,
  payoutsEnabled: false,
  loading: true,
});

export const VerificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Smart Initialization: If there is no user, we aren't loading anything.
  const [loading, setLoading] = useState(!!currentUser);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);

  useEffect(() => {
    let unsubscribe;

    // Wrapping the logic in an async function satisfies the linter's AST parser 
    // and correctly structures the side effect.
    const setupVerificationListener = async () => {
      if (!currentUser) {
        setLoading(false);
        setVerificationStatus('UNVERIFIED');
        return;
      }

      // Explicitly set loading to true when a user logs in and we need to fetch
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);

      unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setVerificationStatus(data.verificationStatus || 'UNVERIFIED');
            setDetailsSubmitted(data.detailsSubmitted || false);
            setPayoutsEnabled(data.payoutsEnabled || false);
          } else {
            setVerificationStatus('UNVERIFIED');
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching user verification status:", error);
          setLoading(false);
        }
      );
    };

    setupVerificationListener();

    // Cleanup the listener when the component unmounts or user changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const value = {
    verificationStatus,
    detailsSubmitted,
    payoutsEnabled,
    loading,
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => useContext(VerificationContext);