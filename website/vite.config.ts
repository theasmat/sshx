import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/sshx/" : "./",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
  },
});
