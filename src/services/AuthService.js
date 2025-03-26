import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";
import SessionService from "./SessionService";

const AuthService = {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @returns {Promise} Firebase user object
   */
  async register(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Save session data after successful registration
    SessionService.saveSession(userCredential.user);

    return userCredential.user;
  },

  /**
   * Log in an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Firebase user object
   */
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Save session data after successful login
    SessionService.saveSession(userCredential.user);

    return userCredential.user;
  },

  /**
   * Log out the current user
   * @returns {Promise} Void promise
   */
  async logout() {
    // Clear session data before Firebase logout
    SessionService.clearSession();
    return signOut(auth);
  },

  /**
   * Set up an auth state change listener
   * @param {Function} callback - Function to call on auth state change
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, update session
        SessionService.saveSession(user);
      } else {
        // User is signed out, clear session
        SessionService.clearSession();
      }

      // Call original callback with user object
      callback(user);
    });
  },

  /**
   * Get current user from session if available
   * @returns {Object|null} User object or null
   */
  getCurrentUser() {
    return auth.currentUser || SessionService.getSession();
  },

  /**
   * Check if user is logged in
   * @returns {Boolean} True if user is logged in
   */
  isLoggedIn() {
    return !!auth.currentUser || SessionService.hasValidSession();
  },
};

export default AuthService;
