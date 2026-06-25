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
      // Auto-update SW in background — user gets latest without manual reload
      registerType: "autoUpdate",

      // Include SW in dev mode so install prompt can be tested locally
      devOptions: {
        enabled: true,
        type: "module",
      },

      // Workbox config — what to precache
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Never cache API calls
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Cache images from unsplash and other CDNs at runtime
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },

      // Web App Manifest — every field that Chrome/Safari uses for install
      manifest: {
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
          {
            src: "/logo-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Admin",
            url: "/dashboard",
            icons: [{ src: "/logo-192.png", sizes: "192x192" }],
          },
          {
            name: "Kitchen",
            short_name: "Kitchen",
            url: "/kitchen",
            icons: [{ src: "/logo-192.png", sizes: "192x192" }],
          },
          {
            name: "Waiter",
            short_name: "Waiter",
            url: "/waiter",
            icons: [{ src: "/logo-192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
