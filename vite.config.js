import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  base: "./", // Add this line to use relative paths for assets
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Using includePaths instead of additionalData for better module support
        includePaths: [path.resolve(__dirname, "./src/assets")],
      },
    },
  },
});
