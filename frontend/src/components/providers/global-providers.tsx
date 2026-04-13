"use client";

import { ThemeProvider } from "./theme-provider";
import { useEffect, useState } from "react";
import "../../lib/i18n/config"; // Initialize i18n
import "../../lib/echo"; // Initialize WebSocket client
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";

import { Toaster } from "sonner";
import { ConfigAlert } from "./config-alert";
import { GlobalEventListener } from "./global-event-listener";
import TelemetryTracker from "../common/TelemetryTracker";

function CurrencySync() {
  const { i18n } = useTranslation();
  const { setCurrency } = useCurrencyStore();

  useEffect(() => {
    const syncCurrency = (lng: string) => {
      if (lng === "vi") setCurrency("VND");
      else if (lng === "en") setCurrency("USD");
    };

    // Initial sync
    syncCurrency(i18n.language);

    // Listen for future changes
    i18n.on('languageChanged', syncCurrency);
    return () => {
      i18n.off('languageChanged', syncCurrency);
    };
  }, [i18n, setCurrency]);

  return null;
}

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
      <CurrencySync />
      <ConfigAlert />
      <GlobalEventListener />
      <TelemetryTracker />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
