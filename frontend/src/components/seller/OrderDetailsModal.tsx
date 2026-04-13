import { useEffect, useState } from "react";
import axios from "axios";
import { X, Package, Truck, Calendar, MapPin, User, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type OrderItem = {
  id: number;
  quantity: number;
  unit_price: number;
  product_id: number;
  product: {
    title: string;
    media: { url: string; full_url: string }[];
  };
};

type Order = {
  id: number;
  customer_id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  notes?: string;
  customer: {
    name: string;
    profile?: { phone: string };
    email: string;
  };
  shippingAddress?: {
    address_line_1: string;
    address_line_2?: string;
    address_line1?: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  shipping_address?: {
    address_line_1: string;
    address_line_2?: string;
    address_line1?: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: OrderItem[];
};

interface OrderDetailsModalProps {
  orderId: number;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}

export function OrderDetailsModal({ orderId, onClose, onStatusChange }: OrderDetailsModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/seller/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const data = res.data;
        // Fix potential field mapping issues from API
        if (data.payment_method) {
          data.payment_method = data.payment_method.replace(/_/g, ' ');
        }
        setOrder(data);
      })
      .catch((err: unknown) => console.error("Failed to fetch order details", err))
      .finally(() => setLoading(false));
  }, [orderId, token]);

  const handleUpdateStatus = (status: string) => {
    onStatusChange(orderId, status);
  };

  if (loading || !order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
      </div>
    );
  }

  const customerName = order.customer.name || order.customer.email;

  const phone = order.customer.profile?.phone || "N/A";

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600';
      case 'processing': return 'bg-blue-500/10 text-blue-600';
      case 'shipped': return 'bg-indigo-500/10 text-indigo-600';
      case 'delivered': return 'bg-green-500/10 text-green-600';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      case 'returned': return 'bg-gray-500/10 text-gray-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card/40 backdrop-blur-xl w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[3rem] shadow-2xl shadow-black/20 overflow-hidden border border-border/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 md:p-10 border-b border-border/10 bg-muted/5">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-3xl font-black uppercase tracking-tighter">
                 {t("seller.orders.order_id")} #{order.id.toString().padStart(6, '0')}
               </h2>
                {getStatusBadge(order.status, t)}
            </div>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest opacity-40">
              <span className="flex items-center gap-2"><Calendar size={14} strokeWidth={2.5} className="text-primary"/> {format(new Date(order.created_at), 'PPP p')}</span>
              <span className="flex items-center gap-2 text-foreground"><CheckCircle size={14} strokeWidth={2.5} className="text-emerald-500"/> {order.payment_method.toUpperCase()}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-muted/20 hover:bg-muted rounded-2xl flex items-center justify-center text-muted-foreground transition-all active:scale-90">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/10 border-b border-border/10">
            
            {/* Customer Info */}
            <div className="p-8 space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-3"><User size={16} strokeWidth={2.5} className="text-primary"/> {t("seller.orders.customer")}</h3>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-tight">{customerName}</p>
                <p className="text-[11px] font-bold text-muted-foreground italic break-all">{order.customer.email}</p>
                <p className="text-[11px] font-bold text-muted-foreground opacity-60">{phone}</p>
              </div>
              <button 
                onClick={() => {
                  router.push(`/seller/inbox?userId=${order.customer_id}`);
                }}
                className="w-full flex items-center justify-center gap-3 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5 active:scale-95"
              >
                <MessageSquare size={16} strokeWidth={2.5} />
                {t("inbox.say_something")}
              </button>
            </div>

            {/* Shipping Info */}
            <div className="p-8 space-y-6 md:col-span-2">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-3"><MapPin size={16} strokeWidth={2.5} className="text-primary"/> {t("seller.settings.addresses")}</h3>
                <div className="space-y-1">
                   {(() => {
                      const addr = order.shippingAddress || order.shipping_address;
                      if (!addr) return <p className="text-sm font-black text-muted-foreground italic opacity-40">N/A</p>;
                      
                      const line1 = addr.address_line_1 || addr.address_line1;
                      const line2 = addr.address_line_2 || addr.address_line2;

                      return (
                        <>
                           <p className="text-sm font-black uppercase tracking-tight">{line1}</p>
                           {line2 && <p className="text-[11px] font-bold text-muted-foreground opacity-60">{line2}</p>}
                           <p className="text-[11px] font-bold text-muted-foreground opacity-60 uppercase">{addr.city}, {addr.state} {addr.postal_code}</p>
                           <p className="text-[11px] font-black text-primary/80 uppercase tracking-widest">{addr.country}</p>
                        </>
                      );
                   })()}
                </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-8 md:p-10 space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-3"><Package size={16} strokeWidth={2.5} className="text-primary"/> {t("seller.orders.items")}</h3>
            <div className="border border-border/10 rounded-[2rem] bg-muted/5 overflow-hidden">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-muted/10 border-b border-border/5">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] opacity-40">{t("seller.finance.description")}</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] opacity-40">{t("seller.finance.amount")}</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] opacity-40 text-center">{t("seller.orders.items")}</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] opacity-40 text-right">{t("seller.orders.total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  {order.items.map((item: OrderItem) => (
                    <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-muted/20 rounded-2xl overflow-hidden border border-border/10 shrink-0 shadow-sm">
                              {item.product.media && item.product.media.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.product.media[0].full_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-20"><Package size={20}/></div>
                              )}
                            </div>
                            <span className="text-sm font-black uppercase tracking-tight truncate max-w-[200px]">{item.product.title}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold tabular-nums opacity-60">
                        {formatPrice(item.unit_price)}
                      </td>
                      <td className="px-6 py-5 font-black text-sm text-center tabular-nums">x{item.quantity}</td>
                      <td className="px-6 py-5 text-right font-black text-sm tabular-nums text-primary">
                        {formatPrice(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end p-4">
              <div className="w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest opacity-40">
                  <span>{t("seller.finance.amount")}</span>
                  <span className="tabular-nums font-bold tracking-tight text-foreground opacity-100">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest opacity-40">
                  <span>{t("seller.orders.shipping_cost")}</span>
                  <span className="tabular-nums text-emerald-500 opacity-100 italic">{t("seller.orders.free")}</span>
                </div>
                <div className="pt-6 border-t border-border/10 flex justify-between items-center">
                  <span className="font-black text-[10px] uppercase tracking-[0.3em] opacity-30">{t("seller.orders.total")}</span>
                  <span className="font-black text-3xl tabular-nums text-primary tracking-tighter">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="p-6 bg-amber-500/5 text-amber-700 border border-amber-500/10 rounded-[2rem] text-xs font-bold italic shadow-inner">
                <span className="font-black uppercase tracking-widest not-italic mr-2 opacity-40 text-[9px]">{t("seller.orders.customer_notes")}</span> {order.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-border/10 bg-muted/5 flex flex-wrap justify-end gap-4 items-center">
          {order.status === 'pending' && (
            <>
              <button onClick={() => { handleUpdateStatus('cancelled'); onClose(); }}
                className="h-12 px-6 border border-destructive/20 text-destructive bg-destructive/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all active:scale-95 flex items-center gap-3">
                <XCircle size={16} strokeWidth={2.5}/> {t("seller.orders.cancel_order")}
              </button>
              <button onClick={() => { handleUpdateStatus('processing'); onClose(); }}
                className="h-12 px-8 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5 active:scale-95 flex items-center gap-3">
                <CheckCircle size={16} strokeWidth={3}/> {t("seller.orders.approve_order")}
              </button>
            </>
          )}

          {order.status === 'processing' && (
            <button onClick={() => { handleUpdateStatus('shipped'); onClose(); }}
              className="bg-indigo-600 text-white h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3">
              <Truck size={17} strokeWidth={2.5}/> {t("seller.orders.mark_as_shipped")}
            </button>
          )}

          {order.status === 'shipped' && (
            <button onClick={() => { handleUpdateStatus('delivered'); onClose(); }}
              className="bg-green-600 text-white h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 active:scale-95 flex items-center gap-3">
              <CheckCircle size={17} strokeWidth={3}/> {t("seller.orders.status_delivered")}
            </button>
          )}

          <button type="button" onClick={onClose}
            className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 text-muted-foreground">
            {t("inbox.cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function getStatusBadge(status: string, t: any) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    returned: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };
  return (
    <Badge variant="outline" className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border", styles[status])}>
      {t(`seller.orders.status_${status}`)}
    </Badge>
  );
}



