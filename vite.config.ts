import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { tanstackRouter } from '@tanstack/router-plugin/vite'
// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "#convex": path.resolve(__dirname, "./convex"),
    },
  },
});
