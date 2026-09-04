"use client";

import Home from "@/pages/Home";

import ErrorBoundary from "./src/components/ErrorBoundary";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { LangProvider } from "./src/contexts/LangContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "./src/components/ui/sonner";
import { useSocket } from "@/hooks/useSocket";

function SocketOwner() {
  useSocket({ owner: true });
  return null;
}

export default function Page() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LangProvider>
          <TooltipProvider>
            <Toaster />
            <SocketOwner />

            <Home />

          </TooltipProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
