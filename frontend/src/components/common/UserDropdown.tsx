"use client";

import { useState, useRef, useEffect } from "react";
import { 
  User, LogOut, ChevronUp, ChevronDown, 
  Globe, DollarSign, LogIn, Moon, Sun
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface UserDropdownProps {
  collapsed?: boolean;
  align?: "top" | "bottom";
}

export function UserDropdown({ collapsed = false, align = "bottom" }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

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
        className="w-full flex items-center gap-3 p-2 bg-primary text-primary-foreground border border-primary font-bold"
      >
        <LogIn size={16} />
        {!collapsed && <span>{t("login")}</span>}
      </button>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi");
  const toggleCurrency = () => setCurrency(currency === "VND" ? "USD" : "VND");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-2 border ${
          isOpen ? 'border-primary bg-muted' : 'border-transparent'
        }`}
      >
        <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        
        {!collapsed && (
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-bold truncate text-foreground leading-none mb-1">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-bold opacity-60">
              {t(`roles.${user.role?.slug || 'customer'}`)}
            </p>
          </div>
        )}
        
        {!collapsed && (
          <div className="text-muted-foreground shrink-0">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{ 
            [align === "bottom" ? "top" : "bottom"]: "calc(100% + 4px)",
            left: "0",
            width: "200px"
          }}
          className="absolute z-[100] bg-card border border-border p-1"
        >
          <div className="space-y-1">
             <button 
              onClick={() => { 
                const path = (user.role?.slug === 'admin' || user.role_id === 1) ? "/admin/profile" : "/profile";
                router.push(path); 
                setIsOpen(false); 
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-muted border border-transparent hover:border-border"
            >
              <User size={14} />
              <span>{t("profile")}</span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === "dark" ? t("theme_light") || "Sáng" : t("theme_dark") || "Tối"}</span>
              </div>
              <span className="text-[10px] font-bold border border-border px-1">
                {theme === "dark" ? t("theme_light") || "LIGHT" : t("theme_dark") || "DARK"}
              </span>
            </button>

            <button 
              onClick={toggleLang}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-3">
                <Globe size={14} />
                <span>{t("language")}</span>
              </div>
              <span className="text-[10px] font-bold border border-border px-1">
                {i18n.language === "vi" ? t("language_vi") || "VIE" : t("language_en") || "ENG"}
              </span>
            </button>

            <button 
              onClick={toggleCurrency}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-3">
                <DollarSign size={14} />
                <span>{t("currency")}</span>
              </div>
              <span className="text-[10px] font-bold border border-border px-1">
                {currency}
              </span>
            </button>

            <div className="h-px bg-border my-1" />

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-destructive hover:bg-destructive hover:text-white border border-transparent hover:border-destructive"
            >
              <LogOut size={14} />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
