// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const REPO_NAME = "TalentTrack-LMS-Assessment-Management-System";

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
