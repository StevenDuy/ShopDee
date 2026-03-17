import { useEffect, useState } from "react";
import axios from "axios";
import { X, Package, Truck, Calendar, MapPin, User, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const API = "http://localhost:8000/api";

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
  shipping_address: {
    address_line1: string;
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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/seller/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res: { data: Order }) => setOrder(res.data))
      .catch((err: unknown) => console.error("Failed to fetch order details", err))
      .finally(() => setLoading(false));
  }, [orderId, token]);

  const handleUpdateStatus = (status: string) => {
    onStatusChange(orderId, status);
  };

  if (loading || !order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(t("locale"), { 
      style: "currency", 
      currency: t("currency_code") 
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {t("seller.orders.order_id")} #{order.id.toString().padStart(6, '0')}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(order.status)}`}>
                {t(`seller.orders.status_${order.status}`)}
              </span>
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Calendar size={14}/> {format(new Date(order.created_at), 'PPP p')}</span>
              <span className="flex items-center gap-1 font-medium text-foreground"><CheckCircle size={14} className="text-green-500"/> {order.payment_method.toUpperCase()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted text-muted-foreground rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">
            
            {/* Customer Info */}
            <div className="p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-foreground/80"><User size={18}/> {t("seller.orders.customer")}</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{customerName}</p>
                <p className="text-muted-foreground">{order.customer.email}</p>
                <p className="text-muted-foreground">{phone}</p>
              </div>
              <button 
                onClick={() => {
                  router.push(`/seller/inbox?userId=${order.customer_id}`);
                }}
                className="w-full flex items-center justify-center gap-2 mt-2 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
              >
                <MessageSquare size={14} />
                {t("inbox.say_something")}
              </button>
            </div>

            {/* Shipping Info */}
            <div className="p-6 space-y-4 md:col-span-2">
               <h3 className="font-bold flex items-center gap-2 text-foreground/80"><MapPin size={18}/> {t("seller.settings.addresses")}</h3>
               <div className="text-sm space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
               </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-foreground/80"><Package size={18}/> {t("seller.orders.items")}</h3>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("seller.finance.description")}</th>
                    <th className="px-4 py-3 font-medium">{t("seller.finance.amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("seller.orders.items")}</th>
                    <th className="px-4 py-3 font-medium text-right">{t("seller.orders.total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item: OrderItem) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden border border-border shrink-0">
                          {item.product.media && item.product.media.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.media[0].full_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={16}/></div>
                          )}
                        </div>
                        <span className="truncate max-w-[200px]">{item.product.title}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 font-medium">x{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-primary">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("seller.finance.amount")}</span>
                  <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("seller.orders.shipping_cost")}</span>
                  <span className="font-medium">{t("seller.orders.free")}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="font-bold">{t("seller.orders.total")}</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-6 p-4 bg-amber-500/10 text-amber-900 border border-amber-500/20 rounded-xl text-sm">
                <strong>{t("seller.orders.customer_notes")}</strong> {order.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap justify-end gap-3 items-center">
          {order.status === 'pending' && (
            <>
              <button onClick={() => { handleUpdateStatus('cancelled'); onClose(); }}
                className="px-4 py-2 border border-destructive/30 text-destructive bg-destructive/5 rounded-xl text-sm font-medium hover:bg-destructive hover:text-white transition-colors flex items-center gap-2">
                <XCircle size={16}/> {t("seller.orders.cancel_order")}
              </button>
              <button onClick={() => { handleUpdateStatus('processing'); onClose(); }}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                <CheckCircle size={16}/> {t("seller.orders.approve_order")}
              </button>
            </>
          )}

          {order.status === 'processing' && (
            <button onClick={() => { handleUpdateStatus('shipped'); onClose(); }}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Truck size={16}/> {t("seller.orders.mark_as_shipped")}
            </button>
          )}

          {order.status === 'shipped' && (
            <button onClick={() => { handleUpdateStatus('delivered'); onClose(); }}
              className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
              <CheckCircle size={16}/> {t("seller.orders.status_delivered")}
            </button>
          )}

          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
            {t("inbox.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
