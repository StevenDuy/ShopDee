"use client";

import { useState, useEffect } from "react";
import { UnifiedInbox } from "@/components/communication/UnifiedInbox";
import { useTranslation } from "react-i18next";

export default function CustomerInboxPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Removed blocking loader for faster perceived performance
  // if (loading) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground animate-in fade-in duration-500">
      {/* Mobile Sticky Header - Synchronized with Menu Button */}
      <div className="lg:hidden sticky top-0 z-[100] bg-background border-b-2 border-primary flex h-[74px] items-stretch shrink-0">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex items-center justify-center font-black text-sm uppercase tracking-[0.2em]">
          {t("messages")}
        </div>
        <div className="w-14 shrink-0" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full overflow-hidden p-0 md:p-6 container-2d">
          <div className="h-full w-full overflow-hidden border-2 border-border bg-card">
            <UnifiedInbox />
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Hide footer on inbox page */
        footer {
          display: none !important;
        }
        /* Fix Layout padding */
        main {
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}
