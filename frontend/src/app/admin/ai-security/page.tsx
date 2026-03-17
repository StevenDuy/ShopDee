"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  MousePointerClick, 
  Clock, 
  Globe, 
  Lock, 
  ShoppingCart, 
  UserX,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Dna,
  Terminal,
  Play,
  History,
  Info,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import FullPageLoader from "@/components/FullPageLoader";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "simulator" | "monitor">("dashboard");
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Mock Performance Data
  const metrics = {
    rf: { accuracy: 96.5, precision: 94.2, recall: 92.8, f1: 93.5, trainTime: 4.2, inferenceTime: 0.012 },
    svm: { accuracy: 92.1, precision: 89.5, recall: 88.2, f1: 88.8, trainTime: 12.8, inferenceTime: 0.085 }
  };

  const handleRunSimulation = async (scenario: AttackScenario) => {
    setSelectedScenario(scenario);
    // Note: this internal simulation loading is separate from the full page loader
    setSimResult(null);
    const startSimLoading = true;
    
    // Simulate API Call to ML Engine
    setTimeout(() => {
      // Logic giả định kết quả so sánh
      const rf_risk = scenario.severity === "critical" ? 0.98 : (scenario.severity === "high" ? 0.85 : 0.65);
      const svm_risk = rf_risk - 0.05 - (Math.random() * 0.1); // Giả định SVM kém hơn chút trong bài toán này
      
      setSimResult({
        rf: { risk: rf_risk, status: rf_risk > 0.8 ? "Fraud" : "Suspicious", time: "12ms" },
        svm: { risk: svm_risk, status: svm_risk > 0.8 ? "Fraud" : "Suspicious", time: "85ms" }
      });
      
      if (rf_risk > 0.9) {
        toast.error("Hệ thống tự động: Đã tạm khóa tài khoản do rủi ro Critical!");
      } else {
        toast.warning("Cảnh báo: Phát hiện hành vi nghi vấn. Đã gửi yêu cầu xác thực 2 lớp.");
      }
    }, 1500);
  };

  return (
    <div className="bg-background min-h-screen">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 md:p-8 max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-xl">
                 <Brain className="text-primary" size={28} />
               </div>
               <h1 className="text-3xl font-bold tracking-tight">AI Fraud Research</h1>
            </div>
            <p className="text-muted-foreground">Nghiên cứu so sánh Random Forest & SVM trong phát hiện gian lận hành vi.</p>
          </div>
          
          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BarChart3 size={16} className="inline mr-2" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'simulator' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Terminal size={16} className="inline mr-2" /> Simulator
            </button>
            <button 
              onClick={() => setActiveTab("monitor")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'monitor' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ShieldAlert size={16} className="inline mr-2" /> Monitor
            </button>
          </div>
        </div>

      <AnimatePresence mode="wait">
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <motion.div 
            key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Dna className="text-primary" size={20} /> Comparative Performance Metrics
                </h2>
                <div className="space-y-8">
                  {/* Accuracy Comparison */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Model Accuracy (%)</span>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase opacity-60"><span>Random Forest</span><span>{metrics.rf.accuracy}%</span></div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${metrics.rf.accuracy}%` }} className="h-full bg-primary" transition={{ duration: 1 }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase opacity-60"><span>SVM (RBF Kernel)</span><span>{metrics.svm.accuracy}%</span></div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${metrics.svm.accuracy}%` }} className="h-full bg-indigo-500" transition={{ duration: 1, delay: 0.2 }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                    <MetricBox label="Precision" rf={metrics.rf.precision} svm={metrics.svm.precision} />
                    <MetricBox label="Recall" rf={metrics.rf.recall} svm={metrics.svm.recall} />
                    <MetricBox label="F1-Score" rf={metrics.rf.f1} svm={metrics.svm.f1} />
                    <MetricBox label="Reliability" rf={98} svm={85} />
                  </div>
                </div>
              </div>

              {/* Training Time Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold mb-4 opacity-70 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={16} /> Training Speed
                  </h3>
                  <div className="flex items-end gap-3 h-32">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-full bg-primary/40 rounded-t-lg" />
                      <span className="text-[10px] font-bold">RF: {metrics.rf.trainTime}s</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="w-full bg-indigo-500/40 rounded-t-lg" />
                      <span className="text-[10px] font-bold">SVM: {metrics.svm.trainTime}s</span>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold mb-4 opacity-70 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={16} /> Inference Latency
                  </h3>
                  <div className="flex items-end gap-3 h-32">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <motion.div initial={{ height: 0 }} animate={{ height: '15%' }} className="w-full bg-primary/40 rounded-t-lg" />
                      <span className="text-[10px] font-bold">RF: {metrics.rf.inferenceTime}s</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} className="w-full bg-indigo-500/40 rounded-t-lg" />
                      <span className="text-[10px] font-bold">SVM: {metrics.svm.inferenceTime}s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
               <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                  <h3 className="font-bold flex items-center gap-2 mb-4"><Info size={18} /> Research Insights</h3>
                  <ul className="space-y-4 text-sm leading-relaxed">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
                      <p><span className="font-bold">Random Forest</span> chứng tỏ khả năng xử lý dữ liệu hành vi phi tuyến tính (non-linear) tốt hơn và tốc độ dự đoán vượt trội cho Real-time.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-500">2</div>
                      <p><span className="font-bold">SVM</span> cực kỳ nhạy cảm với việc chuẩn hóa (Scaling). Nếu dữ liệu không được chuẩn hóa tốt, hiệu năng SVM sẽ giảm sâu.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 shrink-0 flex items-center justify-center text-[10px] font-bold text-emerald-500">3</div>
                      <p>Kỹ thuật <span className="font-bold">SMOTE</span> là bắt buộc để mô phỏng sự tinh vi của tội phạm trong môi trường dataset mất cân bằng lớp.</p>
                    </li>
                  </ul>
               </div>
               <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
                  <ShieldCheck size={48} className="mx-auto text-emerald-500 opacity-50" />
                  <h3 className="font-bold">Cybersecurity Importance</h3>
                  <p className="text-xs text-muted-foreground">Phát hiện gian lận hành vi không chỉ là bảo vệ tiền bạc, mà là bảo vệ lòng tin của khách hàng vào hệ thống số hóa.</p>
               </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB 2: ATTACK SIMULATOR --- */}
        {activeTab === "simulator" && (
          <motion.div 
            key="simulator" initial={{ opacity: 0, x:-20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Scenarios List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Play size={20} className="text-primary" /> Chọn Kịch bản Tấn công</h2>
              {SCENARIOS.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => handleRunSimulation(s)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-4 group ${selectedScenario?.id === s.id ? 'bg-primary/5 border-primary' : 'bg-card border-border hover:border-primary/50'}`}
                >
                  <div className={`p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform ${selectedScenario?.id === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <s.icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm mb-1">{s.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{s.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                         s.severity === 'critical' ? 'bg-red-500 text-white' : 
                         s.severity === 'high' ? 'bg-orange-500 text-white' : 
                         'bg-yellow-500 text-white'
                       }`}>{s.severity}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Simulation Results */}
            <div className="lg:col-span-2">
               <div className="bg-zinc-900 rounded-3xl p-8 text-white min-h-[500px] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                     <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-1">Live Simulator</p>
                        <h2 className="text-2xl font-black">AI Fraud Engine Analysis</h2>
                     </div>
                     <Terminal className="text-primary opacity-50" size={32} />
                  </div>

                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full" />
                        <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                      </div>
                      <div className="text-center">
                         <p className="font-mono text-sm opacity-60">Extracting behavioral features...</p>
                         <p className="font-mono text-sm text-primary animate-pulse mt-1">Comparing RF & SVM models...</p>
                      </div>
                    </div>
                  ) : simResult ? (
                    <div className="flex-1 space-y-8 animate-in fade-in duration-500">
                      {/* Scenario Summary */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-6 items-center">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/40">Target Activity</p>
                            <p className="font-bold text-primary">{selectedScenario?.name}</p>
                         </div>
                         <div className="w-px h-8 bg-white/10" />
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/40">Checkout Time</p>
                            <p className="font-bold">{selectedScenario?.features.time_to_checkout}s</p>
                         </div>
                         <div className="w-px h-8 bg-white/10" />
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/40">Failed Logins</p>
                            <p className="font-bold">{selectedScenario?.features.failed_logins}</p>
                         </div>
                      </div>

                      {/* Main Comparison results */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* RF Result */}
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white/5 border border-primary/30 rounded-3xl p-6 space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest text-primary">Random Forest</span>
                              <span className="text-[10px] opacity-50">{simResult.rf.time}</span>
                           </div>
                           <div className="py-2">
                              <p className="text-4xl font-black">{Math.round(simResult.rf.risk * 100)}%</p>
                              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Fraud Probability</p>
                           </div>
                           <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase text-center ${simResult.rf.status === 'Fraud' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                              {simResult.rf.status} detected
                           </div>
                        </motion.div>

                        {/* SVM Result */}
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-indigo-500/30 rounded-3xl p-6 space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">SVM Classifier</span>
                              <span className="text-[10px] opacity-50">{simResult.svm.time}</span>
                           </div>
                           <div className="py-2">
                              <p className="text-4xl font-black">{Math.round(simResult.svm.risk * 100)}%</p>
                              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Fraud Probability</p>
                           </div>
                           <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase text-center ${simResult.svm.status === 'Fraud' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                              {simResult.svm.status} detected
                           </div>
                        </motion.div>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-sm">
                         <ShieldAlert className="text-emerald-500 shrink-0" size={20} />
                         <p className="text-emerald-100"><span className="font-bold">Hệ thống ghi chú:</span> Tội phạm mạng thường sử dụng các script tự động hóa có tham số ngẫu nhiên nhẹ để tránh các bộ lọc tĩnh. Chỉ có Machine Learning với khả năng nhận diện mẫu hành vi (Patterns) mới có thể đối phó hiệu quả.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 select-none">
                       <Play size={64} className="mb-4" />
                       <h3 className="text-xl font-bold uppercase tracking-[0.2em]">Ready to Launch</h3>
                       <p className="text-xs mt-2 font-mono">Select a scenario from the sidebar to start analysis.</p>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB 3: SUSPECT MONITOR --- */}
        {activeTab === "monitor" && (
          <motion.div 
            key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="text-primary" size={24} /> Bảng Tổng hợp Hành vi Đáng ngờ
                </h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors uppercase tracking-widest shadow-lg shadow-red-500/20">Auto-Action: ON</button>
                </div>
             </div>

             <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider opacity-60">Account</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider opacity-60">Last Method</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider opacity-60">Suspected Activity</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider opacity-60">Model Consensus</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider opacity-60">Confidence</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider opacity-60 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <SuspectRow user="anonymous_7h2" method="Direct Link" activity="Bot Sniping" consensus="92% RF / 88% SVM" severity="high" />
                    <SuspectRow user="tranvan_security_test" method="Proxy VPN" activity="Impossible Travel" consensus="85% RF / 79% SVM" severity="medium" />
                    <SuspectRow user="dark_phantom" method="Bot Script" activity="Velocity Spam" consensus="98% RF / 96% SVM" severity="critical" />
                    <SuspectRow user="user_8821" method="Brute Force" activity="Credential Stuffing" consensus="94% RF / 92% SVM" severity="critical" />
                    <SuspectRow user="shop_whale_01" method="Direct Pay" activity="Whale Hunt" consensus="75% RF / 65% SVM" severity="low" />
                  </tbody>
                </table>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MetricBox({ label, rf, svm }: { label: string, rf: number, svm: number }) {
  return (
    <div className="p-4 bg-muted/40 rounded-xl space-y-3">
      <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold"><span>RF</span><span>{rf}%</span></div>
        <div className="h-1.5 bg-background rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${rf}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-bold"><span>SVM</span><span>{svm}%</span></div>
        <div className="h-1.5 bg-background rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${svm}%` }} />
        </div>
      </div>
    </div>
  );
}

function SuspectRow({ user, method, activity, consensus, severity }: any) {
  const sevStyle = severity === 'critical' ? 'text-red-600 bg-red-100' : severity === 'high' ? 'text-orange-600 bg-orange-100' : 'text-yellow-600 bg-yellow-100';
  
  return (
    <tr className="hover:bg-muted/50 transition-colors group cursor-pointer">
       <td className="px-6 py-4 font-bold text-foreground">{user}</td>
       <td className="px-6 py-4 text-muted-foreground">{method}</td>
       <td className="px-6 py-4">
         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${sevStyle}`}>
           {activity}
         </span>
       </td>
       <td className="px-6 py-4 font-mono text-xs opacity-80">{consensus}</td>
       <td className="px-6 py-4">
          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
             <div className="h-full bg-primary" style={{ width: consensus.split('%')[0] + '%' }} />
          </div>
       </td>
       <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg" onClick={(e) => { e.stopPropagation(); toast.success("Đã khóa tài khoản " + user); }}>Block</button>
             <button className="px-3 py-1 bg-muted text-foreground text-[10px] font-bold rounded-lg">Profile</button>
          </div>
       </td>
    </tr>
  );
}
