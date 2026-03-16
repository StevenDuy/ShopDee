"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Store, MapPin, Phone, Mail, User, Save, Upload, Trash2, Plus, Edit2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import AddressModal from "@/components/profile/AddressModal";
import { useTranslation } from "react-i18next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function SellerSettingsPage() {
  const { t } = useTranslation();
  const { token, user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
  });

  const [addresses, setAddresses] = useState<any[]>([]);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setFormData({
        name: data.name || "",
        phone: data.profile?.phone || "",
        bio: data.profile?.bio || "",
      });
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      await axios.put(`${API_URL}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: "success", text: t("seller.settings.update_success") });
      fetchUser(); // refresh user store
    } catch (err: any) {
      setMessage({ type: "error", text: t("seller.settings.update_error") });
    } finally {
      setSaving(false);
    }
  };

  const openAddressModal = (addr: any = null) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };


  const handleDeleteAddress = async (id: number) => {
    if (!token || !confirm(t("seller.settings.delete_confirm"))) return;
    try {
      await axios.delete(`${API_URL}/profile/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error("Failed to delete address", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("seller.settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("seller.settings.desc")}</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
              <Store className="text-primary" size={20} />
              <h2 className="text-lg font-bold">{t("seller.settings.store_details")}</h2>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("seller.settings.store_name")} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("seller.settings.store_name")}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t("seller.settings.service_phone")}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t("seller.settings.store_bio")}</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-y"
                  placeholder={t("seller.settings.store_bio_placeholder")}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? t("seller.settings.saving") : t("seller.settings.save_changes")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Addresses Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="text-primary" size={20} />
                <h2 className="text-lg font-bold">{t("seller.settings.addresses")}</h2>
              </div>
              <button 
                onClick={() => openAddressModal()}
                className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                title={t("seller.settings.add_address")}
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <MapPin size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("seller.settings.no_addresses")}</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="relative p-4 border border-border rounded-xl hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                       <span className="inline-block px-2 py-0.5 bg-accent text-xs font-semibold rounded-md uppercase tracking-wider text-muted-foreground">
                         {addr.type}
                       </span>
                       {addr.is_default ? (
                         <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t("profile_page.default")}</span>
                       ) : null}
                    </div>
                    <p className="text-sm font-medium mt-2">{addr.address_line_1}</p>
                    <p className="text-xs text-muted-foreground mt-1">{addr.city}, {addr.country}</p>
                    
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => openAddressModal(addr)} className="p-1.5 bg-background shadow-sm border border-border rounded-md text-muted-foreground hover:text-primary">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 bg-background shadow-sm border border-border rounded-md text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={() => fetchData()}
        token={token}
        address={editingAddress}
      />
    </div>
  );
}
