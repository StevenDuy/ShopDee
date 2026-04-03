"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Terminal, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const REQUIRED_VARS = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
];

export function ConfigAlert() {
  const { t } = useTranslation();
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const missing: string[] = [];
    
    if (!process.env.NEXT_PUBLIC_API_URL) {
      missing.push("NEXT_PUBLIC_API_URL");
    }
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      missing.push("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
    }

    setMissingVars(missing);
  }, []);

  const copyToClipboard = () => {
    const text = missingVars.map(v => `${v}=your_value_here`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (missingVars.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 animate-in slide-in-from-right duration-500">
      <div className="bg-background/80 backdrop-blur-xl border border-primary/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20">
            <ShieldAlert size={24} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{t("errors.config_incomplete")}</h2>
            <p className="text-muted-foreground text-sm font-medium">{t("errors.config_missing_vars", { file: ".env.local" })}</p>
          </div>
          
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
             <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-left mb-2">{t("errors.missing_vars_label")}</p>
             <div className="space-y-1.5">
                {missingVars.map(v => (
                  <div key={v} className="flex items-center gap-2 text-[10px] font-mono opacity-70">
                    <Terminal size={10} />
                    <span>{v}</span>
                  </div>
                ))}
             </div>
          </div>

          <button 
            onClick={copyToClipboard}
            className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-primary/10"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "COPIED" : "COPY ENV TEMPLATE"}
          </button>
        </div>
      </div>
    </div>
  );
}
