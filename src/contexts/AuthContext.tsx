'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Create or update user document in Firestore
          await createUserDocument(user);
        }
        setUser(user);
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(user); // Still set the user even if Firestore fails
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const createUserDocument = async (user: User) => {
    try {
      // Add timeout to prevent hanging
      await Promise.race([
        (async () => {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const { displayName, email, photoURL } = user;
            await setDoc(userRef, {
              displayName: displayName || email?.split('@')[0] || 'User',
              email,
              photoURL,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              projectCount: 0
            });
          } else {
            // Update last login time
            await setDoc(userRef, {
              lastLoginAt: serverTimestamp()
            }, { merge: true });
          }
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User document timeout')), 5000)
        )
      ]);
    } catch (error: any) {
      console.error('Error with user document:', error);
      // Don't throw error for offline issues - user can still use the app
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.log('Working offline - user document will sync when online');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const updateUserProfile = async (displayName: string) => {
    if (user) {
      try {
        await updateProfile(user, { displayName });
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { displayName }, { merge: true });
      } catch (error: any) {
        throw new Error('Failed to update profile');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to logout');
    }
  };

  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed. Please try again.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};