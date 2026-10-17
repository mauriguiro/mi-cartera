import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: 'AIzaSyBqEqWFe2C6HqQmNgHtYrUykrHvtKQqRL0',
  appId: '1:25840353255:web:b285ed8fc6180934a08742',
  messagingSenderId: '25840353255',
  projectId: 'mi-cartera-7bd21',
  authDomain: 'mi-cartera-7bd21.firebaseapp.com',
  storageBucket: 'mi-cartera-7bd21.firebasestorage.app',
};

const emailAuthConfig = {
  apiKey: 'AIzaSyA-cUgP6Q5H88NC4Bh1026Lyhj_NByQKrs',
  appId: '1:309008920891:web:8f08d643cd90d5c41d471e',
  messagingSenderId: '309008920891',
  projectId: 'app-de-finanzas-399ed',
  authDomain: 'app-de-finanzas-399ed.firebaseapp.com',
  storageBucket: 'app-de-finanzas-399ed.firebasestorage.app',
};

const app = getApps().some((a) => a.name === '[DEFAULT]')
  ? getApp()
  : initializeApp(firebaseConfig);

const authApp = getApps().some((a) => a.name === 'micartera-email-auth')
  ? getApp('micartera-email-auth')
  : initializeApp(emailAuthConfig, 'micartera-email-auth');

const db = getFirestore(app);
const emailAuth = getAuth(authApp);
emailAuth.languageCode = 'es';

export { db, emailAuth };
