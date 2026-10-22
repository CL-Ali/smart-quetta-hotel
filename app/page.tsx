"use client";

import dynamic from "next/dynamic";
import { FaSpinner } from "react-icons/fa6";

const CustomerPortalView = dynamic(
  () => import("@/features/customer-portal"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-amber-500" />
          <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Loading Smart Hotel…</p>
        </div>
      </div>
    ),
  }
);

export default function RootPage() {
  return <CustomerPortalView />;
}
