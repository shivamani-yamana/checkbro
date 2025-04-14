import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import tailwindcssPlugin from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    // Use the tailwindcss plugin correctly
    tailwindcssPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
