"use client";

import { AlertTriangle, ExternalLink, XCircle } from "lucide-react";

export function ConfigAlert() {
  const missingConfigs = [];
  
  if (!process.env.NEXT_PUBLIC_API_URL) missingConfigs.push("NEXT_PUBLIC_API_URL (Backend API)");
  if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) missingConfigs.push("NEXT_PUBLIC_PUSHER_APP_KEY (Chat Realtime)");
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingConfigs.push("NEXT_PUBLIC_FIREBASE_API_KEY (AI - Analytics)");

  if (missingConfigs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-card border-2 border-primary rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <AlertTriangle size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Cấu hình chưa hoàn tất</h2>
            <p className="text-muted-foreground text-sm font-medium">Hệ thống phát hiện bạn chưa cấu hình đầy đủ các Key API quan trọng trong file <code className="bg-muted px-1 rounded">.env.local</code></p>
          </div>

          <div className="w-full bg-muted/50 rounded-2xl p-4 border border-border space-y-3">
             <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-left">Các biến còn thiếu:</p>
             <ul className="space-y-2">
                {missingConfigs.map(config => (
                  <li key={config} className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <XCircle size={14} className="text-red-500" />
                    {config}
                  </li>
                ))}
             </ul>
          </div>

          <a 
            href="https://github.com/StevenDuy/ShopDee/blob/main/README.md" 
            target="_blank" 
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
          >
            Xem hướng dẫn lấy Key <ExternalLink size={16} />
          </a>
          
          <p className="text-[10px] text-muted-foreground italic font-medium mt-4">
             Vui lòng cấu hình xong và khởi động lại server (`npm run dev`)
          </p>
        </div>
      </div>
    </div>
  );
}
