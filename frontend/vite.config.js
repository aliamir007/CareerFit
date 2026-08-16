import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Fail loudly if 5173 is taken. Vite's default is to silently move to the
    // next free port, which then no longer matches the backend's FRONTEND_URL
    // and every request dies on CORS.
    strictPort: true,
  },
});
