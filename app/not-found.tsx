"use client";

import dynamic from "next/dynamic";

const NotFoundView = dynamic(() => import("@/features/not-found"), {
  ssr: false,
});

export default function NotFoundPage() {
  return <NotFoundView />;
}
