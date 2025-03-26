import { createApp } from "vue";
import App from "./App.vue";
import CKEditor from "@ckeditor/ckeditor5-vue";
import "@fortawesome/fontawesome-free/css/all.css";
import { auth } from "./firebase/config";
import i18n from "./i18n";

let app;
let authInitialized = false;

// Add a timeout to avoid hanging forever if Firebase auth is slow
const authTimeout = setTimeout(() => {
  if (!authInitialized) {
    console.warn("Firebase auth initialization timed out, creating app anyway");
    initializeApp();
  }
}, 5000); // 5 seconds timeout

// Wait for Firebase Auth to initialize before creating the app
auth.onAuthStateChanged(() => {
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
    app.mount("#app");
  }
}
