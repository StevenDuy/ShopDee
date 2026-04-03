"use client";

import React from "react";
import { 
  ShieldCheck, Zap, ArrowRight, X, 
  MapPin, Bell, Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PermissionModal({ isOpen, onClose }: PermissionModalProps) {
  const { t } = useTranslation();

  const PERMISSIONS = [
    { 
      id: "location", 
      icon: MapPin, 
      label: t("permissions.location"), 
      desc: t("permissions.location_desc"), 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      id: "notification", 
      icon: Bell, 
      label: t("permissions.notification"), 
      desc: t("permissions.notification_desc"), 
      color: "text-orange-500", 
      bg: "bg-orange-500/10" 
    },
    { 
      id: "identity", 
      icon: Fingerprint, 
      label: t("permissions.identity"), 
      desc: t("permissions.identity_desc"), 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10" 
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/40 backdrop-blur-md" 
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-card/60 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {/* Close Hook */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
          >
            <X size={20} />
          </button>

          <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20 mb-6 animate-pulse">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{t("permissions.title")}</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-4 opacity-70">
              Security Compliance // Required Permissions
            </p>
          </div>

          <div className="p-8 space-y-4">
            {PERMISSIONS.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-center gap-5 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${p.bg} ${p.color}`}>
                    <p.icon size={22} strokeWidth={2.5} />
                 </div>
                 <div className="min-w-0">
                    <p className="font-black text-xs uppercase tracking-tight text-foreground">{p.label}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 mt-0.5 leading-relaxed truncate">{p.desc}</p>
                 </div>
              </motion.div>
            ))}
          </div>

          <div className="p-8 pt-0">
            <button 
              onClick={onClose}
              className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
            >
                <Zap size={20} className="fill-white" strokeWidth={3} />
                <span>{t("errors.allow_continue")}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            </button>
          </div>

          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <ShieldCheck size={120} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
