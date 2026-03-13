"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function CustomerInboxPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/20">
      <div className="flex-1 overflow-hidden p-0 md:p-6">
         <div className="h-full w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50">
           <UnifiedInbox />
         </div>
      </div>

      <style jsx global>{`
        /* Ẩn footer chỉ trên trang inbox của customer */
        footer {
          display: none !important;
        }
        /* Đảm bảo Main của CustomerLayout không có padding lạ */
        main {
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}
