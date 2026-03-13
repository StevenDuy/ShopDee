"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function SellerInboxPage() {
  return (
    <div className="h-full w-full overflow-hidden p-0 md:p-6 bg-muted/20">
      <div className="h-[calc(100vh-48px)] w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50">
        <UnifiedInbox />
      </div>
    </div>
  );
}
