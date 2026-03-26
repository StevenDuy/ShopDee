"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedInbox } from "@/components/communication/UnifiedInbox";


export default function SellerInboxPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập load inbox nhanh
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden bg-muted/20">
      <AnimatePresence>
        
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full p-0 md:p-6"
      >
        <div className="h-[calc(100vh-48px)] w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50">
          <UnifiedInbox />
        </div>
      </motion.div>
    </div>
  );
}

