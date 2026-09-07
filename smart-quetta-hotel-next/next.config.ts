// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";


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
  devIndicators: false,
  /**
   * IMPORTANT:
   *
   * Your actual Next.js project is:
   *
   * I:\Github_CLALI\
   *   smart-quetta-hotel\
   *     smart-quetta-hotel-next\
   *
   * But there is another package-lock.json in:
   *
   * I:\Github_CLALI\
   *   smart-quetta-hotel\
   *
   * Therefore Next/Turbopack tries to use the parent
   * directory as the workspace root.
   *
   * Explicitly setting root prevents that.
   */
  turbopack: {
    root: __dirname,
  },
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