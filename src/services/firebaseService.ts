import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let isSigningIn = false;

export async function signInWithGoogle() {
  if (isSigningIn) {
    console.warn("Sign-in already in progress");
    return;
  }

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Suppress the error if it's just a cancellation to prevent noisy alerts/logs
    if (error.code === 'auth/cancelled-popup-request') {
      console.log("Previous sign-in request cancelled by a new one.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log("Sign-in popup closed by user.");
    } else {
      console.error("Error signing in with Google", error);
      throw error;
    }
  } finally {
    isSigningIn = false;
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveDesign(userId: string, designData: any) {
  try {
    const docRef = await addDoc(collection(db, 'designs'), {
      ...designData,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving design:", error);
    throw error;
  }
}

export async function getUserDesigns(userId: string) {
  try {
    const q = query(collection(db, 'designs'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching designs:", error);
    throw error;
  }
}

// Validation connection as required by instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
