"use client";

import { useState } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";

type AnyObj = Record<string, unknown>;

function Section({ title, emoji, data }: { title: string; emoji: string; data: AnyObj | null }) {
  const [open, setOpen] = useState(true);
  if (!data) return (
    <div className="border rounded-lg p-4 bg-destructive/10 text-destructive text-sm">
      {emoji} <strong>{title}:</strong> No data found — try seeding first.
    </div>
  );
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <span className="font-semibold">{emoji} {title}</span>
        <span className="text-muted-foreground text-xs">{open ? "▲ collapse" : "▼ expand"}</span>
      </button>
      {open && (
        <pre className="p-4 text-xs overflow-auto max-h-72 bg-background text-foreground leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function DBExplorer() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnyObj | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const res = await axios.post(`${API}/db-test/seed`);
      setStatus(res.data.message ?? "Seeded successfully!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error ?? e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/db-test/relationships`);
      setData(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error ?? e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 p-6 border rounded-2xl bg-card shadow-md max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🗄️ Database Relationship Explorer</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Test Phase 3 schema: seed sample data then inspect all table relationships.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleSeed}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "⏳ Working..." : "🌱 1. Seed Test Data"}
        </button>
        <button
          onClick={handleLoad}
          disabled={loading}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "⏳ Working..." : "🔍 2. Load Relationships"}
        </button>
      </div>

      {/* Status */}
      {status && <div className="text-sm p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">✅ {status}</div>}
      {error && <div className="text-sm p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">❌ {error}</div>}

      {/* Results */}
      {data && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Relationship Map</h3>

          <Section emoji="👤" title="Customer (with Role, Profile, Addresses)" data={(data.users as AnyObj)?.customer as AnyObj} />
          <Section emoji="🏪" title="Seller (with Role, Profile)" data={(data.users as AnyObj)?.seller as AnyObj} />
          <Section emoji="📱" title="Product (with Seller, Category→Parent, Media, Attributes, Reviews)" data={data.product as AnyObj} />
          <Section emoji="📦" title="Order (with Customer, Seller, Items, Shipping Address)" data={data.order as AnyObj} />
          <Section emoji="💬" title="Chat Conversation (with User1, User2, Messages)" data={data.chat_conversation as AnyObj} />
          <Section emoji="🔔" title="Notifications (latest 3)" data={{ items: data.notifications }} />
          <Section emoji="💰" title="Seller Finance (with Order)" data={data.seller_finance as AnyObj} />
          <Section emoji="🚨" title="Moderation Report (with Reporter, Reported Product)" data={data.moderation_report as AnyObj} />
        </div>
      )}
    </div>
  );
}
