import { createI18n } from "vue-i18n";
import en from "./locales/en.js";
import vi from "./locales/vi.js";

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem("kanban-language") || "en", // Default language
  fallbackLocale: "en", // Fallback language
  messages: {
    en,
    vi,
  },
});

export default i18n;
