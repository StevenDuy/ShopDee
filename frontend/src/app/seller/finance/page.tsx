"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, Building, Plus, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { useCurrencyStore } from "@/store/useCurrencyStore";

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
  const { token, user } = useAuthStore();
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
      alert(t("seller.finance.withdraw_success") || "Withdrawal request submitted successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || t("seller.finance.withdraw_modal.update_error") || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-6xl mx-auto p-4 md:p-8"
      >
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("seller.finance.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("seller.finance.desc")}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!overview || overview.available_balance < 10}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Building size={18} />
            {t("seller.finance.request_withdrawal")}
          </button>
        </div>

        {/* Stats Grid */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("seller.finance.available_balance")}</p>
                  <h3 className="text-2xl font-bold mt-1 text-green-500">{formatPrice(overview.available_balance)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("seller.finance.pending_clearance")}</p>
                  <h3 className="text-2xl font-bold mt-1">{formatPrice(overview.pending_clearance)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("seller.finance.total_revenue")}</p>
                  <h3 className="text-2xl font-bold mt-1">{formatPrice(overview.total_revenue)}</h3>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                  <ArrowDownRight size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("seller.finance.total_withdrawn")}</p>
                  <h3 className="text-2xl font-bold mt-1">{formatPrice(overview.total_withdrawn)}</h3>
                </div>
              </div>
              {overview.pending_withdrawal > 0 && (
                <p className="text-xs text-amber-500 mt-3 font-medium flex items-center gap-1">
                  <Clock size={12} />
                  +{formatPrice(overview.pending_withdrawal)} {t("seller.finance.status_pending")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-lg font-bold">{t("seller.finance.transaction_history")}</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <DollarSign size={32} className="opacity-20" />
              </div>
              <p className="font-medium text-lg text-foreground/80">{t("seller.finance.no_transactions")}</p>
              <p className="text-sm max-w-xs mt-1">{t("seller.finance.desc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t("seller.orders.date")}</th>
                    <th className="px-6 py-4 font-medium">{t("seller.finance.description")}</th>
                    <th className="px-6 py-4 font-medium">{t("seller.finance.type")}</th>
                    <th className="px-6 py-4 font-medium">{t("seller.finance.status")}</th>
                    <th className="px-6 py-4 font-medium text-right">{t("seller.finance.amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(tx.created_at), t("locale") === "vi-VN" ? "dd/MM/yyyy HH:mm" : "MMM d, yyyy HH:mm", {
                          locale: t("locale") === "vi-VN" ? vi : enUS
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {tx.description || (tx.type === 'credit' ? t("seller.finance.order_revenue") : t("seller.finance.withdrawal"))}
                      </td>
                      <td className="px-6 py-4">
                        {tx.type === 'credit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            <ArrowDownRight size={12} /> {t("seller.finance.credit")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                            <ArrowUpRight size={12} /> {t("seller.finance.debit")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tx.status === 'completed'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                          }`}>
                          {t(`seller.orders.status_${tx.status}`)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-foreground'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold">{t("seller.finance.withdraw_modal.title")}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>

              <form onSubmit={handleWithdrawRequest} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{t("seller.finance.available_balance")}</label>
                  <div className="p-3 bg-muted rounded-xl text-lg font-bold text-green-500">
                    {formatPrice(overview?.available_balance || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("seller.finance.withdraw_modal.amount_label")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={overview?.available_balance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("seller.finance.withdraw_modal.bank_name")}</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("seller.finance.withdraw_modal.bank_placeholder")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("seller.finance.withdraw_modal.account_details")}</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("seller.finance.withdraw_modal.account_placeholder")}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-xl transition-colors"
                  >
                    {t("seller.finance.withdraw_modal.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? t("seller.finance.withdraw_modal.submitting") : t("seller.finance.withdraw_modal.submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}




