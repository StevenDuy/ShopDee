"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function SellerInboxPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full overflow-hidden relative z-10"
      >
        <UnifiedInbox />
      </motion.div>

      <style jsx global>{`
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
