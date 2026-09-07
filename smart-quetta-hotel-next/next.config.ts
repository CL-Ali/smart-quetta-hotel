// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { networkInterfaces } from "os";


// const withPWA = withPWAInit({
//   dest: "public",
//   cacheOnFrontEndNav: true,
//   aggressiveFrontEndNavCaching: true,
//   reloadOnOnline: true,
//   disable: process.env.NODE_ENV === "development",
//   workboxOptions: {
//     runtimeCaching: [
//       {
//         urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
//         handler: "CacheFirst",
//         options: {
//           cacheName: "unsplash-images",
//           expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
//         },
//       },
//     ],
//   },
// });

// const nextConfig: NextConfig = {
/* your other config options go here */
// };

// export default withPWA(nextConfig);

// new file: smart-quetta-hotel-next/next.config.ts
// next.config.ts
// Automatically detect all active network interfaces on this machine
const nets = networkInterfaces();
const localIps: string[] = [
  "localhost",
  "127.0.0.1",
  // Allow all standard private LAN / WiFi subnets for any laptop or device
  "192.168.*",
  "10.*",
  "172.16.*",
  "172.20.*",
  "172.31.*",
  "*.local",
  "*.lan",
];

for (const iface of Object.values(nets)) {
  for (const net of iface ?? []) {
    if (net.family === "IPv4") {
      localIps.push(net.address);
    }
  }
}

/**
 * =========================================================
 * PWA CONFIGURATION
 * =========================================================
 *
 * PWA is required by the application.
 *
 * We are NOT removing or replacing PWA.
 *
 * PWA is only disabled during development because service
 * worker generation/caching is not needed while developing.
 * It will be enabled automatically for production builds.
 */
const withPWA = withPWAInit({
  /**
   * Directory where PWA/service-worker files are generated.
   */
  dest: "public",

  /**
   * Improve client-side navigation caching.
   */
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,

  /**
   * Reload the application when the browser comes back online.
   */
  reloadOnOnline: true,

  /**
   * Disable PWA processing ONLY during development.
   *
   * Production:
   *   NODE_ENV = production
   *   disable = false
   *
   * Development:
   *   NODE_ENV = development
   *   disable = true
   */
  disable: process.env.NODE_ENV === "development",

  /**
   * =======================================================
   * WORKBOX RUNTIME CACHING
   * =======================================================
   *
   * Cache Unsplash images so repeated requests can be served
   * from the browser cache.
   */
  workboxOptions: {
    runtimeCaching: [
      {
        /**
         * Only match Unsplash image URLs.
         */
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,

        /**
         * Use the cached image first.
         */
        handler: "CacheFirst",

        options: {
          cacheName: "unsplash-images",

          expiration: {
            /**
             * Maximum number of cached images.
             */
            maxEntries: 50,

            /**
             * Cache images for 30 days.
             */
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});

/**
 * =========================================================
 * NEXT.JS CONFIGURATION
 * =========================================================
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Native C++ modules must be treated as external packages on the server
  serverExternalPackages: ["better-sqlite3"],
  // Permit any local network / mobile / laptop connection automatically
  allowedDevOrigins: Array.from(new Set(localIps)),
};
/**
 * =========================================================
 * EXPORT
 * =========================================================
 *
 * PWA remains enabled for production.
 * PWA is disabled during development according to the
 * configuration above.
 */

export default withPWA(nextConfig);



