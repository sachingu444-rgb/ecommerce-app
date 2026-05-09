import { getApp, getApps, initializeApp } from "firebase/app";
import {
  User,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBHIlDiLHhu6W2kfSB_jvPScrZ-Beuv5nA",
  authDomain: "ecommerce-baf11.firebaseapp.com",
  projectId: "ecommerce-baf11",
  storageBucket: "ecommerce-baf11.firebasestorage.app",
  messagingSenderId: "793394259457",
  appId: "1:793394259457:web:77955caf978eb6a9548200",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const waitForAuthReady = async (): Promise<User | null> => {
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const logCurrentAuthUser = () => {
  const currentUser = auth.currentUser;
  console.log(
    "[Firebase Auth] auth.currentUser:",
    currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
        }
      : null
  );
  return currentUser;
};

export default app;
