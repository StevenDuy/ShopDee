"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { 
  Users, Search, Filter, ShieldAlert, MoreVertical, 
  Trash2, Eye, MessageCircle, X, Store, Mail, Phone, 
  Calendar, CheckCircle2, AlertCircle, Ban, ArrowUpRight
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { token, user: loggedInUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const fetchUsers = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          search: search || undefined,
          role_id: roleFilter !== "all" ? roleFilter : undefined
        }
      });
      setUsers(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total
      });
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [token, roleFilter, search]);

  const viewUserDetails = async (id: number) => {
    if (!token) return;
    try {
        setLoadingDetail(true);
        const res = await axios.get(`${API_URL}/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedUser(res.data);
        setShowDetail(true);
    } catch (err) {
        console.error("Failed to fetch user details", err);
    } finally {
        setLoadingDetail(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!token) return;
    if (u.id === loggedInUser?.id) {
       alert(t("admin.users_manage.self_delete_error"));
       return;
    }
    if (!confirm(t("admin.users_manage.confirm_delete", { name: u.name }))) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/users/${u.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(pagination.current_page);
      if (showDetail) setShowDetail(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleBadge = (roleId: number) => {
    switch (roleId) {
        case 1: return "bg-red-500/10 text-red-500 border-red-500/20";
        case 2: return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        case 3: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getRoleLabel = (slug: string) => {
    return t(`roles.${slug || 'customer'}`).toUpperCase();
  };

  const currentLocale = i18n.language === 'vi' ? vi : enUS;

  return (
    <div className="p-6 md:p-10 space-y-10 bg-background max-w-7xl mx-auto overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center border-b-4 md:border-b-8 border-primary pb-6 md:pb-8 gap-4 px-2">
        <div className="text-wrap">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight">{t("admin.users_nav")}</h1>
          <p className="text-muted-foreground font-bold text-[10px] md:text-xs uppercase opacity-60 tracking-[0.2em] mt-2 md:mt-3 px-4">{t("admin.users_manage.desc")}</p>
        </div>
        <div className="bg-primary/5 px-6 md:px-8 py-3 md:py-4 border-2 border-primary/20 flex flex-col items-center">
            <p className="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest mb-0.5 md:1">{t("admin.users_manage.total_users")}</p>
            <p className="text-xl md:text-2xl font-black">{pagination.total}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-card border-2 border-border p-4">
          <div className="md:col-span-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all" size={20} />
              <input 
                  type="text" 
                  placeholder={t("admin.users_manage.search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:border-primary focus:bg-background outline-none font-bold text-sm transition-all"
              />
          </div>
          <div className="md:col-span-4 flex items-center gap-2 text-wrap w-full">
              <Filter size={20} className="text-muted-foreground ml-2 shrink-0" />
              <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex-1 w-full bg-muted/30 border-2 border-transparent focus:border-primary px-4 py-3 outline-none font-black uppercase text-xs tracking-widest cursor-pointer transition-all truncate"
              >
                  <option value="all">{t("admin.users_manage.all_roles")}</option>
                  <option value="1">{t("roles.admin").toUpperCase()}</option>
                  <option value="2">{t("roles.seller").toUpperCase()}</option>
                  <option value="3">{t("roles.customer").toUpperCase()}</option>
              </select>
          </div>
      </div>

      {/* Seller-style Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                        <th className="px-4 md:px-6 py-4 font-semibold uppercase tracking-wider text-[10px] md:text-[11px]">{t("admin.users_manage.user_email")}</th>
                        <th className="px-4 md:px-6 py-4 font-semibold uppercase tracking-wider text-[10px] md:text-[11px]">{t("admin.users_manage.user_role")}</th>
                        <th className="hidden sm:table-cell px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">{t("admin.users_manage.joined_date")}</th>
                    </tr>
                </thead>
              <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                         <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                         <p className="text-[10px] font-bold uppercase opacity-40">{t("loading")}</p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground">
                         <Users size={40} className="mx-auto mb-3 opacity-20" />
                         <p className="text-xs font-bold uppercase">{t("admin.users_manage.no_users_found")}</p>
                      </td>
                    </tr>
                  ) : users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/40 transition-colors group cursor-pointer" onClick={() => viewUserDetails(u.id)}>
                          <td className="px-4 md:px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 md:w-12 md:h-12 border border-border bg-muted flex items-center justify-center font-black text-base md:text-lg shrink-0 rounded-xl transition-all group-hover:bg-primary group-hover:text-white">
                                      {u.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                      <p className="font-bold text-xs md:text-sm uppercase leading-tight truncate max-w-[120px] md:max-w-none">{u.name}</p>
                                      <p className="text-[9px] md:text-[10px] font-medium text-muted-foreground mt-1 truncate max-w-[120px] md:max-w-none">{u.email}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                              <span className={`px-2 md:px-3 py-1 border rounded-lg font-black text-[8px] md:text-[9px] tracking-widest uppercase transition-all ${getRoleBadge(u.role_id)}`}>
                                  {getRoleLabel(u.role?.slug)}
                              </span>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4">
                              <div className="flex flex-col">
                                  <span className="text-xs font-bold font-mono">
                                    {format(new Date(u.created_at), "dd/MM/yyyy")}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">{t("admin.users_manage.joined_date")}</span>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && pagination.last_page > 1 && (
              <div className="px-4 md:px-6 py-4 md:py-5 bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-border">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
                      {t("admin.users_manage.page_of", { current: pagination.current_page, total: pagination.last_page })}
                  </span>
                  <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-hide">
                      {[...Array(pagination.last_page)].map((_, i) => (
                          <button 
                              key={i} 
                              onClick={() => fetchUsers(i + 1)}
                              className={`w-8 h-8 md:w-10 md:h-10 border-2 font-black transition-all shrink-0 ${pagination.current_page === i + 1 ? "bg-primary text-white border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" : "bg-background border-border hover:border-primary"}`}
                          >
                              {i + 1}
                          </button>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowDetail(false)}
               className="absolute inset-0 bg-background/80 backdrop-blur-sm shadow-[inset_0px_0px_100px_rgba(0,0,0,0.2)]" 
            />
            
            <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-4xl bg-card border-4 border-border shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[95vh]"
            >
               {/* Modal Header */}
               <div className="p-4 md:p-6 border-b-4 border-border bg-muted flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                     <div className="w-16 h-16 border-4 border-border bg-background flex items-center justify-center font-black text-2xl text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                         {selectedUser.name?.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{selectedUser.name}</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                           <span className={`px-2 py-0.5 border-2 font-black text-[9px] tracking-widest uppercase ${getRoleBadge(selectedUser.role_id)}`}>
                              {getRoleLabel(selectedUser.role?.slug)}
                           </span>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase">UID: {selectedUser.id}</span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="self-end sm:self-auto p-2 md:p-3 border-2 border-border hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none">
                     <X size={20} className="md:w-6 md:h-6" />
                  </button>
               </div>

               {/* Modal Content */}
               <div className="p-4 md:p-8 overflow-y-auto space-y-10 custom-scrollbar">
                  
                  {/* Grid Layout Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     {/* Information Columns */}
                     <div className="space-y-8">
                        <div>
                           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                             <CheckCircle2 size={12} className="text-primary" />
                             {t("admin.users_manage.customer_info")}
                           </p>
                           <div className="space-y-4 text-wrap">
                              <div className="flex items-center gap-4 group">
                                 <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                    <Mail size={18} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase">{t("profile_page.email")}</p>
                                    <p className="font-bold truncate">{selectedUser.email}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 group">
                                 <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                    <Phone size={18} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <p className="text-[10px] font-black opacity-40 uppercase">{t("profile_page.phone")}</p>
                                     <p className="font-bold">{selectedUser.profile?.phone || t("common.no_data")}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 group">
                                 <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                    <Calendar size={18} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase">{t("admin.joined")}</p>
                                    <p className="font-bold">{format(new Date(selectedUser.created_at), "eeee, dd/MM/yyyy", { locale: currentLocale })}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {selectedUser.role_id === 2 && (
                           <div>
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                                <Store size={12} className="text-purple-500" />
                                {t("admin.users_manage.seller_info")}
                              </p>
                              <div className="p-4 border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-sm overflow-hidden">
                                  <p className="text-xs font-bold opacity-70 uppercase leading-relaxed text-wrap">
                                      {selectedUser.profile?.bio || t("common.no_data")}
                                  </p>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Addresses Column */}
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                          <AlertCircle size={12} className="text-blue-500" />
                          {t("profile_page.my_addresses")}
                        </p>
                        <div className="space-y-3">
                           {selectedUser.addresses?.length > 0 ? selectedUser.addresses.map((addr: any) => (
                              <div key={addr.id} className="p-4 border-2 border-border bg-muted/20 relative group overflow-hidden text-wrap">
                                 <div className="absolute top-0 right-0 p-1.5 bg-border text-[8px] font-black uppercase text-white tracking-widest">{addr.type}</div>
                                 <p className="text-sm font-bold truncate pr-10">{addr.address_line_1}</p>
                                 <p className="text-xs text-muted-foreground mt-1 truncate">{addr.city}, {addr.country}</p>
                                 {addr.is_default && (
                                   <div className="mt-2 inline-block px-2 py-0.5 border border-primary text-[8px] font-black uppercase text-primary tracking-tighter">{t("profile_page.default")}</div>
                                 )}
                              </div>
                           )) : (
                               <div className="p-10 border-2 border-dashed border-border text-center opacity-40">
                                  <p className="text-xs font-black uppercase">{t("profile_page.no_addresses")}</p>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Modal Footer Actions */}
               <div className="p-4 md:p-8 border-t-4 border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                     <Link 
                        href={`/admin/inbox?userId=${selectedUser.id}`}
                        className="flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                     >
                        <MessageCircle size={18} />
                        {t("admin.users_manage.chat_with_user")}
                     </Link>
                     {selectedUser.id !== loggedInUser?.id && (
                        <button className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(30,41,59,0.2)] active:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                           <Ban size={18} />
                           {t("admin.users_manage.ban_user")}
                        </button>
                      )}
                   </div>
                   
                   {selectedUser.id !== loggedInUser?.id && selectedUser.role_id !== 1 && (
                      <button 
                         onClick={() => handleDeleteUser(selectedUser)}
                         className="flex items-center justify-center gap-3 border-2 border-red-500 text-red-500 px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(239,68,68,0.1)]"
                      >
                         <Trash2 size={18} />
                         {t("admin.users_manage.delete_user")}
                      </button>
                   )}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-left: 2px solid #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; }
      `}</style>
    </div>
  );
}
