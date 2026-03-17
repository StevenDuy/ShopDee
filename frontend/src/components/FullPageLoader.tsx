"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function FullPageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-24 h-24 rounded-full border-t-4 border-l-4 border-primary/30"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-20 h-20 rounded-full border-b-4 border-r-4 border-primary mt-2"
        />
        
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

        {/* Center Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Sparkles className="text-primary" size={32} />
        </motion.div>
      </div>

      {/* Text with Shimmer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <span className="text-xl font-bold tracking-widest text-foreground uppercase">
          ShopDee
        </span>
        <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse mt-2">
          Đang tải dữ liệu, vui lòng chờ giây lát...
        </p>
      </motion.div>
    </motion.div>
  );
}
