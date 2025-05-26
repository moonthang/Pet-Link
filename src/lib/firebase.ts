
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
  type Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  addDoc,
  deleteDoc,
  writeBatch,
  where,
  limit,
  type Firestore
} from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBtKI2MO07fRgcy8z8ZNhejEZBZP-knTPQ",
  authDomain: "pets-21a36.firebaseapp.com",
  projectId: "pets-21a36",
  storageBucket: "pets-21a36.appspot.com",
  messagingSenderId: "364075953476",
  appId: "1:364075953476:web:10a2ad088caf9e35c97b11",
  measurementId: "G-SPP9KHTE8S"
};


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const authInstance: Auth = getAuth(app);
const dbInstance: Firestore = getFirestore(app);

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export {
  app,
  authInstance as auth,
  dbInstance as db,
  analytics,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  firebaseSignOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  addDoc,
  deleteDoc,
  writeBatch,
  where,
  limit,
  type FirebaseUser,
  type Auth,
  type Firestore
};
