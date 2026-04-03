"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface EliteComboboxProps {
  options: { label: string; value: string; searchTerms?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  label?: string;
}

export function EliteCombobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  label,
}: EliteComboboxProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = t("common.select") || "Select option...";
  const defaultSearchPlaceholder = t("common.search") || "Search...";
  const defaultEmptyMessage = t("common.no_results") || "No results found.";
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const s = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(s) ||
      (opt.searchTerms && opt.searchTerms.toLowerCase().includes(s))
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full space-y-2", className)} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 items-center justify-between rounded-2xl border border-border/50 bg-muted/20 px-6 py-4 transition-all cursor-pointer group hover:bg-muted/30",
          open && "ring-2 ring-primary/20 bg-background border-primary/50"
        )}
      >
        <span className={cn(
          "text-sm font-black uppercase tracking-widest truncate", 
          !selectedOption && "opacity-30 font-bold"
        )}>
          {selectedOption ? selectedOption.label : (placeholder || defaultPlaceholder)}
        </span>
        <ChevronDown 
          className={cn("text-muted-foreground transition-transform duration-300", open && "rotate-180 text-primary")} 
          size={18} 
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-0 right-0 z-50 mt-2 max-h-[350px] flex flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-card/80 shadow-2xl backdrop-blur-2xl"
          >
            {/* Search Input Area */}
            <div className="relative border-b border-border/10 p-4">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={16} />
              <input
                className="w-full bg-primary/5 rounded-xl h-10 pl-12 pr-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:opacity-30"
                placeholder={searchPlaceholder || defaultSearchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* List of Options */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:bg-primary/10 group",
                      value === opt.value ? "bg-primary/5 text-primary" : "text-foreground/80"
                    )}
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      {opt.label}
                    </span>
                    {value === opt.value && (
                      <Check className="text-primary" size={14} strokeWidth={3} />
                    )}
                  </button>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-20 italic">
                    {emptyMessage || defaultEmptyMessage}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
