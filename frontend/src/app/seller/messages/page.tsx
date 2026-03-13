"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function SellerMessagesPage() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Seller Communications</h1>
        <p className="text-sm text-muted-foreground">Keep in touch with your customers and stay updated with system alerts.</p>
      </div>
      <div className="flex-1 min-h-[600px] border border-border rounded-3xl overflow-hidden bg-card shadow-xl">
        <UnifiedInbox />
      </div>
    </div>
  );
}
