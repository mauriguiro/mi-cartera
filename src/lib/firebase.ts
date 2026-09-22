import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: 'AIzaSyBqEqWFe2C6HqQmNgHtYrUykrHvtKQqRL0',
  appId: '1:25840353255:web:b285ed8fc6180934a08742',
  messagingSenderId: '25840353255',
  projectId: 'mi-cartera-7bd21',
  authDomain: 'mi-cartera-7bd21.firebaseapp.com',
  storageBucket: 'mi-cartera-7bd21.firebasestorage.app',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Enable offline persistence
// if (typeof window !== 'undefined') {
//   enableMultiTabIndexedDbPersistence(db).catch((err) => {
//     console.error("Firebase persistence error:", err);
//   });
// }

export { db };
