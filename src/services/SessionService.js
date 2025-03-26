/**
 * Service for managing authentication session state in localStorage
 */
const SESSION_KEY = "kanban-auth-session";

const SessionService = {
  /**
   * Save auth session data to localStorage
   * @param {Object} userData - User data to persist
   */
  saveSession(userData) {
    if (!userData) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    // Store only necessary user information
    const sessionData = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName || null,
      photoURL: userData.photoURL || null,
      // Add creation timestamp
      timestamp: Date.now(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  },

  /**
   * Get saved auth session from localStorage
   * @returns {Object|null} User session data or null if not found
   */
  getSession() {
    const sessionData = localStorage.getItem(SESSION_KEY);

    if (!sessionData) {
      return null;
    }

    try {
      return JSON.parse(sessionData);
    } catch (error) {
      console.error("Failed to parse session data:", error);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  /**
   * Clear the auth session from localStorage
   */
  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },

  /**
   * Check if there is a valid session stored
   * @returns {Boolean} True if valid session exists
   */
  hasValidSession() {
    const session = this.getSession();
    if (!session) return false;

    // Optional: Check if session is still valid (e.g., not too old)
    // Example: session valid for 7 days
    const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const isExpired = Date.now() - session.timestamp > SESSION_MAX_AGE;

    if (isExpired) {
      this.clearSession();
      return false;
    }

    return true;
  },
};

export default SessionService;
