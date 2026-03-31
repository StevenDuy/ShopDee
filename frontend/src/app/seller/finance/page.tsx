"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Clock, 
  Building, Plus, AlertCircle, Wallet, LayoutGrid,
  ChevronLeft, ChevronRight, BarChart3, TrendingUp
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface FinanceOverview {
  total_revenue: number;
  pending_clearance: number;
  available_balance: number;
  total_withdrawn: number;
  pending_withdrawal: number;
}

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export default function SellerFinancePage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchFinanceData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/seller/finance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverview(res.data.overview);
      const txData = res.data.transactions;
      setTransactions(Array.isArray(txData) ? txData : (txData?.data || []));
    } catch (err) {
      console.error("Failed to fetch finance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [token]);

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !withdrawAmount || Number(withdrawAmount) < 10) return;

    setError("");
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum < 10) {
      setError(t("seller.finance.withdraw_modal.min_error"));
      return;
    }

    if (amountNum > (overview?.available_balance || 0)) {
      setError(t("seller.finance.withdraw_modal.exceed_error"));
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/seller/finance/withdraw`, {
        amount: amountNum,
        bank_name: bankName,
        bank_account: bankAccount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsModalOpen(false);
      setWithdrawAmount("");
      setBankName("");
      setBankAccount("");
      fetchFinanceData(); // refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || t("seller.finance.withdraw_modal.update_error") || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* 1. ELITE HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <Wallet size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                    FINANCIAL // TERMINAL
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                {t("seller.finance.title")}
              </h1>
              <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                {t("seller.finance.desc")}
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                onClick={() => setIsModalOpen(true)}
                disabled={!overview || overview.available_balance < 10}
                className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10 active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={3} className="mr-2" />
                {t("seller.finance.request_withdrawal")}
              </Button>
           </div>
        </div>

        {/* 2. STATS GRID (Glassmorphism rounded-[2rem]) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {loading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
              <>
                 <PremiumStat 
                   icon={TrendingUp} 
                   label={t("seller.finance.available_balance")} 
                   value={formatPrice(overview?.available_balance || 0)}
                   trend="Available for payout"
                   color="emerald"
                 />
                 <PremiumStat 
                   icon={Clock} 
                   label={t("seller.finance.pending_clearance")} 
                   value={formatPrice(overview?.pending_clearance || 0)}
                   trend="Awaiting verification"
                   color="amber"
                 />
                 <PremiumStat 
                   icon={DollarSign} 
                   label={t("seller.finance.total_revenue")} 
                   value={formatPrice(overview?.total_revenue || 0)}
                   trend="Lifetime earnings"
                   color="primary"
                 />
                 <PremiumStat 
                   icon={ArrowDownRight} 
                   label={t("seller.finance.total_withdrawn")} 
                   value={formatPrice(overview?.total_withdrawn || 0)}
                   trend={overview?.pending_withdrawal && overview.pending_withdrawal > 0 
                     ? `+${formatPrice(overview.pending_withdrawal)} pending` 
                     : "Total payouts"}
                   color="slate"
                 />
              </>
           )}
        </div>

        {/* 3. TRANSACTION HISTORY (rounded-[3rem] Table Container) */}
        <div className="space-y-6">
           <div className="flex items-center gap-4 ml-4">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                 <BarChart3 size={16} className="text-muted-foreground" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("seller.finance.transaction_history")}</h2>
           </div>

           <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-muted/30 border-b border-border/30 text-muted-foreground">
                       <tr>
                          <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.orders.date").toUpperCase()}</th>
                          <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.finance.description").toUpperCase()}</th>
                          <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.finance.type").toUpperCase()}</th>
                          <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.finance.status").toUpperCase()}</th>
                          <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black text-right">{t("seller.finance.amount").toUpperCase()}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                       <AnimatePresence mode="popLayout">
                          {loading ? (
                             <TableRowSkeleton />
                          ) : transactions.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="px-8 py-32 text-center text-muted-foreground select-none grayscale">
                                   <div className="flex flex-col items-center">
                                      < DollarSign size={60} className="opacity-10 mb-4 animate-pulse" />
                                      <p className="text-xs font-black uppercase tracking-widest opacity-40">{t("seller.finance.no_transactions")}</p>
                                   </div>
                                </td>
                             </tr>
                          ) : (
                             transactions.map((tx, idx) => (
                                <motion.tr
                                   key={tx.id}
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: idx * 0.03, duration: 0.2 }}
                                   className="hover:bg-muted/40 transition-colors group h-20"
                                >
                                   <td className="px-8 py-4">
                                      <span className="text-[11px] font-black uppercase tracking-tighter opacity-40 tabular-nums">
                                         {format(new Date(tx.created_at), t("locale") === "vi-VN" ? "dd/MM/yyyy HH:mm" : "MMM d, yyyy HH:mm", {
                                            locale: t("locale") === "vi-VN" ? vi : enUS
                                         })}
                                      </span>
                                   </td>
                                   <td className="px-8 py-4">
                                      <p className="font-black text-[13px] uppercase tracking-tight text-foreground truncate">
                                         {tx.description || (tx.type === 'credit' ? t("seller.finance.order_revenue") : t("seller.finance.withdrawal"))}
                                      </p>
                                   </td>
                                   <td className="px-8 py-4">
                                      <TypeBadge type={tx.type} t={t} />
                                   </td>
                                   <td className="px-8 py-4">
                                      <span className={cn(
                                         "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                         tx.status === 'completed' ? 'bg-blue-500/5 text-blue-500 border-blue-500/20' : 'bg-amber-500/5 text-amber-500 border-amber-500/20'
                                      )}>
                                         {t(`seller.orders.status_${tx.status}`)}
                                      </span>
                                   </td>
                                   <td className={cn(
                                      "px-8 py-4 text-right font-black text-[15px] tabular-nums",
                                      tx.type === 'credit' ? 'text-emerald-500' : 'text-foreground'
                                   )}>
                                      {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                                   </td>
                                </motion.tr>
                             ))
                          )}
                       </AnimatePresence>
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        {/* 4. WITHDRAWAL MODAL (rounded-[2.5rem] + glassmorphism) */}
        <AnimatePresence>
           {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                 <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden"
                 >
                    <div className="px-10 py-8 border-b border-border/10 flex items-center justify-between">
                       <div>
                          <h3 className="text-xl font-black uppercase tracking-tighter">{t("seller.finance.withdraw_modal.title")}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-50">Transfer funds to bank account</p>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white transition-all">
                          <Plus className="rotate-45" size={20} />
                       </button>
                    </div>

                    <form onSubmit={handleWithdrawRequest} className="p-10 space-y-8">
                       {error && (
                          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                             <AlertCircle size={18} />
                             {error}
                          </div>
                       )}

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("seller.finance.available_balance")}</label>
                          <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-2xl font-black text-emerald-500 tabular-nums">
                             {formatPrice(overview?.available_balance || 0)}
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("seller.finance.withdraw_modal.amount_label")}</label>
                          <input
                             type="number"
                             step="0.01"
                             min="10"
                             max={overview?.available_balance || 0}
                             value={withdrawAmount}
                             onChange={(e) => setWithdrawAmount(e.target.value)}
                             className="w-full h-14 px-6 bg-muted/20 border border-border/50 rounded-2xl font-black text-[20px] focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:opacity-20"
                             placeholder="0.00"
                             required
                          />
                       </div>

                       <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("seller.finance.withdraw_modal.bank_name")}</label>
                             <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full h-14 px-6 bg-muted/20 border border-border/50 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                placeholder="e.g. Vietcombank"
                                required
                             />
                          </div>

                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("seller.finance.withdraw_modal.account_details")}</label>
                             <input
                                type="text"
                                value={bankAccount}
                                onChange={(e) => setBankAccount(e.target.value)}
                                className="w-full h-14 px-6 bg-muted/20 border border-border/50 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                placeholder="Account Number & Name"
                                required
                             />
                          </div>
                       </div>

                       <div className="pt-4">
                          <Button
                             type="submit"
                             disabled={submitting}
                             className="w-full h-16 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                          >
                             {submitting ? t("seller.finance.withdraw_modal.submitting") : t("seller.finance.withdraw_modal.submit")}
                          </Button>
                       </div>
                    </form>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// --- Helper Components ---

function PremiumStat({ label, value, icon: Icon, trend, color }: any) {
   const colors: Record<string, string> = {
      emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      primary: "bg-primary/10 text-primary border-primary/20",
      slate: "bg-slate-500/10 text-slate-500 border-slate-500/20",
   };

   return (
      <div className="bg-card/40 backdrop-blur-sm border border-border/40 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-500 group-hover:rotate-12 translate-x-4 -translate-y-4">
            <Icon size={120} strokeWidth={1} />
         </div>
         
         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm mb-6", colors[color])}>
            <Icon size={24} strokeWidth={2.5} />
         </div>
         
         <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 leading-none mb-2">
               {label}
            </p>
            <h3 className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
               {value}
            </h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 mt-3 pt-3 border-t border-border/5">
               {trend}
            </p>
         </div>
      </div>
   );
}

function TypeBadge({ type, t }: any) {
   return type === 'credit' ? (
      <Badge className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-black text-[9px] tracking-widest uppercase px-3 h-6">
         <ArrowDownRight size={10} className="mr-1" /> {t("seller.finance.credit")}
      </Badge>
   ) : (
      <Badge className="bg-rose-500/5 text-rose-500 border-rose-500/20 font-black text-[9px] tracking-widest uppercase px-3 h-6">
         <ArrowUpRight size={10} className="mr-1" /> {t("seller.finance.debit")}
      </Badge>
   );
}

function StatSkeleton() {
   return <div className="h-44 bg-card/40 rounded-[2rem] border border-border/40 animate-pulse" />;
}

function TableRowSkeleton() {
   return [...Array(5)].map((_, i) => (
      <tr key={i} className="h-20">
         <td className="px-8 py-4"><div className="w-24 h-6 bg-muted/40 rounded-xl animate-pulse" /></td>
         <td className="px-8 py-4"><div className="w-full h-8 bg-muted/40 rounded-xl animate-pulse" /></td>
         <td className="px-8 py-4"><div className="w-16 h-6 bg-muted/40 rounded-xl animate-pulse" /></td>
         <td className="px-8 py-4"><div className="w-20 h-6 bg-muted/40 rounded-xl animate-pulse" /></td>
         <td className="px-8 py-4 text-right"><div className="w-24 h-8 bg-muted/40 rounded-xl animate-pulse ml-auto" /></td>
      </tr>
   ));
}
