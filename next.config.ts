import type { NextConfig } from "next";
import { networkInterfaces } from "os";

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
  "[192.168.220.24]",
  "[192.168.1.134]",
];

for (const iface of Object.values(nets)) {
  for (const net of iface ?? []) {
    if (net.family === "IPv4") {
      localIps.push(net.address);
    }
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Native C++ modules must be treated as external packages on the server
  serverExternalPackages: ["better-sqlite3"],
  // Permit any local network / mobile / laptop connection automatically
  allowedDevOrigins: Array.from(new Set(localIps)),
};

export default nextConfig;
