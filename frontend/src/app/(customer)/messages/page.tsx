"use client";

import { UnifiedInbox } from "@/components/communication/UnifiedInbox";

export default function MessagesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Inbox</h1>
        <p className="text-muted-foreground">Manage your conversations and alerts in one place.</p>
      </div>
      <div className="rounded-3xl border border-border overflow-hidden shadow-2xl bg-card">
        <UnifiedInbox />
      </div>
    </div>
  );
}
