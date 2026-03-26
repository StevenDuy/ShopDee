"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TestPanel() {
  const [email, setEmail] = useState("customer@shopdee.com");
  const [password, setPassword] = useState("password");
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [broadcastInput, setBroadcastInput] = useState("Hello testing WebSockets!");

  useEffect(() => {
    // Listen to WebSocket events using global Echo
    if (typeof window !== "undefined" && window.Echo) {
      window.Echo.channel("test-channel").listen("HelloReverbEvent", (e: { message: string }) => {
        console.log("WebSocket Event Received:", e);
        setWsMessages((prev) => [...prev, e.message]);
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.Echo) {
        window.Echo.leaveChannel("test-channel");
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.post("` + API_BASE_URL + `/login", {
        email,
        password,
      });
      setUser(res.data.user);
      setToken(res.data.token);
      alert("Login successful!");
    } catch (err: any) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleBroadcast = async () => {
    try {
      await axios.post("` + API_BASE_URL + `/test-broadcast", {
        message: broadcastInput,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to send broadcast");
    }
  };

  return (
    <div className="mt-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Core Features Test Panel</h2>
        
        {/* Auth Section */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-semibold text-lg">1. Authentication Test</h3>
          {!user ? (
            <div className="flex flex-col gap-3">
              <Input 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Email"
              />
              <Input 
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <Button onClick={handleLogin}>Test Login</Button>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-md border text-sm">
              <p><strong>Logged in as:</strong> {user.name} ({user.email})</p>
              <p><strong>Role ID:</strong> {user.role_id}</p>
              <p className="truncate text-xs mt-2 text-muted-foreground">Token: {token}</p>
            </div>
          )}
        </div>

        {/* WebSocket Section */}
        <div className="space-y-4 pt-6">
          <h3 className="font-semibold text-lg">2. WebSocket (Reverb) Test</h3>
          <div className="flex gap-2">
            <Input 
              value={broadcastInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBroadcastInput(e.target.value)}
              placeholder="Message to broadcast"
            />
            <Button onClick={handleBroadcast} variant="secondary">Send Broadcast</Button>
          </div>
          
          <div className="p-4 bg-muted rounded-md border min-h-[100px] text-sm">
            <p className="font-medium mb-2">Received Messages (via Reverb):</p>
            {wsMessages.length === 0 ? (
              <p className="text-muted-foreground italic">No messages yet. Send a broadcast to test.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {wsMessages.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
