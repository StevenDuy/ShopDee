"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { 
  Activity, Shield, User as UserIcon, Wifi, WifiOff, 
  Terminal, Play, RefreshCw, AlertTriangle, CheckCircle 
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface LogEntry {
  time: string;
  type: "info" | "success" | "error" | "event";
  message: string;
}

export default function TestRealtimePage() {
  const { user, token, hasHydrated } = useAuthStore();
  const { unreadCount, hasUnreadMessages, fetchUnreadCounts } = useNotificationStore();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionState, setConnectionState] = useState<string>("disconnected");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const addLog = (message: string, type: "info" | "success" | "error" | "event" = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, type, message }, ...prev]);
  };

  useEffect(() => {
    setMounted(true);
    addLog("Real-time Diagnostic Dashboard mounted.", "info");
  }, []);

  // Monitor Echo Connection
  useEffect(() => {
    if (!mounted || !hasHydrated) return;

    addLog(`Current User: ${user ? `${user.name} (ID: ${user.id}, Role: ${user.role?.slug || 'unknown'})` : "Guest"}`, "info");
    addLog(`Auth Token: ${token ? "Present" : "Missing"}`, token ? "success" : "error");

    const echoInstance = typeof window !== 'undefined' ? window.Echo : null;
    if (!echoInstance) {
      addLog("window.Echo is not defined yet. Waiting...", "error");
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && window.Echo) {
          addLog("window.Echo detected! Initializing monitor...", "success");
          clearInterval(interval);
          setupEchoMonitor(window.Echo);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setupEchoMonitor(echoInstance);
    }

    function setupEchoMonitor(echo: any) {
      const pusher = echo.connector?.pusher;
      if (!pusher) {
        addLog("Pusher connector not found inside Echo.", "error");
        return;
      }

      setConnectionState(pusher.connection.state);
      addLog(`Pusher connection state: ${pusher.connection.state}`, "info");

      const handleStateChange = (states: any) => {
        setConnectionState(states.current);
        addLog(`Pusher connection state changed: ${states.previous} -> ${states.current}`, "info");
      };

      pusher.connection.bind("state_change", handleStateChange);

      // Check active subscriptions
      const userId = user?.id;
      if (token && userId) {
        const channelName = `private-App.Models.User.${userId}`;
        addLog(`Subscribing to user channel: ${channelName}...`, "info");
        
        try {
          const userChannel = echo.private(`App.Models.User.${userId}`);
          
          userChannel.subscribed(() => {
            setIsSubscribed(true);
            addLog(`Subscribed successfully to ${channelName}!`, "success");
          });

          userChannel.error((err: any) => {
            setIsSubscribed(false);
            addLog(`Subscription error on ${channelName}: ${JSON.stringify(err)}`, "error");
          });

          const handleUpdate = (e: any) => {
            addLog(`Received message.new event: ${JSON.stringify(e)}`, "event");
          };

          userChannel.listen('.message.new', handleUpdate);
          userChannel.listen('message.new', handleUpdate);

          userChannel.notification((notification: any) => {
            addLog(`Received notification: ${JSON.stringify(notification)}`, "event");
          });

          return () => {
            userChannel.stopListening('.message.new');
            userChannel.stopListening('message.new');
            pusher.connection.unbind("state_change", handleStateChange);
            addLog(`Cleaned up listeners for ${channelName}`, "info");
          };
        } catch (e: any) {
          addLog(`Failed to subscribe: ${e.message}`, "error");
        }
      }
    }
  }, [mounted, hasHydrated, user, token]);

  const triggerTestBroadcast = async () => {
    if (!token || !user) {
      addLog("Cannot trigger broadcast: Not logged in.", "error");
      return;
    }
    setIsSending(true);
    addLog("Sending request to backend to trigger real-time broadcast...", "info");

    try {
      // Find or create conversation
      const convRes = await axios.get(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const conversations = convRes.data || [];
      let convId = conversations[0]?.id;

      if (!convId) {
        addLog("No active conversation found to use for test. Starting conversation with user 3...", "info");
        const startRes = await axios.post(`${API}/chat/start`, { recipient_id: 3 }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        convId = startRes.data.id;
      }

      addLog(`Sending test message in conversation ID: ${convId}...`, "info");
      const sendRes = await axios.post(`${API}/chat/${convId}`, {
        message_text: `Diagnostic ping! ${new Date().toLocaleTimeString()}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      addLog(`Message created. ID: ${sendRes.data.message.id}. Event broadcasted!`, "success");
    } catch (e: any) {
      addLog(`Failed to trigger broadcast: ${e.response?.data?.message || e.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Real-time Diagnostics</h1>
              <p className="text-xs text-slate-400">WebSocket connection status & event monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex h-2.5 w-2.5 relative rounded-full ${
              connectionState === "connected" ? "bg-green-500" : "bg-amber-500 animate-ping"
            }`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectionState === "connected" ? "bg-green-400" : "bg-amber-400"
              }`} />
            </span>
            <span className="text-xs font-semibold capitalize text-slate-300">{connectionState}</span>
          </div>
        </div>

        {/* Status Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* User Info */}
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <UserIcon size={16} />
              <span>User Profile</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <p><strong className="text-slate-400">ID:</strong> {user?.id || "N/A"}</p>
              <p><strong className="text-slate-400">Name:</strong> {user?.name || "Guest"}</p>
              <p><strong className="text-slate-400">Role:</strong> <span className="uppercase text-[10px] font-bold border border-slate-700 px-1 rounded">{user?.role?.slug || "guest"}</span></p>
            </div>
          </div>

          {/* Connection Stats */}
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Shield size={16} />
              <span>Channel Status</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <p><strong className="text-slate-400">Channel:</strong> private-App.Models.User.{user?.id || "N/A"}</p>
              <p className="flex items-center gap-1.5">
                <strong className="text-slate-400">Subscribed:</strong> 
                {isSubscribed ? (
                  <span className="text-green-400 flex items-center gap-0.5"><CheckCircle size={12} /> Yes</span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-0.5"><AlertTriangle size={12} /> No</span>
                )}
              </p>
              <p><strong className="text-slate-400">Token:</strong> {token ? "Valid" : "None"}</p>
            </div>
          </div>

          {/* UI Badges */}
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Activity size={16} />
              <span>Store Badge State</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <p><strong className="text-slate-400">Unread total:</strong> {unreadCount}</p>
              <p><strong className="text-slate-400">Has unread message dot:</strong> {hasUnreadMessages ? "TRUE" : "FALSE"}</p>
              <button 
                onClick={() => token && fetchUnreadCounts(token)} 
                className="mt-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded flex items-center gap-1 border border-slate-700"
              >
                <RefreshCw size={10} /> Sync Unread Counts
              </button>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-300">Test Real-time Update Path</p>
            <p>Clicking trigger sends a message in your most recent conversation, which fires a WebSocket event back to you.</p>
          </div>
          <button
            onClick={triggerTestBroadcast}
            disabled={isSending || !token}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-indigo-500/50"
          >
            {isSending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Trigger Test Broadcast
          </button>
        </div>

        {/* Live Event Terminal */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Terminal size={16} />
            <span>Event Logging Terminal</span>
          </div>
          <div className="bg-black border border-slate-800 rounded-xl p-4 h-60 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 flex flex-col-reverse">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center py-10">No logs yet. Establish connection or trigger events.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={`font-bold ${
                    log.type === "success" ? "text-green-400" :
                    log.type === "error" ? "text-red-400" :
                    log.type === "event" ? "text-amber-400" : "text-blue-400"
                  }`}>
                    {log.type.toUpperCase()}:
                  </span>
                  <span className="flex-1 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
