import { FirebaseApp, initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (Singleton pattern)
const isConfigValid = !!firebaseConfig.projectId && !!firebaseConfig.apiKey;
export const isFirebaseConfigured = isConfigValid;

let app: FirebaseApp | null = null;
try {
  if (!getApps().length) {
    if (isConfigValid) {
      app = initializeApp(firebaseConfig);
    } else {
      console.warn("Firebase config is missing. AI/Analytics may not work.");
    }
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const storage = app ? getStorage(app) : null;

// Initialize Analytics conditionally (only in browser and if config is valid)
if (typeof window !== "undefined" && isConfigValid) {
  isSupported().then((supported) => {
    if (supported && app) getAnalytics(app);
  });
}

export default app;