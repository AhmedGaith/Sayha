import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  /** `npm run preview` — use http://localhost:4173 with API on 3001 */
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
});
