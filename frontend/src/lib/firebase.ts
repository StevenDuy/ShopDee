import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAk49CFkUtNMPZRiyXCHiUhYLhtwBmGeDc",
  authDomain: "shopdee-chat.firebaseapp.com",
  projectId: "shopdee-chat",
  storageBucket: "shopdee-chat.firebasestorage.app",
  messagingSenderId: "974937269494",
  appId: "1:974937269494:web:5e30df9c2be791e4f9b8d7",
  measurementId: "G-DTW3ZTXYDK"
};

// Initialize Firebase (Singleton pattern to avoid multiple initializations in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const storage = getStorage(app);

// Initialize Analytics conditionally (only in browser)
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export default app;