import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  publicDir: path.resolve(__dirname, "../public"),
  base: process.env.GITHUB_PAGES === "true" ? "/sshx/" : "./",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
  },
});

