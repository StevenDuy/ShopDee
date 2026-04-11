"use client";
import { useState, useEffect } from "react";
import { UnifiedInbox } from "@/components/communication/UnifiedInbox";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function CustomerInboxPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full overflow-hidden relative z-10"
      >
        <UnifiedInbox />
      </motion.div>

      <style jsx global>{`
        /* Hide footer on inbox page */
        footer {
          display: none !important;
        }
        /* Force full width and height fit with sidebar */
        main {
          padding: 0 !important;
          max-width: none !important;
          overflow: hidden !important;
          height: 100vh !important;
        }
        main > div {
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
          height: 100% !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}
