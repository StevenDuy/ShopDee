"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedInbox } from "@/components/communication/UnifiedInbox";
import FullPageLoader from "@/components/FullPageLoader";

export default function AdminInboxPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="h-[calc(100vh-48px)] w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50"
      >
        <UnifiedInbox />
      </motion.div>
    </div>
  );
}
