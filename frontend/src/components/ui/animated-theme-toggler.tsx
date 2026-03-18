"use client";

import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useThemeTransition } from "@/hooks/useThemeTransition";

export function AnimatedThemeToggler({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button">) {
  const [mounted, setMounted] = useState(false);
  const { toggleTheme, resolvedTheme } = useThemeTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 border border-border/50 bg-card",
          className,
        )}
        {...props}
      >
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={(e) => toggleTheme(e as any)}
      className={cn(
        "inline-flex items-center justify-center rounded-xl overflow-hidden text-sm font-medium transition-colors hover:bg-accent border border-border/50 bg-card active:scale-95 transition-all text-foreground h-10 w-10 relative shadow-sm",
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ 
            duration: 0.3,
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 fill-amber-500/20" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem] text-indigo-600 fill-indigo-600/10" />
          )}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
