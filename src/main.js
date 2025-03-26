import { createApp } from "vue";
import App from "./App.vue";
import CKEditor from "@ckeditor/ckeditor5-vue";
import "@fortawesome/fontawesome-free/css/all.css";
import { auth } from "./firebase/config";
import i18n from "./i18n";
import SessionService from "./services/SessionService";
import AuthService from "./services/AuthService";

let app;
let authInitialized = false;

// Check for existing session before auth initialization
const existingSession = SessionService.getSession();

// Reduce timeout from 5000ms to 2000ms for faster app initialization
const authTimeout = setTimeout(() => {
  if (!authInitialized) {
    console.warn("Firebase auth initialization timed out, creating app anyway");
    initializeApp(existingSession ? { user: existingSession } : null);
  }
}, 2000); // Reduced to 2 seconds timeout

// Wait for Firebase Auth to initialize before creating the app
auth.onAuthStateChanged((firebaseUser) => {
  clearTimeout(authTimeout);
  if (!authInitialized) {
    authInitialized = true;
    initializeApp({ user: firebaseUser });
  }
});

function initializeApp(initialState = null) {
  if (!app) {
    app = createApp(App, { initialState });
    app.use(CKEditor);
    app.use(i18n);

    // Make AuthService available globally
    app.config.globalProperties.$auth = AuthService;

    app.mount("#app");
  }
}

// Initialize after a max delay if Firebase is unresponsive
setTimeout(() => {
  if (!app) {
    console.error("Application initialization failed, forcing startup");
    initializeApp();
  }
}, 3000);
