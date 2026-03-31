"use client";

import { useState, useEffect } from "react";
import { 
  Brain, Zap, ShieldAlert, TrendingUp, MousePointerClick, 
  Clock, Globe, Lock, ShoppingCart, UserX, AlertTriangle,
  CheckCircle2, BarChart3, Dna, Terminal, Play, History,
  Info, ShieldCheck, Cpu, ArrowRight, Activity, ChevronRight,
  Shield, Network, Scan, Fingerprint, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  trainTime: number;
  inferenceTime: number;
}

interface AttackScenario {
  id: string;
  name: string;
  description: string;
  icon: any;
  severity: "low" | "medium" | "high" | "critical";
  features: {
    time_to_checkout: number;
    failed_logins: number;
    ip_distance: number;
    pages_viewed: number;
    amount: number;
    device_changed: boolean;
    hour_of_day: number;
  };
}

// --- Data ---
const SCENARIOS: AttackScenario[] = [
  {
    id: "bot_auto",
    name: "Automated Bot (Speed)",
    description: "Tấn công bằng bot với tốc độ thanh toán siêu nhanh ngay sau khi vào trang.",
    icon: Zap,
    severity: "high",
    features: { time_to_checkout: 1.5, failed_logins: 0, ip_distance: 10, pages_viewed: 1, amount: 250000, device_changed: false, hour_of_day: 14 }
  },
  {
    id: "brute_force",
    name: "Credential Brute Force",
    description: "Tài khoản đăng nhập sai nhiều lần trước khi thành công (Dấu hiệu dò mật khẩu).",
    icon: Lock,
    severity: "critical",
    features: { time_to_checkout: 120, failed_logins: 15, ip_distance: 150, pages_viewed: 5, amount: 150000, device_changed: true, hour_of_day: 3 }
  },
  {
    id: "location_spoof",
    name: "Impossible Travel",
    description: "Đăng nhập từ vị trí địa lý cách xa hàng nghìn km chỉ trong thời gian ngắn.",
    icon: Globe,
    severity: "high",
    features: { time_to_checkout: 300, failed_logins: 0, ip_distance: 5400, pages_viewed: 12, amount: 900000, device_changed: true, hour_of_day: 10 }
  },
  {
    id: "whale_sniper",
    name: "High-Value Sniping",
    description: "Vào trang web và chạy ngay đến sản phẩm đắt nhất để mua mà không xem gì khác.",
    icon: TrendingUp,
    severity: "medium",
    features: { time_to_checkout: 15, failed_logins: 0, ip_distance: 5, pages_viewed: 2, amount: 45000000, device_changed: false, hour_of_day: 22 }
  },
  {
    id: "velocity_attack",
    name: "Velocity Spamming",
    description: "Gửi hàng loạt yêu cầu mua hàng giá trị thấp trong thời gian cực ngắn.",
    icon: MousePointerClick,
    severity: "medium",
    features: { time_to_checkout: 4, failed_logins: 0, ip_distance: 2, pages_viewed: 4, amount: 10000, device_changed: false, hour_of_day: 1 }
  },
  {
    id: "account_takeover",
    name: "Full Account Takeover",
    description: "Kết hợp thiết bị mới, IP lạ, đổi địa chỉ và mua món đồ đắt đỏ.",
    icon: UserX,
    severity: "critical",
    features: { time_to_checkout: 45, failed_logins: 1, ip_distance: 1200, pages_viewed: 3, amount: 12000000, device_changed: true, hour_of_day: 4 }
  }
];

export default function AISecurityPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "simulator" | "monitor">("dashboard");
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Mock Performance Data
  const metrics = {
    rf: { accuracy: 96.5, precision: 94.2, recall: 92.8, f1: 93.5, trainTime: 4.2, inferenceTime: 0.012 },
    svm: { accuracy: 92.1, precision: 89.5, recall: 88.2, f1: 88.8, trainTime: 12.8, inferenceTime: 0.085 }
  };

  const handleRunSimulation = (scenario: AttackScenario) => {
    setSelectedScenario(scenario);
    setSimResult(null);
    setSimulating(true);
    
    // Simulate ML Engine Processing
    setTimeout(() => {
      const rf_risk = scenario.severity === "critical" ? 0.98 : (scenario.severity === "high" ? 0.85 : 0.65);
      const svm_risk = rf_risk - 0.05 - (Math.random() * 0.1);
      
      setSimResult({
        rf: { risk: rf_risk, status: rf_risk > 0.8 ? "Fraud" : "Suspicious", time: "12ms" },
        svm: { risk: svm_risk, status: svm_risk > 0.8 ? "Fraud" : "Suspicious", time: "85ms" }
      });
      setSimulating(false);
      
      if (rf_risk > 0.9) {
        toast.error(t("admin.ai_security.auto_block") || "Hệ thống tự động: Đã tạm khóa tài khoản do rủi ro Critical!");
      } else {
        toast.warning(t("admin.ai_security.suspicious_warning") || "Cảnh báo: Phát hiện hành vi nghi vấn. Đã gửi yêu cầu xác thực 2 lớp.");
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-7xl mx-auto space-y-10"
      >
        {/* 1. ELITE HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/50 pb-8 gap-6 px-2">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Brain size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-0.5 px-2 bg-background border-border/50">
                    AI // OVERWATCH
                 </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                AI Fraud Research
              </h1>
              <p className="text-muted-foreground font-bold text-[10px] uppercase opacity-70 tracking-widest mt-2">
                RANDOM FOREST vs SVM // BEHAVIORAL TELEMETRY
              </p>
           </div>
           
           {/* Elite Tab Navigation (Floating Segmented Control) */}
           <div className="flex bg-muted/20 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-border/50 shadow-sm relative overflow-hidden">
             {["dashboard", "simulator", "monitor"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "relative px-6 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all z-10",
                    activeTab === tab ? "text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="tab-active" 
                      className="absolute inset-0 bg-background rounded-[1rem] shadow-sm -z-10 border border-primary/10" 
                    />
                  )}
                  {tab}
                </button>
             ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
          {/* --- TAB 1: DASHBOARD (Metrics Comparison) --- */}
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                {/* Main Accuracy Comparison Card */}
                <Card className="bg-card/50 border-border/50 rounded-[2.5rem] shadow-sm overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                   <CardContent className="p-8 relative z-10">
                      <div className="flex justify-between items-center mb-10">
                         <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Dna size={24} className="text-primary" /> Metrics Overview
                         </h2>
                         <Badge variant="secondary" className="font-bold text-[9px] uppercase tracking-widest px-3">STABLE RESULTS</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         {/* Accuracy Gauges (Abstract Circular Progress) */}
                         <div className="space-y-8">
                            <div className="relative p-6 bg-primary/[0.03] border border-primary/10 rounded-[2rem] group hover:bg-primary/[0.06] transition-all">
                               <div className="flex justify-between items-end mb-4">
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Random Forest</p>
                                     <h3 className="text-3xl font-black tracking-tighter">96.5%</h3>
                                  </div>
                                  <Activity className="text-primary opacity-30 group-hover:opacity-100 transition-opacity" size={24} />
                               </div>
                               <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: "96.5%" }} transition={{ duration: 1, ease: "circOut" }} className="h-full bg-primary" />
                               </div>
                            </div>

                            <div className="relative p-6 bg-indigo-500/[0.03] border border-indigo-500/10 rounded-[2rem] group hover:bg-indigo-500/[0.06] transition-all">
                               <div className="flex justify-between items-end mb-4">
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">SVM (RBF Kernel)</p>
                                     <h3 className="text-3xl font-black tracking-tighter">92.1%</h3>
                                  </div>
                                  <Network className="text-indigo-400 opacity-30 group-hover:opacity-100 transition-opacity" size={24} />
                               </div>
                               <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: "92.1%" }} transition={{ duration: 1, ease: "circOut", delay: 0.1 }} className="h-full bg-indigo-500" />
                               </div>
                            </div>
                         </div>

                         {/* Supporting Metrics */}
                         <div className="grid grid-cols-2 gap-4">
                            <MetricMicroBox label="Precision" rf={metrics.rf.precision} svm={metrics.svm.precision} />
                            <MetricMicroBox label="Recall" rf={metrics.rf.recall} svm={metrics.svm.recall} />
                            <MetricMicroBox label="F1-Score" rf={metrics.rf.f1} svm={metrics.svm.f1} />
                            <MetricMicroBox label="Reliability" rf={98} svm={85} />
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Efficiency Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="rounded-[2.5rem] border-border/50 bg-card/30 p-8 shadow-sm">
                      <h3 className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
                        <Clock size={16} /> Training Speed (s)
                      </h3>
                      <div className="flex items-end gap-6 h-36 border-b border-border/50 pb-2">
                         <div className="flex-1 flex flex-col items-center gap-3">
                            <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-full bg-primary/20 rounded-xl border border-primary/30" />
                            <span className="text-[10px] font-black uppercase">RF: 4.2s</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center gap-3">
                            <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="w-full bg-indigo-500/20 rounded-xl border border-indigo-500/30" />
                            <span className="text-[10px] font-black uppercase">SVM: 12.8s</span>
                         </div>
                      </div>
                   </Card>

                   <Card className="rounded-[2.5rem] border-border/50 bg-card/30 p-8 shadow-sm">
                      <h3 className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
                        <Cpu size={16} /> Inference Latency (ms)
                      </h3>
                      <div className="flex items-end gap-6 h-36 border-b border-border/50 pb-2">
                         <div className="flex-1 flex flex-col items-center gap-3">
                            <motion.div initial={{ height: 0 }} animate={{ height: '15%' }} className="w-full bg-primary/20 rounded-xl border border-primary/30" />
                            <span className="text-[10px] font-black uppercase">RF: 12ms</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center gap-3">
                            <motion.div initial={{ height: 0 }} animate={{ height: '75%' }} className="w-full bg-indigo-500/20 rounded-xl border border-indigo-500/30" />
                            <span className="text-[10px] font-black uppercase">SVM: 85ms</span>
                         </div>
                      </div>
                   </Card>
                </div>
              </div>

              {/* Sidebar: Insights & Call to Action */}
              <div className="space-y-8">
                 <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-primary opacity-10">
                       <Shield size={64} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-6 text-foreground">
                       <Scan size={18} className="text-primary" /> Key Findings
                    </h3>
                    <ul className="space-y-6">
                       {[
                         { id: 1, color: "text-primary", bg: "bg-primary/20", text: "Random Forest demonstrates superior performance in non-linear behavioral analysis." },
                         { id: 2, color: "text-indigo-500", bg: "bg-indigo-500/20", text: "SVM models are extremely sensitive to data normalization and scaling." },
                         { id: 3, color: "text-emerald-500", bg: "bg-emerald-500/20", text: "SMOTE technique is critical for simulating adversarial imbalance." }
                       ].map(item => (
                          <li key={item.id} className="flex gap-4 items-start group">
                             <div className={cn("w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black transition-transform group-hover:scale-110", item.color, item.bg)}>
                                {item.id}
                             </div>
                             <p className="text-xs font-bold leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                {item.text}
                             </p>
                          </li>
                       ))}
                    </ul>
                 </div>

                 <Card className="rounded-[2.5rem] border-border/50 bg-black text-white p-8 group relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 space-y-6">
                       <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary mb-4 border border-white/10">
                          <ShieldCheck size={32} />
                       </div>
                       <h3 className="text-xl font-black uppercase tracking-tight leading-none">Security Mandate</h3>
                       <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest leading-relaxed">
                          Behavioral fraud detection protects customer trust and ensures long-term operational integrity.
                       </p>
                       <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-primary hover:text-white hover:border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest h-12">
                          Download Audit Report
                       </Button>
                    </div>
                 </Card>
              </div>
            </motion.div>
          )}

          {/* --- TAB 2: ATTACK SIMULATOR (Elite Logic) --- */}
          {activeTab === "simulator" && (
            <motion.div 
              key="simulator" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Scenarios Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                 <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                    <Terminal size={22} className="text-primary" /> Scenario Lab
                 </h2>
                 <div className="space-y-3">
                    {SCENARIOS.map((s) => (
                      <button 
                         key={s.id} 
                         onClick={() => handleRunSimulation(s)}
                         disabled={simulating}
                         className={cn(
                           "w-full text-left p-5 rounded-[2rem] border-2 transition-all flex gap-5 group relative overflow-hidden",
                           selectedScenario?.id === s.id 
                             ? "bg-primary/[0.03] border-primary shadow-lg shadow-primary/5" 
                             : "bg-card border-border/50 hover:border-primary/40 hover:bg-muted/30"
                         )}
                      >
                         <div className={cn(
                           "p-4 rounded-2xl shrink-0 transition-all duration-300 group-hover:scale-110",
                           selectedScenario?.id === s.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                         )}>
                            <s.icon size={24} strokeWidth={2.5} />
                         </div>
                         <div className="min-w-0 flex-1">
                            <h3 className="font-black text-[13px] uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">{s.name}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground line-clamp-2 leading-relaxed opacity-70">
                               {s.description}
                            </p>
                            <Badge 
                               variant="outline" 
                               className={cn(
                                 "mt-3 text-[8px] font-black uppercase px-2 h-5 tracking-widest",
                                 s.severity === 'critical' ? 'border-red-500 text-red-500' : 'border-border'
                               )}
                            >
                               {s.severity} THREAT
                            </Badge>
                         </div>
                         {selectedScenario?.id === s.id && (
                           <motion.div layoutId="sim-active-indicator" className="w-1 h-12 bg-primary absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full" />
                         )}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Simulation Result Area (Cyber Window) */}
              <div className="lg:col-span-2">
                 <div className="bg-[#0A0C10] border border-white/10 rounded-[3rem] p-10 text-white min-h-[600px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    {/* Background Tech Noise */}
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-8 mb-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 animate-pulse">
                             <Activity size={24} className="text-primary" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">REAL-TIME TELEMETRY</p>
                             <h2 className="text-3xl font-black tracking-tighter uppercase whitespace-nowrap">AI Analysis Engine</h2>
                          </div>
                       </div>
                       <div className="hidden sm:flex flex-col items-end opacity-40 font-mono text-[10px]">
                          <span>SYS_OVERWATCH_V4.2</span>
                          <span>LATENCY_SYNC: 0.002s</span>
                       </div>
                    </div>

                    <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-4">
                       {simulating ? (
                          <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                             <div className="relative">
                                <motion.div 
                                  animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }} 
                                  className="w-24 h-24 border-2 border-primary/10 border-t-primary rounded-full" 
                                />
                                <Fingerprint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                             </div>
                             <div className="text-center font-mono space-y-3">
                                <p className="text-sm uppercase tracking-widest text-primary animate-pulse font-black">Decrypting Behavior Tokens...</p>
                                <div className="space-y-1 opacity-50 text-[10px] uppercase">
                                   <p>{">"} Mapping cross-geo IP nodes...</p>
                                   <p>{">"} Comparing classification hyperplane vectors...</p>
                                </div>
                             </div>
                          </div>
                       ) : simResult ? (
                          <div className="space-y-10 py-4 animate-in fade-in duration-300">
                             {/* Features Summary */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FeatureTag label="Activity" value={selectedScenario?.name} color="text-primary" />
                                <FeatureTag label="Checkout" value={`${selectedScenario?.features.time_to_checkout}s`} />
                                <FeatureTag label="Logins" value={selectedScenario?.features.failed_logins.toString()} />
                                <FeatureTag label="Risk Level" value={selectedScenario?.severity} urgent />
                             </div>

                             {/* Comparison Modules */}
                             <div className="grid md:grid-cols-2 gap-8">
                                <ModelResultCard 
                                  name="Random Forest" 
                                  desc="Ensemble Classification"
                                  risk={simResult.rf.risk}
                                  status={simResult.rf.status}
                                  time={simResult.rf.time}
                                  color="primary"
                                />
                                <ModelResultCard 
                                  name="SVM (Support Vector)" 
                                  desc="Hyperplane Partitioning"
                                  risk={simResult.svm.risk}
                                  status={simResult.svm.status}
                                  time={simResult.svm.time}
                                  color="indigo"
                                />
                             </div>

                             {/* System Insights */}
                             <div className="bg-white/5 border-2 border-white/10 rounded-[2rem] p-6 flex gap-5 items-start">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 shrink-0 flex items-center justify-center text-primary mt-1">
                                   <Layers size={20} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">Architectural Logic</p>
                                   <p className="text-[11px] font-bold leading-relaxed opacity-70">
                                      Các script tấn công tinh vi hiện nay thường mô phỏng độ trễ "như người thật" bằng cách sử dụng phân phối Gaussian. Tuy nhiên, ML models với đặc trưng trích xuất (Feature Extraction) 5-chiều vẫn có thể phát hiện sự bất thường trong chuỗi sự kiện đăng nhập-mua hàng.
                                   </p>
                                </div>
                             </div>
                          </div>
                       ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 select-none py-20 grayscale scale-110">
                             <Scan size={80} strokeWidth={1} className="mb-6 animate-pulse" />
                             <h3 className="text-2xl font-black uppercase tracking-[0.4em]">Awaiting Uplink</h3>
                             <p className="text-xs mt-3 uppercase tracking-widest font-bold">Select target scenario to deploy analyzer</p>
                          </div>
                       )}
                    </div>
                    
                    {/* Retro Cyber-Border Glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
                 </div>
              </div>
            </motion.div>
          )}

          {/* --- TAB 3: MONITOR (Elite Table) --- */}
          {activeTab === "monitor" && (
            <motion.div 
               key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="space-y-8"
            >
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <History size={26} className="text-primary" /> Active Overwatch
                  </h2>
                  <Button className="h-10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-500/20">
                     AUTO-BLOCK: ON
                  </Button>
               </div>

               <Card className="border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-muted/30 border-b border-border/50 text-muted-foreground">
                           <tr>
                              <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">Suspicious Account</th>
                              <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">Method</th>
                              <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">Flagged Pattern</th>
                              <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">Model Consensus</th>
                              <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black text-right">Confidence</th>
                              <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                           <SuspectRow user="anonymous_7h2" method="Direct Link" activity="Bot Sniping" consensus="92% RF / 88% SVM" severity="high" />
                           <SuspectRow user="tranvan_security_test" method="Proxy VPN" activity="Impossible Travel" consensus="85% RF / 79% SVM" severity="medium" />
                           <SuspectRow user="dark_phantom" method="Bot Script" activity="Velocity Spam" consensus="98% RF / 96% SVM" severity="critical" />
                           <SuspectRow user="user_8821" method="Brute Force" activity="Credential Stuffing" consensus="94% RF / 92% SVM" severity="critical" />
                           <SuspectRow user="shop_whale_01" method="Direct Pay" activity="Whale Hunt" consensus="75% RF / 65% SVM" severity="low" />
                        </tbody>
                     </table>
                  </div>
               </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        :root { --primary-rgb: 255, 61, 0; } /* Example primary color mapping */
      `}</style>
    </div>
  );
}

// --- Internal Support Components ---

function MetricMicroBox({ label, rf, svm }: { label: string, rf: number, svm: number }) {
  return (
    <div className="p-4 bg-muted/40 rounded-2xl border border-border/30 hover:border-primary/20 transition-all flex flex-col justify-between">
      <p className="text-[9px] font-black uppercase opacity-50 tracking-widest mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[9px] font-black uppercase">
          <span className="opacity-40">RF</span>
          <span className="text-primary">{rf}%</span>
        </div>
        <div className="h-1 bg-background rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${rf}%` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] font-black uppercase">
          <span className="opacity-40">SVM</span>
          <span className="text-indigo-400">{svm}%</span>
        </div>
        <div className="h-1 bg-background rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${svm}%` }} />
        </div>
      </div>
    </div>
  );
}

function FeatureTag({ label, value, color = "text-white", urgent = false }: any) {
  return (
    <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all", urgent && value === 'critical' ? 'border-red-500/40 bg-red-500/5' : '')}>
       <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">{label}</p>
       <p className={cn("text-xs font-black uppercase tracking-tight", color, urgent && value === 'critical' ? 'text-red-500' : '')}>
          {value || "N/A"}
       </p>
    </div>
  );
}

function ModelResultCard({ name, desc, risk, status, time, color }: any) {
  const isHighRisk = risk > 0.8;
  const accentClass = color === 'primary' ? 'border-primary/30' : 'border-indigo-500/30';
  const textClass = color === 'primary' ? 'text-primary' : 'text-indigo-400';
  
  return (
     <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("bg-white/5 border-2 rounded-[2rem] p-6 flex flex-col justify-between", accentClass)}>
        <div className="flex justify-between items-start mb-6">
           <div className="min-w-0">
              <h4 className={cn("text-sm font-black uppercase tracking-widest leading-none", textClass)}>{name}</h4>
              <p className="text-[9px] font-bold opacity-30 mt-1 uppercase tracking-tighter">{desc}</p>
           </div>
           <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-5 bg-white/5 border-white/10">{time}</Badge>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-6">
           <p className="text-6xl font-black tracking-tighter leading-none mb-1 tabular-nums">{Math.round(risk * 100)}%</p>
           <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em]">Risk Variance</p>
        </div>

        <div className={cn(
          "px-6 py-3 rounded-xl text-[10px] font-black uppercase text-center tracking-[0.2em] shadow-lg",
          status === 'Fraud' ? 'bg-red-600 text-white shadow-red-600/10' : 'bg-primary text-white shadow-primary/10'
        )}>
          {status} DETECTED
        </div>
     </motion.div>
  );
}

function SuspectRow({ user, method, activity, consensus, severity }: any) {
  const sevStyle = severity === 'critical' ? 'text-red-500 bg-red-500/10' : severity === 'high' ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10';
  
  return (
    <tr className="hover:bg-muted/40 transition-colors group cursor-pointer border-b border-border/10 last:border-0 h-20">
       <td className="px-8 py-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center font-black text-primary transition-all group-hover:scale-110">
                {user.charAt(0).toUpperCase()}
             </div>
             <span className="font-black text-[11px] uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{user}</span>
          </div>
       </td>
       <td className="px-8 py-4 text-xs font-bold text-muted-foreground uppercase opacity-60">{method}</td>
       <td className="px-8 py-4">
          <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-transparent", sevStyle)}>
            {activity}
          </span>
       </td>
       <td className="px-8 py-4 font-mono text-[10px] opacity-70 group-hover:opacity-100 transition-opacity tracking-tighter">{consensus}</td>
       <td className="px-8 py-4 text-right">
          <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] font-black text-primary">{consensus.split('%')[0]}%</span>
             <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: consensus.split('%')[0] + '%' }} 
                   className="h-full bg-primary" 
                />
             </div>
          </div>
       </td>
       <td className="px-8 py-4">
          <div className="flex justify-end gap-2">
             <Button size="sm" className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20" onClick={(e) => { e.stopPropagation(); toast.success("Đã khóa tài khoản " + user); }}>
                BLOCK
             </Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/50 hover:bg-white shadow-sm">
                <ChevronRight size={16} className="text-muted-foreground" />
             </Button>
          </div>
       </td>
    </tr>
  );
}
