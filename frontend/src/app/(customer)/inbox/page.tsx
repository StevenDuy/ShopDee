"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedInbox } from "@/components/communication/UnifiedInbox";
import FullPageLoader from "@/components/FullPageLoader";

export default function CustomerInboxPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/20">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div 
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-full w-full overflow-hidden p-0 md:p-6">
          <div className="h-full w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50">
            <UnifiedInbox />
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        /* Ẩn footer chỉ trên trang inbox của customer */
        footer {
          display: none !important;
        }
        /* Đảm bảo Main của CustomerLayout không có padding lạ */
        main {
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}
