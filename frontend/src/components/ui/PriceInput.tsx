"use client";

import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({ 
  value, 
  onChange, 
  label = "Giá sản phẩm", 
  placeholder = "0" 
}) => {
  const appendZeros = (count: number) => {
    const zeros = "0".repeat(count);
    onChange(value + zeros);
  };

  return (
    <div className="space-y-2 w-full">
      {label && <label className="text-sm font-semibold ml-1">{label}</label>}
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-5 py-4 rounded-[var(--radius)] border border-input bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition text-lg font-medium"
        />
        
        <div className="flex space-x-2 mt-3">
          <button
            type="button"
            onClick={() => appendZeros(3)}
            className="flex-1 py-2 px-3 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold active:scale-95 smooth-transition border border-border/50 flex items-center justify-center space-x-1"
          >
            <PlusCircle size={14} />
            <span>+000 (Nghìn)</span>
          </button>
          <button
            type="button"
            onClick={() => appendZeros(6)}
            className="flex-1 py-2 px-3 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold active:scale-95 smooth-transition border border-border/50 flex items-center justify-center space-x-1"
          >
            <PlusCircle size={14} />
            <span>+000.000 (Triệu)</span>
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground ml-1 italic">
        * Gợi ý: Dùng nút nhấn nhanh để thêm số 0 chuẩn xác.
      </p>
    </div>
  );
};
