"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";

const STAFF_ROUTES = ["/dashboard", "/kitchen", "/waiter"];

export function StaffNavBar() {
  const pathname = usePathname();
  const isStaffRoute = STAFF_ROUTES.some((route) => pathname.startsWith(route));

  if (!isStaffRoute) return null;
  return <NavBar />;
}
