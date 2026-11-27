import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_PROXY_TIMEOUT_MS = 120_000;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        timeout: API_PROXY_TIMEOUT_MS,
        proxyTimeout: API_PROXY_TIMEOUT_MS,
      },
    },
  },
});
