
'use client';

import { 
  auth, 
  db, 
  onAuthStateChanged, 
  firebaseSignOut, 
  doc, 
  getDoc,
  type FirebaseUser
} from '@/lib/firebase'; 
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setAppUser: (user: AppUser | null) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUserState, setAppUserState] = useState<AppUser | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userDataFromFirestore = userDocSnap.data();
          const combinedUserData: AppUser = { 
            uid: user.uid, 
            email: user.email || '', 
            ...userDataFromFirestore 
          } as AppUser;

          if (typeof combinedUserData.nivel === 'undefined') {
            combinedUserData.nivel = 'user';
          }
          setAppUserState(combinedUserData);
        } else {
          setAppUserState(null); 
        }
      } else {
        setAppUserState(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => { 
    await firebaseSignOut(auth);
    setAppUserState(null);
    setCurrentUser(null);
    router.push('/'); 
  };
  
  useEffect(() => {
    if (currentUser && !appUserState && !isLoading) { 
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userDataFromFirestore = userDocSnap.data();
          const combinedUserData: AppUser = { 
            uid: currentUser.uid, 
            email: currentUser.email || '', 
            ...userDataFromFirestore
          } as AppUser;

           if (typeof combinedUserData.nivel === 'undefined') {
            combinedUserData.nivel = 'user';
           }
           setAppUserState(combinedUserData);
        }
      };
      fetchUserData();
    }
  }, [currentUser, appUserState, isLoading]); 

  const exposedSetAppUser = (user: AppUser | null) => {
    setAppUserState(user);
  };

  const value = { 
    currentUser, 
    appUser: appUserState, 
    isLoading, 
    signOut: handleSignOut, 
    setAppUser: exposedSetAppUser 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
