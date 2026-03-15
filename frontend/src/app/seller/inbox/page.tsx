"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";
import { Suspense } from "react";

export default function SellerInboxPage() {
  return (
    <div className="h-full w-full overflow-hidden p-0 md:p-6 bg-muted/20">
      <div className="h-[calc(100vh-48px)] w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background h-full w-full"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <UnifiedInbox />
        </Suspense>
      </div>
    </div>
  );
}
