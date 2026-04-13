"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Brain, Zap, ShieldAlert, TrendingUp, MousePointerClick,
  Clock, Globe, Lock, ShoppingCart, UserX, AlertTriangle,
  CheckCircle2, BarChart3, Dna, Terminal, Play, History,
  Info, ShieldCheck, Cpu, ArrowRight, Activity, ChevronRight,
  Shield, Network, Scan, Fingerprint, Layers, X, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Types ---
interface ModelMetric {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  train_time_sec?: number;
  [key: string]: any;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  ban_reason?: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface FlaggedLog {
  id: number;
  user_id: number;
  user?: User;
  type: string;
  payload: any;
  created_at: string;
}

enum ScenarioType {
  BOT_CLICK = "bot_click",
  LOGIN_FAIL = "login_fail",
  LOCATION_CHANGE = "location_change",
  ABNORMAL_PURCHASE = "abnormal_purchase",
}

interface SimulationParams {
  scenario: ScenarioType;
  user_id: number | null;
  product_id?: number | null;
  lat?: number;
  lng?: number;
  // BOT_CLICK
  click_speed_ms?: number;
  click_count?: number;
  // LOGIN_FAIL
  wrong_password_attempts?: number;
  // LOCATION_CHANGE
  location_changes?: number;
  interval_ms?: number;
  // PURCHASES
  purchase_quantity?: number;
  purchase_value?: number;
  // Others
  duration_ms?: number;
  distance_jump?: number;
  address_changes?: number;
  auto_block?: boolean;
  is_fraud?: boolean;
  type?: string;
}

export default function AdminAISecurityPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();

  // UI State
  const [activeTab, setActiveTab] = useState<"dashboard" | "simulator" | "monitor">("dashboard");
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(false);
  const [monitorView, setMonitorView] = useState<"flagged" | "blocked">("flagged");

  // Data State
  const [metrics, setMetrics] = useState<{
    rf: ModelMetric;
    svm: ModelMetric;
    feature_importance: FeatureImportance[];
    dataset_stats: {
      total_samples: number;
      normal: number;
      anomaly: number;
      anomaly_ratio: number;
    }
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [totalFlaggedUsers, setTotalFlaggedUsers] = useState(0);
  const [dailyStats, setDailyStats] = useState<any[]>([]);


  // Simulator State
  const [activeScenario, setActiveScenario] = useState<ScenarioType | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simParams, setSimParams] = useState<SimulationParams>({
    scenario: ScenarioType.BOT_CLICK,
    user_id: null,
    product_id: null,
    click_speed_ms: 100,
    click_count: 15,
    wrong_password_attempts: 5,
    location_changes: 4,
    interval_ms: 800,
    purchase_quantity: 5,
    purchase_value: 100000,
    auto_block: false,
    is_fraud: true,
  });

  // Monitor State
  const [selectedUserLog, setSelectedUserLog] = useState<FlaggedLog | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<{ logs: any[] } | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  // Setup authorization
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  // Load initial data
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, usersRes, productsRes, monitorRes] = await Promise.all([
        axios.get(`${API_URL}/ai/metrics`).catch(() => ({ data: null })),
        axios.get(`${API_URL}/ai/users`),
        axios.get(`${API_URL}/ai/products`),
        axios.get(`${API_URL}/ai/monitor`),
      ]);

      // Parse metrics
      if (metricsRes.data) {
        const models = metricsRes.data.models || {};
        const stats = metricsRes.data.dataset_stats || {};

        setMetrics({
          rf: models.random_forest || {},
          svm: models.svm || {},
          feature_importance: metricsRes.data.feature_importance || [],
          dataset_stats: {
            total_samples: stats.total || 0,
            normal: (stats.total || 0) - (stats.anomalies || 0),
            anomaly: stats.anomalies || 0,
            anomaly_ratio: stats.ratio || 0
          }
        });
      }

      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);

      if (monitorRes.data) {
        setFlaggedUsers(monitorRes.data.flagged_users || []);
        setBlockedUsers(monitorRes.data.blocked_users || []);
        setTotalFlaggedUsers(monitorRes.data.total_flagged_users || 0);
        setDailyStats(monitorRes.data.daily_stats || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard", error);
      toast.error("Failed to load AI metrics");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Load filtered users
  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token, loadDashboard]);

  // Train AI Model
  const handleTrain = async () => {
    setTraining(true);
    try {
      const response = await axios.post(`${API_URL}/ai/train`);
      toast.success(response.data.message || "Training started!");
      // Reload metrics after training
      setTimeout(() => loadDashboard(), 3000);
    } catch (error: any) {
      console.error("Training failed", error);
      toast.error(error.response?.data?.message || "Training failed - AI service unavailable");
    } finally {
      setTraining(false);
    }
  };

  // Retrain AI Model
  const handleRetrain = async () => {
    setTraining(true);
    try {
      const response = await axios.post(`${API_URL}/ai/retrain`);
      toast.success(response.data.message || "Retraining started!");
      setTimeout(() => loadDashboard(), 3000);
    } catch (error: any) {
      console.error("Retrain failed", error);
      toast.error(error.response?.data?.message || "Retraining failed");
    } finally {
      setTraining(false);
    }
  };

  // Run Simulation
  const handleRunSimulation = async () => {
    if (!simParams.user_id) {
      toast.error("Chọn user để giả lập");
      return;
    }

    setSimulating(true);
    setSimResult(null);

    try {
      const payload: any = {
        ...simParams,
        user_id: simParams.user_id,
        scenario: activeScenario || ScenarioType.BOT_CLICK,
        type: getTypeForScenario(activeScenario || ScenarioType.BOT_CLICK),
        lat: simParams.lat || 10.762622,
        lng: simParams.lng || 106.660172,
      };

      const response = await axios.post(`${API_URL}/ai/simulate`, payload);

      if (response.data?.results?.length > 0) {
        const result = response.data.results[0];
        setSimResult(result);

        if (result.prediction) {
          const rfRisk = (result.prediction.details?.random_forest || 0) / 100;
          const svmRisk = (result.prediction.details?.svm || 0) / 100;

          if (rfRisk > 0.85 || svmRisk > 0.85) {
            toast.error("⚠️ AI Detected High Risk Activity!");
          } else if (rfRisk > 0.70 || svmRisk > 0.70) {
            toast.warning("🔔 AI Flagged Suspicious Activity");
          } else {
            toast.success("✓ Simulation normal - Telemetry saved");
          }
        }

        // Refresh monitor data
        setTimeout(() => loadDashboard(), 1000);
      }
    } catch (error: any) {
      console.error("Simulation failed", error);
      toast.error(error.response?.data?.message || "Giả lập thất bại - kiểm tra lại tham số");
    } finally {
      setSimulating(false);
    }
  };

  // Block User
  const handleBlockUser = async (userId: number, reason: string = "AI detected fraud") => {
    try {
      await axios.post(`${API_URL}/ai/users/${userId}/block`, { reason });
      toast.success("User đã bị chặn");
      loadDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  };

  // Unblock User
  const handleUnblockUser = async (userId: number) => {
    try {
      await axios.post(`${API_URL}/ai/users/${userId}/unblock`);
      toast.success("User has been unblocked");
      loadDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  };


  // Clear All Logs
  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all AI activity logs?")) return;

    try {
      await axios.delete(`${API_URL}/ai/logs`);
      toast.success("All activity logs cleared successfully");
      loadDashboard();
    } catch (error: any) {
      toast.error("Failed to clear logs");
    }
  };

  const handleClearUserLogs = async (userId: number) => {
    try {
      await axios.delete(`${API_URL}/ai/logs`, { data: { user_id: userId } });
      toast.success("User logs cleared successfully");
      setSelectedUserLog(null);
      loadDashboard();
    } catch (error: any) {
      toast.error("Failed to clear user logs");
    }
  };

  // View User Logs
  const handleViewUserLogs = async (userId: number) => {
    setLoadingLogs(true);
    try {
      const response = await axios.get(`${API_URL}/ai/users/${userId}/logs`);
      setSelectedUserDetails({ logs: response.data });
    } catch (error: any) {
      toast.error("Failed to load user logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const getTypeForScenario = (scenario: ScenarioType): string => {
    const typeMap: Record<ScenarioType, string> = {
      [ScenarioType.BOT_CLICK]: "view_product",
      [ScenarioType.LOGIN_FAIL]: "login",
      [ScenarioType.LOCATION_CHANGE]: "login",
      [ScenarioType.ABNORMAL_PURCHASE]: "checkout",
    };
    return typeMap[scenario] || "view_product";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
            <Brain size={48} className="text-primary mx-auto" />
          </motion.div>
          <p className="text-muted-foreground">Loading AI Service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/50 pb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Brain size={22} />
              </div>
              <Badge variant="outline" className="font-black text-[9px]">AI FRAUD DETECTION</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">AI Security Monitor</h1>
            <p className="text-muted-foreground text-sm mt-2">Random Forest vs SVM Behavioral Analysis</p>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-2 bg-muted/20 p-2 rounded-2xl border border-border/50">
            {["dashboard", "simulator", "monitor"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-black uppercase transition-all",
                  activeTab === tab
                    ? "bg-primary text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TRAIN BUTTON */}
          <Button
            onClick={metrics ? handleRetrain : handleTrain}
            disabled={training}
            className="ml-auto h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-black"
          >
            {training ? "TRAINING..." : metrics ? "RETRAIN" : "TRAIN"}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              {!metrics ? (
                <Card className="bg-yellow-500/10 border border-yellow-500/30 rounded-3xl p-12">
                  <div className="flex gap-4 items-start">
                    <AlertTriangle className="text-yellow-600 shrink-0 mt-1" size={24} />
                    <div>
                      <h3 className="font-black text-lg mb-2">Model Not Trained</h3>
                      <p className="text-muted-foreground mb-6">Click TRAIN button above to train the AI models before running simulations</p>
                      <Button onClick={handleTrain} disabled={training} className="bg-yellow-600 text-white hover:bg-yellow-700">
                        {training ? "Training..." : "Train Now"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-8">
                  {/* DATASET STATS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Samples", value: metrics.dataset_stats.total_samples, icon: Layers },
                      { label: "Normal Behavior", value: metrics.dataset_stats.normal, icon: ShieldCheck, color: "text-emerald-500" },
                      { label: "Anomalies", value: metrics.dataset_stats.anomaly, icon: ShieldAlert, color: "text-red-500" },
                      { label: "Fraud Ratio", value: `${(metrics.dataset_stats.anomaly_ratio * 100).toFixed(1)}%`, icon: TrendingUp },
                    ].map((stat, i) => (
                      <Card key={i} className="p-6 rounded-2xl bg-card/50 border-border/50">
                        <div className="flex justify-between items-center mb-2">
                          <stat.icon size={18} className={stat.color || "text-muted-foreground"} />
                          <span className="text-[10px] font-black uppercase text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-black">{stat.value}</p>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Random Forest */}
                    <Card className="rounded-3xl p-8 bg-card/50 border-border/50">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-primary font-black text-lg uppercase">Random Forest</p>
                          <p className="text-muted-foreground text-sm">Real-time risk scoring engine</p>
                        </div>
                        <Activity className="text-primary opacity-40" size={28} />
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-bold">Accuracy</span>
                            <span className="font-black text-primary">{(metrics.rf.accuracy * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.rf.accuracy * 100}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-primary"
                            />
                          </div>
                        </div>

                        {["precision", "recall", "f1"].map((key) => (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-bold capitalize">{key}</span>
                              <span className="font-bold">{(metrics.rf[key] * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/60" style={{ width: `${metrics.rf[key] * 100}%` }} />
                            </div>
                          </div>
                        ))}

                        <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                          <span>Train Time:</span>
                          <span className="font-mono">{metrics.rf.train_time_sec?.toFixed(3)}s</span>
                        </div>
                      </div>
                    </Card>

                    {/* SVM */}
                    <Card className="rounded-3xl p-8 bg-card/50 border-border/50">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-indigo-500 font-black text-lg uppercase">SVM (RBF)</p>
                          <p className="text-muted-foreground text-sm">Analyze behavior</p>
                        </div>
                        <Network className="text-indigo-400 opacity-40" size={28} />
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-bold">Accuracy</span>
                            <span className="font-black text-indigo-500">{(metrics.svm.accuracy * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.svm.accuracy * 100}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-indigo-500"
                            />
                          </div>
                        </div>

                        {["precision", "recall", "f1"].map((key) => (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-bold capitalize">{key}</span>
                              <span className="font-bold">{(metrics.svm[key] * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500/60" style={{ width: `${metrics.svm[key] * 100}%` }} />
                            </div>
                          </div>
                        ))}

                        <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                          <span>Train Time:</span>
                          <span className="font-mono">{metrics.svm.train_time_sec?.toFixed(3)}s</span>
                        </div>
                      </div>
                    </Card>

                    {/* FEATURE IMPORTANCE */}
                    <Card className="rounded-3xl p-8 bg-card/50 border-border/50">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-emerald-500 font-black text-lg uppercase">Feature Importance</p>
                          <p className="text-muted-foreground text-sm">Which behavior matters most?</p>
                        </div>
                        <Cpu className="text-emerald-400 opacity-40" size={28} />
                      </div>

                      <div className="space-y-4">
                        {metrics.feature_importance.slice(0, 6).map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] font-black uppercase text-muted-foreground">{item.feature}</span>
                              <span className="text-xs font-mono">{(item.importance * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.importance * 100}%` }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SIMULATOR TAB */}
          {activeTab === "simulator" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* SCENARIO SELECTOR */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-black text-lg uppercase flex items-center gap-2">
                  <Terminal size={20} className="text-primary" /> Attack Types
                </h3>

                {[
                  { id: ScenarioType.BOT_CLICK, name: "Bot Click Attack", icon: Zap },
                  { id: ScenarioType.LOGIN_FAIL, name: "Brute Force Login", icon: Lock },
                  { id: ScenarioType.LOCATION_CHANGE, name: "Location Spoofing", icon: Globe },
                  { id: ScenarioType.ABNORMAL_PURCHASE, name: "Abnormal Purchase", icon: ShoppingCart },
                ].map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveScenario(id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border-2 transition-all flex gap-3",
                      activeScenario === id
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border/50 hover:border-primary/50"
                    )}
                  >
                    <Icon size={20} className={activeScenario === id ? "text-primary" : "text-muted-foreground"} />
                    <div>
                      <p className="font-black text-sm">{name}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* PARAMETERS */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-3xl p-8 bg-card/50 border-border/50">
                  <h3 className="font-black text-lg mb-6 uppercase">Simulation Parameters</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Selection */}
                    <div>
                      <label className="block text-sm font-black mb-2">Select User</label>
                      <select
                        value={simParams.user_id || ""}
                        onChange={(e) => setSimParams({ ...simParams, user_id: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                      >
                        <option value="">Choose User...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Product Selection (for purchase scenarios) */}
                    {activeScenario === ScenarioType.ABNORMAL_PURCHASE && (
                      <div>
                        <label className="block text-sm font-black mb-2">Select Product</label>
                        <select
                          value={simParams.product_id || ""}
                          onChange={(e) => setSimParams({ ...simParams, product_id: Number(e.target.value) })}
                          className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                        >
                          <option value="">Choose Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₫{p.price.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Scenario-Specific Parameters */}
                    {activeScenario === ScenarioType.BOT_CLICK && (
                      <>
                        <div>
                          <label className="block text-sm font-black mb-2">Click Speed (ms)</label>
                          <input
                            type="number"
                            value={simParams.click_speed_ms}
                            onChange={(e) => setSimParams({ ...simParams, click_speed_ms: Number(e.target.value) })}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-black mb-2">Click Count</label>
                          <input
                            type="number"
                            value={simParams.click_count}
                            onChange={(e) => setSimParams({ ...simParams, click_count: Number(e.target.value) })}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                          />
                        </div>
                      </>
                    )}

                    {activeScenario === ScenarioType.LOGIN_FAIL && (
                      <div>
                        <label className="block text-sm font-black mb-2">Failed Attempts</label>
                        <input
                          type="number"
                          value={simParams.wrong_password_attempts}
                          onChange={(e) => setSimParams({ ...simParams, wrong_password_attempts: Number(e.target.value) })}
                          className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                        />
                      </div>
                    )}

                    {activeScenario === ScenarioType.LOCATION_CHANGE && (
                      <>
                        <div>
                          <label className="block text-sm font-black mb-2">Location Changes</label>
                          <input
                            type="number"
                            value={simParams.location_changes}
                            onChange={(e) => setSimParams({ ...simParams, location_changes: Number(e.target.value) })}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-black mb-2">Interval (ms)</label>
                          <input
                            type="number"
                            value={simParams.interval_ms}
                            onChange={(e) => setSimParams({ ...simParams, interval_ms: Number(e.target.value) })}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                          />
                        </div>
                      </>
                    )}

                    {activeScenario === ScenarioType.ABNORMAL_PURCHASE && (
                      <>
                        <div>
                          <label className="block text-sm font-black mb-2">Quantity</label>
                          <input
                            type="number"
                            value={simParams.purchase_quantity}
                            onChange={(e) => setSimParams({ ...simParams, purchase_quantity: Number(e.target.value) })}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-black mb-2">Purchase Value (₫)</label>
                          <input
                            type="number"
                            value={simParams.purchase_value}
                            onChange={(e) => setSimParams({ ...simParams, purchase_value: Number(e.target.value) })}
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 font-mono text-sm"
                          />
                        </div>
                      </>
                    )}

                    {/* GROUND TRUTH LABEL */}
                    <div className="md:col-span-2 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div>
                          <p className="font-black text-sm">Ground Truth Label</p>
                          <p className="text-xs text-muted-foreground">Bạn có coi hành vi này là gian lận không?</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSimParams({ ...simParams, is_fraud: false })}
                            className={cn(
                              "px-4 py-2 rounded-lg text-[10px] font-black transition-all",
                              !simParams.is_fraud ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                            )}
                          >
                            NORMAL
                          </button>
                          <button
                            onClick={() => setSimParams({ ...simParams, is_fraud: true })}
                            className={cn(
                              "px-4 py-2 rounded-lg text-[10px] font-black transition-all",
                              simParams.is_fraud ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                            )}
                          >
                            FRAUD
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execute Button */}
                  <Button
                    onClick={handleRunSimulation}
                    disabled={simulating || !simParams.user_id}
                    className="w-full mt-8 h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-black uppercase text-sm"
                  >
                    {simulating ? "Running..." : "Execute Simulation"}
                  </Button>
                </Card>

                {/* Results */}
                {simResult && (
                  <Card className="rounded-3xl p-8 bg-card/50 border-border/50">
                    <h3 className="font-black text-lg mb-6 uppercase">Prediction Results</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* RF Result */}
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <p className="text-primary font-black mb-4">Random Forest Analyzer</p>
                        {simResult.prediction?.details?.random_forest !== undefined && (
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm">Risk Score</span>
                                <span className="font-black">{simResult.prediction.details.random_forest.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${simResult.prediction.details.random_forest}%` }}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Model Confidence: <span className="font-black">HIGH</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* SVM Result */}
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
                        <p className="text-indigo-500 font-black mb-4">SVM Decision Boundary</p>
                        {simResult.prediction?.details?.svm !== undefined && (
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm">Risk Score</span>
                                <span className="font-black">{simResult.prediction.details.svm.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500"
                                  style={{ width: `${simResult.prediction.details.svm}%` }}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Model Confidence: <span className="font-black">STABLE</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {/* MONITOR TAB */}
          {activeTab === "monitor" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

              {/* Risk Trend Analytics */}
              <div className="bg-card/30 p-8 rounded-[2.5rem] border border-border/50 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                      <TrendingUp size={22} className="text-primary" /> Risk Trend Analytics
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Blocked attack attempts over the last 7 days.</p>
                  </div>
                  <Badge variant="outline" className="h-8 rounded-lg bg-primary/10 text-primary border-primary/20 font-black">
                    7-DAY ACTIVITY
                  </Badge>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666", fontSize: 10, fontWeight: "bold" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666", fontSize: 10, fontWeight: "bold" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "15px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                        }}
                        itemStyle={{ color: "var(--primary)", fontWeight: "900", textTransform: "uppercase", fontSize: "10px" }}
                        labelStyle={{ color: "#fff", marginBottom: "5px", fontWeight: "bold" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--primary)"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#riskGradient)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex justify-between items-center bg-card/50 p-6 rounded-3xl border border-border/50">
                <div>
                  <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                    <History size={28} className="text-primary" /> Flagged Users ({totalFlaggedUsers})
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage accounts with suspicious behavior flagged by AI.</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleClearLogs}
                    variant="outline"
                    className="h-11 rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10 font-black text-sm"
                  >
                    CLEAR ALL LOGS
                  </Button>
                </div>
              </div>

              <div className="flex justify-start mb-6">
                <div className="bg-card/30 p-1.5 rounded-xl border border-border/50 flex gap-1">
                  <Button
                    variant={monitorView === "flagged" ? "default" : "outline"}
                    size="sm"
                    className={cn("rounded-xl px-4 py-2 font-black text-sm", monitorView === "flagged" ? "bg-primary text-white" : "bg-card")}
                    onClick={() => setMonitorView("flagged")}
                  >
                    Flagged Users
                  </Button>
                  <Button
                    variant={monitorView === "blocked" ? "default" : "outline"}
                    size="sm"
                    className={cn("rounded-xl px-4 py-2 font-black text-sm", monitorView === "blocked" ? "bg-red-600 text-white" : "bg-card")}
                    onClick={() => setMonitorView("blocked")}
                  >
                    Blocked Users
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(monitorView === "flagged" ? flaggedUsers : blockedUsers).map((dataOrUser: any) => {
                  const user = monitorView === "flagged" ? dataOrUser.user : dataOrUser;
                  const userId = monitorView === "flagged" ? dataOrUser.user_id : dataOrUser.id;

                  return (
                    <Card key={`${monitorView}-${userId}`} className="rounded-2xl p-6 bg-card/50 border-border/50 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <Badge variant={user.status === "banned" ? "destructive" : "default"} className="font-black text-[10px] uppercase">
                          {user.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="font-black text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.ban_reason && (
                          <p className="text-xs text-red-500 font-bold mt-2 pt-2 border-t border-red-500/10">Reason: {user.ban_reason}</p>
                        )}
                      </div>

                      {monitorView === "flagged" && (
                        <div className="mt-6 space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/50">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-muted-foreground uppercase">LAST EVENT</span>
                            <Badge className="bg-primary/20 text-primary border-none">{dataOrUser.last_flagged_type}</Badge>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-muted-foreground uppercase">RISK SCORE</span>
                            <span className="font-black text-red-500">{dataOrUser.last_risk_score?.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-6">
                        <Button
                          onClick={() => {
                            setSelectedUserLog(monitorView === "flagged" ? dataOrUser : { user_id: userId, user } as any);
                            handleViewUserLogs(userId);
                          }}
                          className="flex-1 h-10 rounded-xl bg-primary text-white hover:bg-primary/90 font-black text-xs"
                        >
                          <Eye size={14} className="mr-2" /> DETAILS
                        </Button>
                        {user.status !== "banned" && (
                          <Button
                            onClick={() => handleBlockUser(userId, "AI detected high risk behavior")}
                            className="flex-1 h-10 rounded-xl bg-red-600 text-white hover:bg-red-700 font-black text-xs"
                          >
                            BLOCK
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* User Management Section */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Shield size={24} className="text-primary" />
                      <h3 className="text-xl font-black uppercase">User Management</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={monitorView === "flagged" ? "default" : "outline"}
                        size="sm"
                        className={cn("rounded-xl px-4 py-2 font-black text-sm", monitorView === "flagged" ? "bg-primary text-white" : "bg-card")}
                        onClick={() => setMonitorView("flagged")}
                      >
                        Flagged Users
                      </Button>
                      <Button
                        variant={monitorView === "blocked" ? "default" : "outline"}
                        size="sm"
                        className={cn("rounded-xl px-4 py-2 font-black text-sm", monitorView === "blocked" ? "bg-red-600 text-white" : "bg-card")}
                        onClick={() => setMonitorView("blocked")}
                      >
                        Blocked Users
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(monitorView === "flagged" ? flaggedUsers : blockedUsers).map((dataOrUser: any) => {
                      const user = monitorView === "flagged" ? dataOrUser.user : dataOrUser;
                      const userId = monitorView === "flagged" ? dataOrUser.user_id : dataOrUser.id;
                      
                      if (!user) return null;

                      return (
                        <Card key={`${monitorView}-mgmt-${userId}`} className="rounded-2xl p-6 bg-card/50 border-border/50 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <Badge variant={user.status === "banned" ? "destructive" : "default"} className="font-black text-[10px] uppercase">
                              {user.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="font-black text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.ban_reason && (
                              <p className="text-xs text-red-500 font-bold">Reason: {user.ban_reason}</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-6">
                            <Button
                              onClick={() => {
                                setSelectedUserLog(monitorView === "flagged" ? dataOrUser : { user_id: userId, user } as any);
                                handleViewUserLogs(userId);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl h-10 font-bold"
                            >
                              <Eye size={14} className="mr-2" /> DETAIL
                            </Button>
                            {user.status === "banned" ? (
                              <Button
                                onClick={() => handleUnblockUser(userId)}
                                className="flex-1 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black"
                              >
                                UNBLOCK
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleBlockUser(userId, "Manual block")}
                                className="flex-1 h-10 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-black"
                              >
                                BLOCK
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* User Logs Modal */}
              {selectedUserLog && selectedUserDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-background rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-auto p-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-2xl">User Logs - {selectedUserLog.user?.name}</h3>
                      <button onClick={() => { setSelectedUserLog(null); setSelectedUserDetails(null); }} className="p-2 hover:bg-muted rounded-lg">
                        <X size={20} />
                      </button>
                    </div>

                    {loadingLogs ? (
                      <div className="flex flex-col items-center py-20 gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                          <Cpu className="text-primary" />
                        </motion.div>
                        <p className="text-muted-foreground font-black text-sm animate-pulse">ANALYZING USER TELEMETRY...</p>
                      </div>
                    ) : !selectedUserDetails.logs?.length ? (
                      <p className="text-center py-20 text-muted-foreground">No logs found</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border/50">
                          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Behavior Timeline</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 font-black text-[10px]"
                            onClick={() => handleClearUserLogs(selectedUserLog.user_id)}
                          >
                            CLEAR USER HISTORY
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {selectedUserDetails.logs.map((log: any) => (
                            <div key={log.id} className="bg-muted/10 rounded-3xl p-6 border border-border/50 hover:bg-muted/20 transition-all">
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                    <Scan size={14} className="text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-black text-sm uppercase tracking-tight">{log.type}</p>
                                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                                  </div>
                                </div>
                                <Badge variant={log.is_anomaly ? "destructive" : "outline"} className="font-black text-[9px] uppercase">
                                  {log.is_anomaly ? "Anomalous" : "Normal"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {/* RF Ratio */}
                                <div className="bg-card/50 p-4 rounded-2xl border border-border/50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">RF Risk</span>
                                    <span className={cn("text-xs font-black", (log.payload?.ai_prediction?.details?.random_forest || 0) > 70 ? "text-red-500" : "text-emerald-500")}>
                                      {log.payload?.ai_prediction?.details?.random_forest?.toFixed(1) || 0}%
                                    </span>
                                  </div>
                                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${log.payload?.ai_prediction?.details?.random_forest || 0}%` }} />
                                  </div>
                                </div>

                                {/* SVM Ratio */}
                                <div className="bg-card/50 p-4 rounded-2xl border border-border/50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">SVM Risk</span>
                                    <span className={cn("text-xs font-black", (log.payload?.ai_prediction?.details?.svm || 0) > 70 ? "text-red-500" : "text-emerald-500")}>
                                      {log.payload?.ai_prediction?.details?.svm?.toFixed(1) || 0}%
                                    </span>
                                  </div>
                                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${log.payload?.ai_prediction?.details?.svm || 0}%` }} />
                                  </div>
                                </div>
                              </div>

                              {log.payload?.scenario && (
                                <div className="mt-4 pt-4 border-t border-border/20">
                                  <p className="text-[10px] text-muted-foreground">Scenario Context: <span className="text-foreground font-bold">{log.payload.scenario}</span></p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
