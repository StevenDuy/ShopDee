"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { User, Package, MapPin, Lock, CheckCircle, Truck, Clock, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface Profile { id: number; name: string; email: string; profile?: { phone?: string; bio?: string } }
interface Address { id: number; type: string; address_line_1: string; city: string; country: string; is_default: boolean }
interface Order {
  id: number; total_amount: number; status: string; payment_method: string; created_at: string;
  items: { id: number; quantity: number; unit_price: number; product: { title: string; media: { url: string }[] } }[];
}

const API = "http://localhost:8000/api";
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipping:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TABS = [
  { id: "info",      label: "Profile Info", icon: User },
  { id: "addresses",label: "Addresses",    icon: MapPin },
  { id: "password", label: "Password",     icon: Lock },
];

export default function ProfilePage() {
  const router  = useRouter();
  const { token, user: authUser, logout } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "info");

  useEffect(() => {
    if (tabFromUrl && TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders,    setOrders]    = useState<Order[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [curPw, setCurPw] = useState(""); const [newPw, setNewPw] = useState(""); const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    axios.get(`${API}/profile`, { headers: authHeaders }).then((r) => {
      setProfile(r.data); setName(r.data.name); setPhone(r.data.profile?.phone ?? ""); setBio(r.data.profile?.bio ?? "");
    });
    axios.get(`${API}/profile/addresses`, { headers: authHeaders }).then((r) => setAddresses(r.data));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, { name, phone, bio }, { headers: authHeaders });
      setSaveMsg("Profile updated!");
    } catch { setSaveMsg("Failed to update."); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confPw) { setPwMsg("Passwords do not match."); return; }
    try {
      await axios.post(`${API}/profile/change-password`, { current_password: curPw, password: newPw, password_confirmation: confPw }, { headers: authHeaders });
      setPwMsg("Password changed! Please log in again."); setTimeout(() => { logout(); router.push("/login"); }, 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPwMsg(e.response?.data?.message ?? "Failed.");
    }
  };

  const handleDeleteAddress = async (id: number) => {
    await axios.delete(`${API}/profile/addresses/${id}`, { headers: authHeaders });
    setAddresses(a => a.filter(addr => addr.id !== id));
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen px-6 md:px-10 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-black">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Info */}
      {activeTab === "info" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium mb-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div><label className="block text-sm font-medium mb-2">Email</label>
              <input value={profile.email} disabled className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm opacity-60 cursor-not-allowed" /></div>
            <div><label className="block text-sm font-medium mb-2">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-2">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
          {saveMsg && <p className={`text-sm ${saveMsg.includes("!") ? "text-green-600" : "text-destructive"}`}>{saveMsg}</p>}
          <button onClick={handleSaveProfile} disabled={saving}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>
      )}



      {/* Addresses */}
      {activeTab === "addresses" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-primary" />
                  <span className="font-medium capitalize">{addr.type}</span>
                  {addr.is_default && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <p className="text-sm">{addr.address_line_1}</p>
                <p className="text-sm text-muted-foreground">{addr.city}, {addr.country}</p>
              </div>
              <button onClick={() => handleDeleteAddress(addr.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"><X size={16} /></button>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
              <MapPin size={40} className="mx-auto mb-3 opacity-30" />
              <p>No saved addresses yet</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Change Password */}
      {activeTab === "password" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <form onSubmit={handleChangePassword} className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-md">
            <h2 className="font-semibold text-lg">Change Password</h2>
            {["Current Password", "New Password", "Confirm New Password"].map((label, i) => {
              const val  = [curPw, newPw, confPw][i];
              const set  = [setCurPw, setNewPw, setConfPw][i];
              return (
                <div key={label}><label className="block text-sm font-medium mb-2">{label}</label>
                  <input type="password" value={val} onChange={(e) => set(e.target.value)} required
                    className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              );
            })}
            {pwMsg && <p className={`text-sm ${pwMsg.includes("!") ? "text-green-600" : "text-destructive"}`}>{pwMsg}</p>}
            <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
              Update Password
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
