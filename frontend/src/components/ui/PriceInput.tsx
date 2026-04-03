"use client";

import React, { useState } from "react";
import { LucideIcon, PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PriceInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: LucideIcon;
  placeholder?: string;
  required?: boolean;
}

export default function PriceInput({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  placeholder, 
  required = false 
}: PriceInputProps) {
  const { t } = useTranslation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    onChange(val ? parseInt(val) : 0);
  };

  const appendZeros = (count: number) => {
    const factor = Math.pow(10, count);
    onChange(value * factor);
  };

  return (
    <div className="space-y-2 w-full">
      {label && <label className="text-sm font-semibold ml-1">{label}</label>}
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-5 py-4 rounded-[var(--radius)] border border-input bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition text-lg font-medium"
        />
        
        <div className="flex space-x-2 mt-3">
          <button
            type="button"
            onClick={() => appendZeros(3)}
            className="flex-1 h-9 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-primary/10"
          >
            <span>+000 ({t("common.thousand_short")})</span>
          </button>
          <button
            type="button"
            onClick={() => appendZeros(6)}
            className="flex-1 h-9 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-primary/10"
          >
            <span>+000.000 ({t("common.million_short")})</span>
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground ml-1 italic">
        * {t("seller.products_manage.price_hint") || "Gợi ý: Dùng nút nhấn nhanh để thêm số 0 chuẩn xác."}
      </p>
    </div>
  );
};
