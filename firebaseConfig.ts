import { getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBHIlDiLHhu6W2kfSB_jvPScrZ-Beuv5nA",
  authDomain: "ecommerce-baf11.firebaseapp.com",
  projectId: "ecommerce-baf11",
  storageBucket: "ecommerce-baf11.firebasestorage.app",
  messagingSenderId: "793394259457",
  appId: "1:793394259457:web:77955caf978eb6a9548200",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const createAuth = () => {
  if (Platform.OS === "web") {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/already-initialized"
    ) {
      return getAuth(app);
    }

    throw error;
  }
};

export const auth = createAuth();
// Firestore and Storage should be protected with environment-specific security rules before release.
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

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
