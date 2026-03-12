/**
 * LoanMate — Firebase Configuration
 * Initialize Firebase app and messaging for push notifications.
 * 
 * NOTE: Firebase config values are non-secret (they are client-side identifiers).
 * Security is enforced by Firebase Security Rules on the backend.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

// Firebase configuration — these are public client identifiers
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

/**
 * Initialize Firebase app (singleton)
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!isFirebaseConfigured()) {
    console.warn("[LoanMate] Firebase not configured — push notifications disabled");
    return null;
  }
  try {
    app = initializeApp(firebaseConfig);
    return app;
  } catch (error) {
    console.error("[LoanMate] Failed to initialize Firebase:", error);
    return null;
  }
}

/**
 * Get Firebase Cloud Messaging instance
 */
export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    console.error("[LoanMate] Failed to initialize FCM:", error);
    return null;
  }
}

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
