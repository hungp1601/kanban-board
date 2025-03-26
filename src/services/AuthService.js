import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "../firebase/config";

class AuthService {
  constructor() {
    // Set up persistence to session to avoid issues with persistence across tabs
    setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
  }

  // Register a new user
  async register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Update the user profile with display name
      await updateProfile(userCredential.user, { displayName });
      return userCredential.user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Login a user
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Logout the current user
  async logout() {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  // Get the current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!auth.currentUser;
  }

  // Listen to auth state changes with better error handling
  onAuthStateChange(callback) {
    return onAuthStateChanged(
      auth,
      (user) => {
        try {
          callback(user);
        } catch (error) {
          console.error("Error in auth state change callback:", error);
        }
      },
      (error) => {
        console.error("Auth state change error:", error);
      }
    );
  }
}

export default new AuthService();
