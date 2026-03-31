"use client";

import React, { useState, useEffect } from "react";
import { LocateFixed, ShieldCheck, AlertCircle } from "lucide-react";

export const PermissionModal: React.FC = () => {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Kiểm tra xem đã có quyền chưa
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state !== "granted") {
          setShow(true);
        }
      });
    }
  }, []);

  const requestPermission = () => {
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        setShow(false);
        // Lưu vào localStorage hoặc state nếu cần
        console.log("Location granted:", position.coords);
      },
      (err) => {
        setLoading(false);
        setError("Bạn cần cho phép truy cập vị trí để tiếp tục sử dụng ShopDee.");
        console.error("Location error:", err);
      },
      { enableHighAccuracy: true }
    );
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="premium-card max-w-md w-full flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <LocateFixed size={40} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Yêu cầu quyền truy cập</h2>
          <p className="text-muted-foreground">
            Để đảm bảo an toàn và tính năng nghiên cứu AI, ShopDee yêu cầu bạn cung cấp vị trí hiện tại.
          </p>
        </div>

        {error && (
          <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start space-x-3 text-destructive text-sm text-left">
            <AlertCircle className="shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={requestPermission}
          disabled={loading}
          className="premium-btn w-full flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>Cho phép & Tiếp tục</span>
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground">
          Dữ liệu của bạn được mã hóa và bảo mật theo tiêu chuẩn ShopDee Premium.
        </p>
      </div>
    </div>
  );
};
