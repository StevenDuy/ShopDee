"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Users, Search, Filter, ShieldAlert, MoreVertical, Trash2, Eye } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminUsersPage() {
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
       alert("You cannot delete your own account.");
       return;
    }
    if (!confirm(`Are you sure you want to delete the user "${name}"? This action cannot be undone.`)) {
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">View, search, and manage all platform members.</p>
        </div>
        
        <div className="flex bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold items-center gap-2">
           <Users size={16} />
           Total Users: {pagination.total}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center whitespace-nowrap">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search users by name or email..."
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
                  <option value="all">All Roles</option>
                  <option value="1">Customers (1)</option>
                  <option value="2">Sellers (2)</option>
                  <option value="3">Admins (3)</option>
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
               <p>No users found matching your criteria.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">User / Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                           {u.role?.name || "Unknown"}
                         </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                       {format(new Date(u.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 bg-background shadow-sm border border-border rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {u.id !== user?.id && u.role_id !== 3 && (
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 bg-background shadow-sm border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete User"
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
              Page <b>{pagination.current_page}</b> of <b>{pagination.last_page}</b>
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
    </div>
  );
}
