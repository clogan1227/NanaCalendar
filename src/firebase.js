/**
 * @file firebase.js
 * @description This file handles the initialization of all Firebase services used
 * throughout the application. It configures and exports singleton instances of
 * Firestore, Storage, and Auth, and includes a robust setup for enabling
 * Firestore's offline data persistence with a fallback mechanism.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration object for Firebase, securely loaded from environment variables.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initializes the core Firebase app instance.
const app = initializeApp(firebaseConfig);

// A variable to hold the Firestore database instance.
let db;

/**
 * Attempts to initialize Firestore with offline persistence enabled. This allows
 * the application to work with cached data even when offline. If persistence
 * fails to initialize (e.g., due to multiple tabs being open), it gracefully
 * falls back to the standard online-only mode.
 */
try {
  db = initializeFirestore(app, {
    // This enables offline data caching
    localCache: persistentLocalCache(),
  });
  console.log("Firestore persistence enabled.");
} catch (err) {
  console.error("Error enabling Firestore persistence:", err);
  // Fallback to the standard online-only Firestore instance if persistence fails.
  db = getFirestore(app);
}

// Initializes and exports the Firebase Storage service.
const storage = getStorage(app);
// Initializes and exports the Firebase Authentication service.
const auth = getAuth(app);

export { db, storage, auth };