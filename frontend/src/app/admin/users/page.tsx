"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { 
  Users, Search, Filter, ShieldAlert, MoreVertical, 
  Trash2, Eye, MessageCircle, X, Store, Mail, Phone, 
  Calendar, CheckCircle2, AlertCircle, Ban, ArrowUpRight, UserCheck,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { token, user: loggedInUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleBanUser = async (u: any) => {
    if (!token) return;
    const reason = prompt(t("admin.users_manage.ban_reason_prompt"));
    if (reason === null) return;

    try {
      await axios.put(`${API_URL}/admin/users/${u.id}/ban`, { ban_reason: reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(pagination.current_page);
      if (showDetail) viewUserDetails(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || t("admin.users_manage.ban_failed"));
    }
  };

  const handleUnbanUser = async (u: any) => {
    if (!token) return;
    if (!confirm(t("admin.users_manage.confirm_unban"))) return;

    try {
      await axios.put(`${API_URL}/admin/users/${u.id}/unban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(pagination.current_page);
      if (showDetail) viewUserDetails(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || t("admin.users_manage.unban_failed"));
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
    <div className="p-6 md:p-10 space-y-10 bg-background max-w-7xl mx-auto overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/50 pb-8 gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Users size={20} strokeWidth={2.5} />
             </div>
              <Badge variant="outline" className="font-black text-[9px] tracking-widest uppercase py-0.5 px-2 bg-background border-border/50">
                 {t("admin.users_manage.identity_core")}
              </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground">{t("admin.users_nav")}</h1>
          <p className="text-muted-foreground font-bold text-[10px] uppercase opacity-70 tracking-widest mt-2">{t("admin.users_manage.desc")}</p>
        </div>
        <Card className="bg-primary/5 px-8 py-5 border-primary/20 flex flex-col items-center hover:scale-105 transition-all group">
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{t("admin.users_manage.total_users")}</p>
            <p className="text-3xl font-black text-primary">{pagination.total}</p>
        </Card>
      </div>

      {/* 2. Toolbar */}
      <Card className="p-4 border-border/50 shadow-sm rounded-3xl bg-muted/5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 lg:col-span-9 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                  placeholder={t("admin.users_manage.search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-14 bg-background border-transparent focus:border-primary/30 rounded-2xl font-bold transition-all"
              />
          </div>
          <div className="md:col-span-4 lg:col-span-3">
              <Select value={roleFilter} onValueChange={(v: unknown) => setRoleFilter(v as string)}>
                <SelectTrigger className="h-14 bg-background border-transparent focus:border-primary/30 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-none">
                  <SelectValue>
                    {roleFilter === "1" ? t("roles.admin") : 
                     roleFilter === "2" ? t("roles.seller") : 
                     roleFilter === "3" ? t("roles.customer") : 
                     t("admin.users_manage.all_roles")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 backdrop-blur-xl">
                  <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("admin.users_manage.all_roles")}
                  </SelectItem>
                  <SelectItem value="1" className="font-bold uppercase text-[10px] tracking-widest text-red-500 leading-none py-3">
                    {t("roles.admin")}
                  </SelectItem>
                  <SelectItem value="2" className="font-bold uppercase text-[10px] tracking-widest text-blue-500 leading-none py-3">
                    {t("roles.seller")}
                  </SelectItem>
                  <SelectItem value="3" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("roles.customer")}
                  </SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>
      </Card>

      {/* 3. Data Table */}
      <Card className="border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-[#FBFCFD] dark:bg-slate-900 text-muted-foreground font-black border-b border-border/50">
                    <tr>
                        <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px]">{t("admin.users_manage.user_email")}</th>
                        <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px]">{t("admin.users_manage.user_role")}</th>
                        <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px]">{t("admin.users_manage.user_status")}</th>
                        <th className="hidden sm:table-cell px-8 py-6 uppercase tracking-[0.2em] text-[10px] text-right">{t("admin.users_manage.joined_date")}</th>
                    </tr>
                </thead>
              <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-20 text-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-32 text-center opacity-30 select-none"><Users size={64} className="mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-[0.2em]">{t("admin.users_manage.no_users_found")}</p></td></tr>
                  ) : users.map((u) => (
                      <tr 
                        key={u.id} 
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => viewUserDetails(u.id)}
                      >
                          <td className="px-8 py-5 border-b border-border/5 dark:border-white/5">
                              <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center font-black text-lg text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white shrink-0">
                                      {u.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                      <p className="font-black text-[13px] uppercase tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight truncate max-w-[200px]">{u.name}</p>
                                      <p className="text-[10px] font-bold text-muted-foreground mt-1 opacity-70 truncate max-w-[200px]">{u.email}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="px-8 py-5 border-b border-border/5 dark:border-white/5">
                              <span className={`px-3 py-1 border rounded-lg font-black text-[9px] tracking-widest uppercase transition-all ${getRoleBadge(u.role_id)}`}>
                                {getRoleLabel(u.role?.slug)}
                              </span>
                          </td>
                          <td className="px-8 py-5 border-b border-border/5 dark:border-white/5">
                              <Badge 
                                variant={u.status === 'banned' ? "destructive" : "secondary"}
                                className="px-2 py-0.5 font-black text-[9px] tracking-widest uppercase rounded-lg"
                              >
                                 {u.status === 'banned' ? t("admin.users_manage.status_banned") : t("admin.users_manage.status_active")}
                               </Badge>
                          </td>
                          <td className="hidden sm:table-cell px-8 py-5 text-right border-b border-border/5 dark:border-white/5">
                              <div className="flex flex-col items-end">
                                  <span className="text-[11px] font-black text-foreground tabular-nums opacity-60">
                                    {format(new Date(u.created_at), "dd/MM/yyyy")}
                                  </span>
                                  <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40 tracking-widest mt-0.5">{t("admin.users_manage.joined_date")}</span>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && pagination.last_page > 1 && (
            <div className="px-8 py-8 bg-muted/10 border-t border-border/50 flex flex-col md:flex-row gap-6 items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {t("admin.users_manage.page_of", { current: pagination.current_page, total: pagination.last_page })}
                </span>
                <div className="flex gap-2">
                    {[...Array(pagination.last_page)].map((_, i) => (
                        <Button 
                            key={i} 
                            size="sm"
                            variant={pagination.current_page === i + 1 ? "default" : "outline"}
                            onClick={() => fetchUsers(i + 1)}
                            className={cn("h-10 w-10 rounded-xl font-black text-xs transition-all", pagination.current_page === i + 1 ? "shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground")}
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
            </div>
          )}
      </Card>

      {/* 4. MODAL USER - REVERTED TO ABSOLUTE BASELINE "KHUNG FORM" LAYOUT */}
      <AnimatePresence>
        {showDetail && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               transition={{ duration: 0.15 }}
               onClick={() => setShowDetail(false)}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            
            <motion.div
               initial={{ scale: 0.98, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.98, opacity: 0, y: 10 }}
               transition={{ duration: 0.2, ease: "circOut" }}
               className="relative w-full max-w-2xl bg-card border border-border/50 shadow-2xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]"
            >
               {/* Modal Header - EXACT BASELINE STRUCTURE */}
               <div className="p-6 md:p-8 border-b border-border/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                     <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center font-bold text-3xl text-primary border border-primary/20 shrink-0">
                         {selectedUser.name?.charAt(0).toUpperCase()}
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-foreground truncate">{selectedUser.name}</h2>
                        <div className="flex items-center gap-3 mt-2">
                           <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] tracking-widest uppercase border ${getRoleBadge(selectedUser.role_id)}`}>
                              {getRoleLabel(selectedUser.role?.slug)}
                           </span>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">UID #{selectedUser.id}</span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="p-3 hover:bg-muted rounded-full transition-colors shrink-0 outline-none">
                     <X size={24} className="text-muted-foreground" />
                  </button>
               </div>

               {/* Modal Content - EXACT BASELINE 2-COLUMN GRID */}
               <div className="p-4 md:p-8 overflow-y-auto space-y-10 custom-scrollbar flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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
                                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">{t("profile_page.email")}</p>
                                    <p className="font-bold truncate text-sm">{selectedUser.email}</p>
                                 </div>
                              </div>
                              {selectedUser.role_id !== 1 && (
                                <div className="flex items-center gap-4 group">
                                   <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                      <Phone size={18} />
                                   </div>
                                   <div className="min-w-0 flex-1">
                                       <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">{t("profile_page.phone")}</p>
                                       <p className="font-bold text-sm">{selectedUser.profile?.phone || t("common.no_data")}</p>
                                   </div>
                                </div>
                              )}
                              <div className="flex items-center gap-4 group">
                                 <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                    <Calendar size={18} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">{t("admin.joined")}</p>
                                    <p className="font-bold text-sm">{format(new Date(selectedUser.created_at), "eeee, dd/MM/yyyy", { locale: currentLocale })}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Addresses Column */}
                     {selectedUser.role_id !== 1 && (
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
                                    <p className="text-[10px] font-bold text-muted-foreground mt-1 truncate">{addr.city}, {addr.country}</p>
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
                      )}
                  </div>
               </div>

               {/* Modal Footer Actions - BASELINE SCHEME */}
               <div className="p-8 border-t border-border/50 bg-muted/5 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                     {selectedUser.id !== loggedInUser?.id && (
                       <Link 
                          href={`/admin/inbox?userId=${selectedUser.id}`}
                          className="flex-1"
                       >
                          <Button className="w-full h-14 text-[10px] tracking-widest" variant="outline">
                            <MessageCircle size={18} className="mr-2" /> {t("admin.users_manage.chat_with_user")}
                          </Button>
                       </Link>
                     )}
                     {selectedUser.id !== loggedInUser?.id && (
                        <Button 
                           onClick={() => selectedUser.status === 'banned' ? handleUnbanUser(selectedUser) : handleBanUser(selectedUser)}
                           variant={selectedUser.status === 'banned' ? "default" : "secondary"}
                           className="flex-1 h-14 text-[10px] tracking-widest"
                        >
                           {selectedUser.status === 'banned' ? <UserCheck size={18} className="mr-2" /> : <Ban size={18} className="mr-2" />}
                           {selectedUser.status === 'banned' ? t("admin.users_manage.unban_user") : t("admin.users_manage.ban_user")}
                        </Button>
                       )}
                    </div>
                    {selectedUser.id !== loggedInUser?.id && selectedUser.role_id !== 1 && (
                        <Button 
                           onClick={() => alert(t("admin.users_manage.delete_restricted"))}
                           variant="destructive"
                           className="h-14 text-[10px] tracking-widest opacity-20 hover:opacity-100 transition-all font-black uppercase"
                        >
                           <Trash2 size={18} className="mr-2" /> {t("admin.users_manage.delete_user")}
                        </Button>
                    )}
                 </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
