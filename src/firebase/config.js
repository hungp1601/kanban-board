import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDt8Xr_JYchGhwA6CiDSchlhbEu2_tl2Mc",
  authDomain: "todo-app-b6521.firebaseapp.com",
  projectId: "todo-app-b6521",
  storageBucket: "todo-app-b6521.firebasestorage.app",
  messagingSenderId: "98447186352",
  appId: "1:98447186352:web:e31f3ada456ee446f41e75",
  measurementId: "G-3VBZJ9YPHL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
