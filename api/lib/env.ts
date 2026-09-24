export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "smart-quetta-hotel-jwt-secret-key-2026",
  isProduction: process.env.NODE_ENV === "production",
};
