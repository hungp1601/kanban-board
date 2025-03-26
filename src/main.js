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

// Add a timeout to avoid hanging forever if Firebase auth is slow
const authTimeout = setTimeout(() => {
  if (!authInitialized) {
    console.warn("Firebase auth initialization timed out, creating app anyway");
    initializeApp();
  }
}, 5000); // 5 seconds timeout

// Wait for Firebase Auth to initialize before creating the app
auth.onAuthStateChanged((firebaseUser) => {
  clearTimeout(authTimeout);
  if (!authInitialized) {
    authInitialized = true;
    initializeApp();
  }
});

function initializeApp() {
  if (!app) {
    app = createApp(App);
    app.use(CKEditor);
    app.use(i18n);

    // Make AuthService available globally
    app.config.globalProperties.$auth = AuthService;

    app.mount("#app");
  }
}
