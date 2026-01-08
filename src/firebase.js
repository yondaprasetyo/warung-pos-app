// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE CONFIG DARI FIREBASE CONSOLE DI SINI
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "warung-pos-38627.firebaseapp.com",
  projectId: "warung-pos-38627",
  storageBucket: "warung-pos-38627.firebasestorage.app",
  messagingSenderId: "498104691222",
  appId: "1:498104691222:web:8dc53f8a1d4c635648e337",
  measurementId: "G-3R7EHPENJG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);