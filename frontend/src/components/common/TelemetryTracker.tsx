"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function TelemetryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());
  const clickStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const now = Date.now();
    const navTime = now - lastTimestampRef.current;

    // Don't log first load as navigation transition yet, but record start
    if (lastPathRef.current && lastPathRef.current !== currentPath) {
      sendTelemetry({
        type: "navigate",
        path: currentPath,
        prev_path: lastPathRef.current,
        nav_time_ms: navTime,
        duration_ms: navTime, // Approximate stay duration on previous page
      });
    }

    lastPathRef.current = currentPath;
    lastTimestampRef.current = now;
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleGlobalClick = () => {
      const now = Date.now();
      const clickSpeed = now - clickStartRef.current;
      clickStartRef.current = now;

      // Only log if it's a suspicious rapid click (e.g. < 200ms) or periodically
      if (clickSpeed < 300) {
        sendTelemetry({
          type: "interaction",
          click_speed_ms: clickSpeed,
          path: pathname,
        });
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [pathname]);

  const sendTelemetry = async (data: any) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return;

      const user = useAuthStore.getState().user;

      // Get location if possible (optional)
      let location = { lat: null, lng: null };
      
      // We could use navigator.geolocation here, but it triggers a prompt.
      // For now, we'll rely on the simulator providing coordinates or backend IP geo.

      await axios.post(`${API_URL}/ai/logs`, {
        ...data,
        ...location,
        user_id: user?.id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Silent fail for telemetry
    }
  };

  return null;
}
