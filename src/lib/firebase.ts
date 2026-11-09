import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);

// Connect to Local Firebase Emulators when Sandbox/Staging mode is enabled
const authEmulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
const firestoreEmulator = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
const storageEmulator = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST;

if (authEmulator) {
  try {
    connectAuthEmulator(auth, `http://${authEmulator}`, { disableWarnings: true });
  } catch {
    // Emulator already connected in hot-reload
  }
}

if (firestoreEmulator) {
  try {
    const [host, port] = firestoreEmulator.split(":");
    connectFirestoreEmulator(db, host || "127.0.0.1", parseInt(port || "8080"));
  } catch {
    // Emulator already connected in hot-reload
  }
}

if (storageEmulator) {
  try {
    const [host, port] = storageEmulator.split(":");
    connectStorageEmulator(storage, host || "127.0.0.1", parseInt(port || "9199"));
  } catch {
    // Emulator already connected in hot-reload
  }
}

export default app;
