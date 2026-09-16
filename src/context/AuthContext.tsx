'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileData: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  setProfileData: () => {},
});

import { fetchUserProfileRest } from '@/lib/firestoreRest';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = React.useCallback(async (uid: string) => {
    // 1. Coba REST API terlebih dahulu (~50ms & tidak pernah hang)
    try {
      const restProfile = await fetchUserProfileRest(uid);
      if (restProfile && (restProfile.namaLengkap || restProfile.email)) {
        setProfile(restProfile as UserProfile);
        return;
      }
    } catch (restErr) {
      console.warn('REST fetchProfile fallback to SDK:', restErr);
    }

    try {
      const docRef = doc(db, 'users', uid);
      const snapPromise = getDoc(docRef);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap && snap.exists()) {
        setProfile(snap.data() as UserProfile);
        return;
      }
      setProfile(null);
    } catch (err) {
      console.warn('Could not fetch profile or timed out:', err);
    }
  }, []);

  useEffect(() => {
    // Safety timeout so UI never hangs indefinitely if auth network lags
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 7000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimeout);
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser.uid);
        } catch (e) {
          console.warn('Auth state profile fetch error:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [fetchProfile]);

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const setProfileData = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, setProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
