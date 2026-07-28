import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "classic",
        // Suppress "no files matched" glob warning in dev mode
        suppressWarnings: true,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        id: "/",
        name: "Smart Quetta Hotel",
        short_name: "Quetta Hotel",
        description: "Smart hotel ordering — place orders, track kitchen, manage payments",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#ea580c",
        lang: "en",
        categories: ["food", "business"],
        icons: [
          { src: "/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/logo-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          { src: "/images/screenshot-narrow.jpeg", sizes: "632x1390", type: "image/jpeg", form_factor: "narrow", label: "Customer menu and order view" },
          { src: "/images/screenshot-wide.jpeg", sizes: "1264x1390", type: "image/jpeg", form_factor: "wide", label: "Customer menu and admin dashboard" },
        ],
        shortcuts: [
          { name: "Dashboard", short_name: "Admin", url: "/dashboard", icons: [{ src: "/logo-192.png", sizes: "192x192" }] },
          { name: "Kitchen", short_name: "Kitchen", url: "/kitchen", icons: [{ src: "/logo-192.png", sizes: "192x192" }] },
          { name: "Waiter", short_name: "Waiter", url: "/waiter", icons: [{ src: "/logo-192.png", sizes: "192x192" }] },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname),
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    fs: {
      strict: true,
      deny: ["**/.env", "**/.env.*", "**/.*rc", "**/.*ignore"],
    },
  },
});
