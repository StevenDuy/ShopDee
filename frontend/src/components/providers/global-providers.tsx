"use client";

import { ThemeProvider } from "./theme-provider";
import { useEffect, useState } from "react";
import "../../lib/i18n/config"; // Initialize i18n
import "../../lib/echo"; // Initialize WebSocket client

import { Toaster } from "sonner";
import { ConfigAlert } from "./config-alert";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ConfigAlert />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
