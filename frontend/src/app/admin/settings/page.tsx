"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Settings, Save, Percent, Truck, Power, 
  Globe, Database, CreditCard, Bell, 
  ShieldCheck, Layout, Info, ChevronRight,
  RefreshCcw, Terminal, HardDrive
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"finance" | "platform" | "localization">("finance");

  const [settings, setSettings] = useState({
    platform_fee: "5",
    shipping_base_rate: "10000",
    tax_rate: "8.5",
    maintenance_mode: "0",
    store_name: "ShopDee Elite",
    contact_email: "support@shopdee.com",
    currency: "VND",
  });

  const fetchSettings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      if (Array.isArray(data)) {
         const newSettings: any = { ...settings };
         data.forEach((s: any) => {
            if (newSettings.hasOwnProperty(s.key)) {
               newSettings[s.key] = s.value;
            }
         });
         setSettings(newSettings);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      const payload = Object.entries(settings).map(([key, value]) => ({
         key,
         value: value.toString(),
         type: key === 'maintenance_mode' ? 'boolean' : (['platform_fee', 'shipping_base_rate', 'tax_rate'].includes(key) ? 'numeric' : 'string'),
         group: ['platform_fee', 'tax_rate'].includes(key) ? 'finance' : 'platform'
      }));

      await axios.put(`${API_URL}/admin/settings`, { settings: payload }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t("admin.system_config.update_success"));
    } catch (err) {
      toast.error(t("admin.system_config.update_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-6xl mx-auto space-y-12"
      >
        {/* 1. ELITE HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-transform hover:rotate-90 duration-500">
                    <Settings size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                    CORE // SYSTEM ENGINE
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                System Config
              </h1>
              <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                REGISTRY // GLOBAL PARAMETERS V5.0
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchSettings}
                className="h-12 w-12 rounded-2xl border-border/50 bg-background shadow-sm hover:text-primary"
              >
                 <RefreshCcw size={18} strokeWidth={2.5} />
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saving}
                className="h-12 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10 active:scale-95 transition-all"
              >
                <Save className="mr-2" size={18} strokeWidth={3} />
                {saving ? "SAVING..." : "COMMIT CHANGES"}
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Sidebar Filter / Navigation */}
           <div className="lg:col-span-3 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4 mb-4">Configuration Nodes</p>
              <div className="space-y-2">
                 <ConfigNodeButton 
                   active={activeTab === 'finance'} 
                   onClick={() => setActiveTab('finance')} 
                   icon={CreditCard} 
                   label="Financial Logic" 
                   desc="Fees, Tax, Rates"
                 />
                 <ConfigNodeButton 
                   active={activeTab === 'platform'} 
                   onClick={() => setActiveTab('platform')} 
                   icon={HardDrive} 
                   label="Platform Core" 
                   desc="Behaviors & Modes"
                 />
                 <ConfigNodeButton 
                   active={activeTab === 'localization'} 
                   onClick={() => setActiveTab('localization')} 
                   icon={Globe} 
                   label="Global Identity" 
                   desc="SEO & Contact"
                 />
              </div>

              <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 mt-8 space-y-4">
                 <h3 className="font-black text-[11px] uppercase tracking-widest text-primary flex items-center gap-2">
                    <Terminal size={14} /> Audit Trace
                 </h3>
                 <p className="text-[10px] font-bold leading-relaxed opacity-60 uppercase italic">
                    Tất cả thay đổi đều được ghi lại trong nhật ký hệ thống. Hãy cẩn trọng khi điều chỉnh các thông số vận hành cốt lõi.
                 </p>
              </div>
           </div>

           {/* Main Settings Area */}
           <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                 <motion.div 
                    key={activeTab} 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                 >
                    <Card className="rounded-[3rem] border-border/50 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden p-8 md:p-12 relative group min-h-[500px]">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                       
                       <div className="relative z-10">
                          {activeTab === 'finance' && (
                             <div className="space-y-10">
                                <SectionHeader icon={Percent} title="Financial Parameters" sub="Management of fees, taxation, and shipping baselines" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                   <ConfigInput 
                                     label="Platform Service Fee (%)" 
                                     value={settings.platform_fee} 
                                     onChange={(v) => setSettings({...settings, platform_fee: v})} 
                                     desc="Cước dịch vụ thu trên mỗi đơn hàng thành công"
                                   />
                                   <ConfigInput 
                                     label="Standard Tax Rate (%)" 
                                     value={settings.tax_rate} 
                                     onChange={(v) => setSettings({...settings, tax_rate: v})} 
                                     desc="Thuế giá trị gia tăng áp dụng mặc định"
                                   />
                                   <ConfigInput 
                                     label="Base Shipping Rate (VND)" 
                                     value={settings.shipping_base_rate} 
                                     onChange={(v) => setSettings({...settings, shipping_base_rate: v})} 
                                     desc="Cước phí vận chuyển cơ bản cho 1km đầu tiên"
                                   />
                                </div>
                             </div>
                          )}

                          {activeTab === 'platform' && (
                             <div className="space-y-10">
                                <SectionHeader icon={Power} title="System Protocols" sub="Core operational modes and platform-wide states" />
                                <div className="space-y-8">
                                   <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-muted/20 border border-border/50 rounded-[2.5rem] gap-6 group/item hover:bg-muted/30 transition-all">
                                      <div className="max-w-md">
                                         <h4 className="text-lg font-black uppercase tracking-tight mb-1 group-hover/item:text-primary transition-colors">Maintenance Mode</h4>
                                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                            Kích hoạt chế độ bảo trì sẽ tạm thời ngăn chặn tất cả truy cập từ phía người dùng cuối ngoại trừ Admin.
                                         </p>
                                      </div>
                                      <div className="flex items-center gap-4 bg-background px-6 py-4 rounded-[1.5rem] border border-border/40 shadow-sm">
                                         <span className={cn("text-[10px] font-black uppercase tracking-widest", settings.maintenance_mode === '1' ? "text-primary" : "text-muted-foreground")}>
                                            {settings.maintenance_mode === '1' ? "ENABLED" : "OFFLINE"}
                                         </span>
                                         <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                               type="checkbox" 
                                               checked={settings.maintenance_mode === '1'}
                                               onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked ? '1' : '0'})}
                                               className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                         </label>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          )}

                          {activeTab === 'localization' && (
                             <div className="space-y-10">
                                <SectionHeader icon={Globe} title="Global Positioning" sub="Public identity parameters and SEO metadata" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                   <ConfigInput 
                                     label="System Store Name" 
                                     value={settings.store_name} 
                                     onChange={(v) => setSettings({...settings, store_name: v})} 
                                     desc="Tên hiển thị chính thức của toàn bộ nền tảng"
                                   />
                                   <ConfigInput 
                                     label="Global Contact Email" 
                                     value={settings.contact_email} 
                                     onChange={(v) => setSettings({...settings, contact_email: v})} 
                                     desc="Địa chỉ nhận thông báo và hỗ trợ site-wide"
                                   />
                                   <ConfigInput 
                                     label="System Currency Code" 
                                     value={settings.currency} 
                                     onChange={(v) => setSettings({...settings, currency: v})} 
                                     desc="Mã tiền tệ cơ sở cho toàn bộ giao dịch"
                                   />
                                </div>
                             </div>
                          )}
                       </div>
                    </Card>
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// --- Internal Support Components ---

function ConfigNodeButton({ active, label, desc, onClick, icon: Icon }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
           "w-full p-4 rounded-[1.8rem] border-2 transition-all flex items-center gap-4 group relative overflow-hidden",
           active ? "bg-primary/[0.03] border-primary shadow-sm" : "bg-card border-transparent hover:border-border/60 hover:bg-muted/30"
        )}
      >
         <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0",
            active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
         )}>
            <Icon size={22} strokeWidth={2.5} />
         </div>
         <div className="text-left min-w-0">
            <h4 className={cn("text-[13px] font-black uppercase tracking-tight leading-none mb-1", active ? "text-foreground" : "text-muted-foreground")}>{label}</h4>
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest truncate">{desc}</p>
         </div>
         {active && <motion.div layoutId="node-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
      </button>
   );
}

function SectionHeader({ icon: Icon, title, sub }: any) {
   return (
      <div className="flex items-center gap-5 pb-8 border-b border-border/10">
         <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 transition-transform hover:scale-110">
            <Icon size={28} strokeWidth={2.5} />
         </div>
         <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{title}</h2>
            <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mt-2">{sub}</p>
         </div>
      </div>
   );
}

function ConfigInput({ label, value, onChange, desc }: any) {
   return (
      <div className="space-y-3 group/input">
         <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2 group-focus-within/input:text-primary transition-colors">{label}</label>
         <Input 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-16 px-6 bg-muted/20 border-transparent rounded-[1.5rem] font-bold text-base shadow-none focus-visible:bg-background focus-visible:ring-primary/20 transition-all"
         />
         <p className="text-[9px] font-bold text-muted-foreground/60 uppercase ml-2 tracking-tighter">{desc}</p>
      </div>
   );
}
