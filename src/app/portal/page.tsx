"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Portal = dynamic(() => import("@/views/Portal"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
    </div>
  ),
});

export default function PortalPage() {
  return <Portal />;
}
