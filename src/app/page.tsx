"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Home = dynamic(() => import("@/views/Home"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  ),
});

export default function RootPage() {
  return <Home />;
}
