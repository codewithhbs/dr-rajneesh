import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Simple Vite setup: React plugin + "@" alias pointing to /src
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
