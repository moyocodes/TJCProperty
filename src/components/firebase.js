// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyBvm5a7_2jRS9iLcmYJuSEPde4IaWh4MFc",
  authDomain: "tjc-67d21.firebaseapp.com",
  projectId: "tjc-67d21",
  storageBucket: "tjc-67d21.firebasestorage.app",
  messagingSenderId: "595134630580",
  appId: "1:595134630580:web:69da5cdb3a4880ae5725e1",
  measurementId: "G-37ECYKP89M",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { db, doc, setDoc, auth, analytics, storage };



