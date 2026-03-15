"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Eye, Filter, CheckCircle, Package, Truck, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { OrderDetailsModal } from "@/components/seller/OrderDetailsModal";

const API = "http://localhost:8000/api";

type OrderItem = {
  id: number;
  quantity: number;
  unit_price: number;
  product: {
    title: string;
    media: { url: string }[];
  };
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
  };
  items: OrderItem[];
};

export default function SellerOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewingOrder, setViewingOrder] = useState<number | null>(null);

  const fetchOrders = (status = "all") => {
    if (!token) return;
    setLoading(true);
    axios.get(`${API}/seller/orders${status !== 'all' ? `?status=${status}` : ''}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => setOrders(res.data.data || []))
      .catch(err => console.error("Error fetching orders", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders(filter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  const updateOrderStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await axios.put(`${API}/seller/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh list
      fetchOrders(filter);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Status update failed.");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600",
      processing: "bg-blue-500/10 text-blue-600",
      shipped: "bg-indigo-500/10 text-indigo-600",
      delivered: "bg-green-500/10 text-green-600",
      cancelled: "bg-destructive/10 text-destructive",
      returned: "bg-gray-500/10 text-gray-600",
    };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and fulfill your customer orders.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-muted-foreground" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-input border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-auto"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="return_requested">Return Requested</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Package size={48} className="opacity-20 mb-3" />
                      <p>No orders found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customerName = order.customer.name || order.customer.email;
                  
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-medium">
                        #{order.id.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{customerName}</span>
                        <span className="block text-xs text-muted-foreground">{order.items.length} items</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {order.status === 'pending' && (
                          <button onClick={() => updateOrderStatus(order.id, 'processing')} title="Approve Order"
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors inline-block">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button onClick={() => updateOrderStatus(order.id, 'shipped')} title="Mark as Shipped"
                            className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors inline-block">
                            <Truck size={18} />
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} title="Cancel Order"
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors inline-block">
                            <XCircle size={18} />
                          </button>
                        )}
                        {/* More status transitions can be added here */}

                        <button onClick={() => setViewingOrder(order.id)} title="View Details"
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-block">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingOrder && (
        <OrderDetailsModal 
          orderId={viewingOrder} 
          onClose={() => setViewingOrder(null)} 
          onStatusChange={updateOrderStatus} 
        />
      )}
    </div>
  );
}
