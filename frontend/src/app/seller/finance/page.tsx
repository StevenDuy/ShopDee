"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, Building, Plus, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

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
  const { token, user } = useAuthStore();
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
      setTransactions(res.data.transactions.data);
    } catch (err) {
      console.error("Failed to fetch finance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [token]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum < 10) {
      setError("Minimum withdrawal amount is $10.00");
      return;
    }

    if (amountNum > (overview?.available_balance || 0)) {
       setError("Amount exceeds available balance.");
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
      setError(err.response?.data?.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
          <p className="text-muted-foreground mt-1">Manage your revenue, withdrawals, and transactions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={!overview || overview.available_balance < 10}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Building size={18} />
          Request Withdrawal
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
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <h3 className="text-2xl font-bold mt-1 text-green-500">{formatCurrency(overview.available_balance)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Clearance</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(overview.pending_clearance)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(overview.total_revenue)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <ArrowDownRight size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Withdrawn</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(overview.total_withdrawn)}</h3>
              </div>
            </div>
            {overview.pending_withdrawal > 0 && (
              <p className="text-xs text-amber-500 mt-3 font-medium flex items-center gap-1">
                <Clock size={12} />
                +{formatCurrency(overview.pending_withdrawal)} pending
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      {tx.description || (tx.type === 'credit' ? 'Order Revenue' : 'Withdrawal')}
                    </td>
                    <td className="px-6 py-4">
                      {tx.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          <ArrowDownRight size={12} /> Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                          <ArrowUpRight size={12} /> Debit
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed' 
                          ? 'bg-blue-500/10 text-blue-500' 
                          : 'bg-amber-500/10 text-amber-500'
                       }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                       </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-foreground'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
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
              <h3 className="text-lg font-bold">Request Withdrawal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWithdraw} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Available Balance</label>
                <div className="p-3 bg-muted rounded-xl text-lg font-bold text-green-500">
                  {formatCurrency(overview?.available_balance || 0)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Withdrawal Amount ($)</label>
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
                <label className="block text-sm font-medium mb-1.5">Bank Name</label>
                <input 
                  type="text" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Chase Bank, Vietcombank"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Account Number / IBAN</label>
                <input 
                  type="text" 
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter full account details"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
