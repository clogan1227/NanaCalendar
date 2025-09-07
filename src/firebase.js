import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let db;
try {
  db = initializeFirestore(app, {
    // This enables offline persistence.
    // CACHE_SIZE_UNLIMITED means there's no specific limit on the cache size.
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  });
  console.log("Firestore persistence enabled.");
}
catch (err) {
  console.error("Error enabling Firestore persistence:", err);
  if (err.code === 'failed-precondition') {
    // This can happen if multiple tabs are open.
    console.warn("Firestore persistence failed: multiple tabs open? The app will still work online.");
  } else if (err.code === 'unimplemented') {
    // The browser does not support all of the features required.
    console.error("Firestore persistence is not available in this browser.");
  }
  db = getFirestore(app); // Optional: fallback to online-only mode
}

const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };