"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Users, Search, Filter, ShieldAlert, MoreVertical, Trash2, Eye } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
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

  const handleDeleteUser = async (id: number, name: string) => {
    if (!token) return;
    if (id === user?.id) {
       alert(t("admin.users_manage.self_delete_error"));
       return;
    }
    if (!confirm(t("admin.users_manage.confirm_delete", { name }))) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh list
      fetchUsers(pagination.current_page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-7xl mx-auto"
      >
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.users")}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.users_manage.desc")}</p>
        </div>
        
        <div className="flex bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold items-center gap-2 justify-center sm:justify-start">
           <Users size={16} />
           {t("admin.users_manage.total_users")}: {pagination.total}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center whitespace-nowrap">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder={t("admin.users_manage.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl text-sm">
                <Filter size={16} className="text-muted-foreground" />
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent focus:outline-none min-w-[120px]"
                >
                  <option value="all">{t("admin.users_manage.all_roles")}</option>
                  <option value="1">{t("admin.users_manage.customers")}</option>
                  <option value="2">{t("admin.users_manage.sellers")}</option>
                  <option value="3">{t("admin.users_manage.admins")}</option>
                </select>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
               <Users size={48} className="mx-auto mb-4 opacity-20" />
               <p>{t("admin.users_manage.no_users_found")}</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">{t("admin.users_manage.user_email")}</th>
                  <th className="px-6 py-4 font-medium">{t("admin.role")}</th>
                  <th className="px-6 py-4 font-medium">{t("admin.joined_date")}</th>
                  <th className="px-6 py-4 font-medium text-right">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <p className="font-bold">{u.name}</p>
                           <p className="text-xs text-muted-foreground">{u.email}</p>
                           {u.profile?.phone && <p className="text-xs text-muted-foreground mt-0.5">{u.profile.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                           u.role_id === 1 ? 'bg-blue-500/10 text-blue-500' :
                           u.role_id === 2 ? 'bg-purple-500/10 text-purple-500' :
                           'bg-red-500/10 text-red-500'
                         }`}>
                           {t(`roles.${u.role?.slug || 'customer'}`)}
                         </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                       {format(new Date(u.created_at), t("locale") === "vi-VN" ? "dd/MM/yyyy" : "MMM d, yyyy", { 
                         locale: t("locale") === "vi-VN" ? vi : enUS 
                       })}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 bg-background shadow-sm border border-border rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            title={t("admin.users_manage.view_details")}
                          >
                            <Eye size={16} />
                          </button>
                          
                          {u.id !== user?.id && u.role_id !== 3 && (
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 bg-background shadow-sm border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                              title={t("admin.users_manage.delete_user")}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("admin.users_manage.page_of", { current: pagination.current_page, total: pagination.last_page })}
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[...Array(pagination.last_page)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => fetchUsers(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${pagination.current_page === i + 1 ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-background border border-border hover:bg-accent"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </motion.div>
    </div>
  );
}
