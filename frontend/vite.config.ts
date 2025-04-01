import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import glsl from 'vite-plugin-glsl';
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), glsl(), tailwindcss()],
  server: {
    host: true, // Open to local network and display url
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
});
