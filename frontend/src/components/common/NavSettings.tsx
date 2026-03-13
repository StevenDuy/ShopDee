"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface NavSettingsProps {
  collapsed?: boolean;
}

export function NavSettings({ collapsed = false }: NavSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState("VND");

  useEffect(() => setMounted(true), []);

  const toggleLang = () => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi");
  const toggleCurrency = () => setCurrency(currency === "VND" ? "USD" : "VND");

  if (!mounted) return null;

  return (
    <div className="space-y-1">
      {/* Theme Toggle */}
      <button 
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground"
      >
        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="truncate"
            >
              {theme === "dark" ? t("light_mode") : t("dark_mode")}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Language Toggle */}
      <button 
        type="button"
        onClick={toggleLang}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground"
      >
        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
          <Globe size={18} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="truncate"
            >
              {i18n.language === "vi" ? "🇻🇳 Tiếng Việt" : "🇺🇸 English"}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Currency Toggle */}
      <button 
        type="button"
        onClick={toggleCurrency}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground"
      >
        <div className="shrink-0 w-5 h-5 flex items-center justify-center font-bold text-[10px] border border-muted-foreground rounded-sm">
          {currency === "VND" ? "đ" : "$"}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="truncate"
            >
              {currency === "VND" ? "VNĐ" : "USD"}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
