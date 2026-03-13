"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function AdminMessagesPage() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Admin Inbox</h1>
        <p className="text-sm text-muted-foreground">Monitor platform communications and system notifications.</p>
      </div>
      <div className="flex-1 min-h-[600px] border border-border rounded-3xl overflow-hidden bg-card shadow-2xl">
        <UnifiedInbox />
      </div>
    </div>
  );
}
