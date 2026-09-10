"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Captive Portal Forwarder Feature (MVVM)
 * Forwards guest browser from router redirect to the Home page.
 */
export function PortalView() {
  const router = useRouter();

  useEffect(() => {
    const search = window.location.search;
    router.replace(`/${search}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
    </div>
  );
}

export default PortalView;
