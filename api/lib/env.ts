export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Raw PIN for comparison — frontend sends decoded value via header.
  // Phase 6: replace with per-staff OAuth tokens.
  dashboardPin: (process.env.DASHBOARD_PIN ?? "1234").trim(),
};
