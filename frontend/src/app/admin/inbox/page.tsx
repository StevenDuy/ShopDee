"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function AdminInboxPage() {
  return (
    /* AdminLayout already has p-6, so we don't add more p-6 here. 
       We just make it full height and apply the card style. */
    <div className="h-[calc(100vh-48px)] w-full overflow-hidden rounded-none md:rounded-[48px] shadow-2xl relative z-10 border border-border/50">
      <UnifiedInbox />
    </div>
  );
}
