"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Settings, LogOut, ChevronUp, ChevronDown, 
  Moon, Sun, Globe, DollarSign, LogIn, MessageCircle
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

interface UserDropdownProps {
  collapsed?: boolean;
  align?: "top" | "bottom"; // Hướng mở menu
}

export function UserDropdown({ collapsed = false, align = "bottom" }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState("VND");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="w-full flex items-center gap-3 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all border border-primary/20 group shadow-sm"
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          <LogIn size={14} />
        </div>
        {!collapsed && (
          <div className="flex-1 text-left">
            <p className="text-sm font-bold leading-none mb-1">Đăng nhập</p>
            <p className="text-[10px] opacity-70 uppercase font-black">Khách hàng</p>
          </div>
        )}
      </button>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi");
  const toggleCurrency = () => setCurrency(currency === "VND" ? "USD" : "VND");

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-accent/80 border ${
          isOpen ? 'border-primary/40 bg-accent shadow-sm' : 'border-transparent'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        
        {!collapsed && (
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-bold truncate text-foreground leading-none mb-1">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-bold opacity-60">
              {user.role?.name || 'User'}
            </p>
          </div>
        )}
        
        {!collapsed && (
          <div className="text-muted-foreground/50 shrink-0">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: align === "top" ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: align === "top" ? 10 : -10 }}
            style={{ 
              [align === "top" ? "top" : "bottom"]: "calc(100% + 8px)",
              left: collapsed ? "12px" : "0",
              width: "260px"
            }}
            className="absolute z-[100] bg-card border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-2 overflow-hidden"
          >
            {/* Header Mini Info */}
            <div className="px-3 py-2 mb-2 bg-muted/20 rounded-xl border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 opacity-60">Logged in as</p>
              <p className="text-xs font-semibold truncate text-foreground">{user.email}</p>
            </div>

            <div className="space-y-0.5">
              <button 
                onClick={() => { router.push("/profile"); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors group text-foreground"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <User size={14} />
                </div>
                <span className="font-medium">{t("my_profile") || "Trang cá nhân"}</span>
              </button>

              <button 
                onClick={() => { 
                  const path = user.role_id === 1 ? "/admin/inbox" : user.role_id === 2 ? "/seller/inbox" : "/inbox";
                  router.push(path); 
                  setIsOpen(false); 
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors group text-foreground"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <MessageCircle size={14} />
                </div>
                <span className="font-medium flex-1 text-left">Inbox</span>
              </button>

              <div className="h-px bg-border/50 my-1 mx-2" />

              {/* Theme Toggle Item */}
              <button 
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    theme === 'dark' ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white' : 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'
                  }`}>
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  </div>
                  <span className="font-medium">Chế độ nền</span>
                </div>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                  theme === 'dark' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'
                }`}>
                  {theme === "dark" ? "Sáng" : "Tối"}
                </span>
              </button>

              {/* Language Item */}
              <button 
                onClick={toggleLang}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Globe size={14} />
                  </div>
                  <span className="font-medium">Ngôn ngữ</span>
                </div>
                <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {i18n.language === "vi" ? "VIE" : "ENG"}
                </span>
              </button>

              {/* Currency Item */}
              <button 
                onClick={toggleCurrency}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <DollarSign size={14} />
                  </div>
                  <span className="font-medium">Tiền tệ</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">
                  {currency}
                </span>
              </button>

              <div className="h-px bg-border/50 my-1 mx-2" />

              {/* Logout */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors text-left group"
              >
                <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center group-hover:bg-destructive group-hover:text-white transition-colors">
                  <LogOut size={14} />
                </div>
                <span className="font-bold">{t("logout") || "Đăng xuất"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
