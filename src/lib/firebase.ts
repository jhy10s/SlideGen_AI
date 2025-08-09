import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAUKJPW015sBmLzL_X-G0RvvjrpQsiRTM",
  authDomain: "gen-lang-client-0329006841.firebaseapp.com",
  projectId: "gen-lang-client-0329006841",
  storageBucket: "gen-lang-client-0329006841.firebasestorage.app",
  messagingSenderId: "250473298955",
  appId: "1:250473298955:web:16764b3b36625984cddb0e",
  measurementId: "G-32TQH7CCKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence and handle network issues
if (typeof window !== 'undefined') {
  // Only run on client side
  try {
    // Enable network by default
    enableNetwork(db).catch((error) => {
      console.warn('Failed to enable Firestore network:', error);
    });
  } catch (error) {
    console.warn('Firestore network setup error:', error);
  }
}

// Helper functions for network management
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore network enabled');
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    console.log('Firestore network disabled');
  } catch (error) {
    console.error('Failed to disable Firestore network:', error);
  }
};

export default app;