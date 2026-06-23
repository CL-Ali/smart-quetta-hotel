import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, Banknote, Smartphone, Search,
  Package, Droplet, AlertTriangle, ChefHat, Plus,
  Hotel, ClipboardList, Boxes, Utensils, Clock,
  UserCheck, Ban, CheckCircle2, Wallet, X,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer, DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { NewOrderSheet } from "@/components/NewOrderSheet";

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_BG: Record<string, string> = {
  pending:   "border-amber-200  bg-amber-50",
  preparing: "border-blue-200   bg-blue-50",
  ready:     "border-green-200  bg-green-50",
  served:    "border-gray-200   bg-gray-50",
  paid:      "border-emerald-200 bg-emerald-50",
  cancelled: "border-red-200    bg-red-50",
};
function getStatusIcon(status: string, className = "w-4 h-4") {
  switch (status) {
    case "pending":   return <Clock className={`${className} text-amber-500`} />;
    case "preparing": return <ChefHat className={`${className} text-blue-500 animate-pulse`} />;
    case "ready":     return <CheckCircle2 className={`${className} text-green-500`} />;
    case "served":    return <UserCheck className={`${className} text-gray-500`} />;
    case "paid":      return <Banknote className={`${className} text-emerald-500`} />;
    case "cancelled": return <Ban className={`${className} text-red-500`} />;
    default:          return null;
  }
}
const PAY_PILL: Record<string, string> = {
  unpaid:"bg-red-100 text-red-700", partial:"bg-amber-100 text-amber-700", paid:"bg-emerald-100 text-emerald-700",
};

// ─── Payment Sheet ────────────────────────────────────────────────────────────

function PaymentSheet({ order, open, onClose, onDone }: { order: any; open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [method, setMethod] = useState<"cash" | "bank">("cash");
  const [amount, setAmount] = useState("");
  const recordPayment = trpc.hotel.recordPayment.useMutation();

  const total     = order?.totalAmount ?? 0;
  const paid      = order?.paidAmount  ?? 0;
  const remaining = Math.max(0, total - paid);

  const [methodCash, setMethodCash] = useState(true);
  const [methodBank, setMethodBank] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");

  const handleConfirm = async () => {
    const cashVal = methodCash ? parseFloat(cashAmount) || 0 : 0;
    const bankVal = methodBank ? parseFloat(bankAmount) || 0 : 0;
    const totalVal = cashVal + bankVal;
    if (totalVal <= 0) { toast.error("Enter amount"); return; }
    if (totalVal > remaining) { toast.error("Amount exceeds remaining"); return; }
    try {
      if (methodCash) {
        await recordPayment.mutateAsync({ orderId: order.id, amount: cashVal, method: "cash" });
      }
      if (methodBank) {
        await recordPayment.mutateAsync({ orderId: order.id, amount: bankVal, method: "bank" });
      }
      toast.success(totalVal === remaining ? "Fully paid" : `Rs. ${totalVal} saved`);
      onDone(); onClose();
    } catch { toast.error("Failed to save payment"); }
  };

  const renderContent = (isMob: boolean) => (
    <div className={`space-y-4 ${isMob ? "pb-8 pt-2 px-4" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-foreground">{t.payment} — #{order?.id}</h2>
        </div>
        {isMob && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {order && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 border border-gray-100">
            <p className="font-bold text-base text-gray-900">{order.customerName}</p>
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.name} ×{item.quantity}</span>
                <span>Rs. {(item.unitPrice * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
              <span>{t.grandTotal}</span><span>Rs. {total.toFixed(0)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>{t.alreadyPaid}</span><span>Rs. {paid.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-orange-600 text-lg">
              <span>{t.remaining}</span><span>Rs. {remaining.toFixed(0)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2 text-gray-700">{t.howMuch}</label>
            {methodCash && (
              <Input
                type="number" inputMode="numeric"
                placeholder={remaining.toFixed(0)}
                value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                className="h-14 text-xl font-bold text-center" autoFocus
              />
            )}
            {methodBank && (
              <Input
                type="number" inputMode="numeric"
                placeholder={remaining.toFixed(0)}
                value={bankAmount} onChange={e => setBankAmount(e.target.value)}
                className="h-14 text-xl font-bold text-center"
              />
            )}
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={methodCash} onChange={e => setMethodCash(e.target.checked)} />
                <span>{t.cash}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={methodBank} onChange={e => setMethodBank(e.target.checked)} />
                <span>{t.bank}</span>
              </label>
            </div>
            <button onClick={() => {
              const sum = (parseFloat(cashAmount) || 0) + (parseFloat(bankAmount) || 0);
              const fill = remaining - sum;
              if (methodCash) setCashAmount((parseFloat(cashAmount) || 0 + fill).toString());
              if (methodBank) setBankAmount((parseFloat(bankAmount) || 0 + fill).toString());
            }}
              className="w-full mt-2 py-2.5 text-sm text-orange-600 font-semibold bg-orange-50 hover:bg-orange-100 rounded-xl cursor-pointer">
              {t.fillFull} → Rs. {remaining.toFixed(0)}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { val: "cash", label: t.cash, icon: Banknote, activeClass: "border-emerald-500 bg-emerald-50 text-emerald-800" },
              { val: "bank", label: t.bank, icon: Smartphone, activeClass: "border-blue-500 bg-blue-50 text-blue-800" }
            ].map(({ val, label, icon: Icon, activeClass }) => (
              <button key={val} onClick={() => setMethod(val as "cash" | "bank")}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition cursor-pointer select-none ${
                  method === val ? activeClass : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 h-12 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-600 cursor-pointer">
              {t.back}
            </button>
            <button onClick={handleConfirm} disabled={recordPayment.isPending || !amount}
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer flex items-center justify-center">
              {recordPayment.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => !v && onClose()}>
        <DrawerContent className="max-h-[85vh] flex flex-col p-0">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full my-3 shrink-0" />
          <div className="overflow-y-auto">
            {renderContent(true)}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent className="max-w-sm mx-4">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type FilterKey = "all" | "unpaid" | "pending" | "ready" | "paid";

export default function Dashboard() {
  const { t } = useLang();
  const [tab, setTab]         = useState<"orders" | "inventory" | "stock">("orders");
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [search, setSearch]   = useState("");
  const [payOrder, setPayOrder] = useState<any>(null);
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [invEdits, setInvEdits]   = useState<Record<number, string>>({});
  const [stockEdits, setStockEdits] = useState<Record<number, { total: number; inUse: number; broken: number }>>({});

  const { data: orders, isLoading, refetch } =
    trpc.hotel.getOrders.useQuery(undefined, { refetchInterval: 4000 });
  const { data: invData,   refetch: refetchInv   } = trpc.hotel.getInventory.useQuery();
  const { data: stockData, refetch: refetchStock } = trpc.hotel.getStock.useQuery();
  const { data: cash } = trpc.hotel.getCashReport.useQuery(undefined, { refetchInterval: 6000 });

  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();
  const updateInv    = trpc.hotel.updateInventory.useMutation();
  const updateStock  = trpc.hotel.updateStock.useMutation();

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",     label: t.all           },
    { key: "unpaid",  label: t.unpaidFilter  },
    { key: "pending", label: t.queueFilter   },
    { key: "ready",   label: t.readyFilter   },
    { key: "paid",    label: t.paidFilter    },
  ];

  const filtered = (orders ?? []).filter(o => {
    const m = !search || o.customerName?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    if (!m) return false;
    if (filter === "unpaid")  return o.paymentStatus !== "paid" && o.status !== "cancelled";
    if (filter === "pending") return o.status === "pending" || o.status === "preparing";
    if (filter === "ready")   return o.status === "ready" || o.status === "served";
    if (filter === "paid")    return o.paymentStatus === "paid";
    return true;
  });
  const unpaidCount  = (orders ?? []).filter(o => o.paymentStatus !== "paid" && o.status !== "cancelled").length;
  const pendingCount = (orders ?? []).filter(o => o.status === "pending" || o.status === "preparing").length;
  const readyCount   = (orders ?? []).filter(o => o.status === "ready").length;

  const handleCancel = async (id: number) => {
    await updateStatus.mutateAsync({ orderId: id, status: "cancelled" });
    refetch(); toast.success("Cancelled");
  };
  const confirmCancel = (id: number) => setCancelConfirm(id);

  const handleSaveInv = async (id: number) => {
    await updateInv.mutateAsync({ inventoryId: id, quantity: parseFloat(invEdits[id] ?? "0") });
    toast.success("Saved"); refetchInv();
    setInvEdits(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const handleSaveStock = async (id: number) => {
    const e = stockEdits[id]; if (!e) return;
    await updateStock.mutateAsync({ stockId: id, totalQuantity: e.total, inUse: e.inUse, broken: e.broken });
    toast.success("Saved"); refetchStock();
    setStockEdits(p => { const n = { ...p }; delete n[id]; return n; });
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{t.hotelName}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold leading-none">{t.adminPanel}</p>
            </div>
          </div>
          <LangSwitcher />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        
        {/* Revenue Card & KPIs */}
        <div className="mb-4 space-y-2">
          {/* Revenue card — split cash / bank / total */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-10 pointer-events-none">
              <Banknote className="w-24 h-24" />
            </div>
            <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold">{t.todayRevenue}</p>
            <h2 className="text-2xl font-black mt-0.5">Rs. {parseInt(cash?.totalCash ?? "0")}</h2>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20 text-xs text-orange-50 font-medium">
              <div>
                <span className="opacity-75">{t.cashSplit}:</span>{" "}
                <span className="font-bold text-white">Rs. {parseInt(cash?.cashTotal ?? "0")}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div>
                <span className="opacity-75">{t.bankSplit}:</span>{" "}
                <span className="font-bold text-white">Rs. {parseInt(cash?.bankTotal ?? "0")}</span>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center shadow-xs">
              <p className="text-lg font-black text-amber-700">{pendingCount}</p>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">{t.inKitchen}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center shadow-xs">
              <p className="text-lg font-black text-green-700">{readyCount}</p>
              <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">{t.ready2}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-center shadow-xs">
              <p className="text-lg font-black text-red-700">{unpaidCount}</p>
              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">{t.unpaidOrders}</p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 bg-gray-200/80 rounded-xl p-1 mb-4">
          {[
            { key: "orders", label: t.orders, icon: ClipboardList },
            { key: "inventory", label: t.inventory, icon: Boxes },
            { key: "stock", label: t.stock, icon: Utensils }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === key ? "bg-white shadow text-black" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

      {/* ── Orders Tab ── */}
      {tab === "orders" && (
        <div className="space-y-3 pb-8">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={t.searchOrders} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-11 bg-white" />
            </div>
            <button onClick={() => setShowNewOrder(true)}
              className="hidden sm:flex h-11 px-4 bg-black text-white rounded-xl items-center gap-1.5 text-sm font-semibold shrink-0 cursor-pointer">
              <Plus className="w-4 h-4" />{t.newOrder}
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${filter === f.key ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200"}`}>
                {f.label}
                {f.key === "unpaid"  && unpaidCount  > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unpaidCount}</span>}
                {f.key === "pending" && pendingCount > 0 && <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>}
                {f.key === "ready"   && readyCount   > 0 && <span className="ml-1.5 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5">{readyCount}</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <ChefHat className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className={`rounded-2xl border-2 p-4 ${STATUS_BG[order.status] ?? "border-gray-200 bg-white"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg flex items-center gap-1.5">
                        #{order.id}
                        {getStatusIcon(order.status, "w-5 h-5")}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PAY_PILL[order.paymentStatus]}`}>
                        {(t.payStatus as any)[order.paymentStatus]}
                        {order.paymentStatus === "partial" && ` (Rs.${(order.paidAmount ?? 0).toFixed(0)}/${(order.totalAmount ?? 0).toFixed(0)})`}
                      </span>
                    </div>
                    <p className="font-semibold text-base mt-0.5">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">Rs. {(order.totalAmount ?? 0).toFixed(0)}</p>
                </div>

                <div className="bg-white/60 rounded-xl px-3 py-2 mb-3 space-y-0.5">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                      <span className="text-gray-600">Rs. {(item.unitPrice * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.status !== "cancelled" && order.paymentStatus !== "paid" && (
                    <button onClick={() => setPayOrder(order)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-pointer">
                      <Banknote className="w-4 h-4" />
                      <span>{t.takePayment}</span>
                    </button>
                  )}
                  {order.paymentStatus === "paid" && (
                    <div className="flex-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t.payStatus.paid} — {order.paymentMethod}</span>
                    </div>
                  )}
                  {order.status === "cancelled" && (
                    <div className="flex-1 bg-gray-100 border border-gray-200 text-gray-500 py-3 rounded-xl text-sm flex items-center justify-center gap-1.5">
                      <Ban className="w-4 h-4 text-gray-400" />
                      <span>Cancelled</span>
                    </div>
                  )}
                  {order.status !== "cancelled" && order.paymentStatus !== "paid" && (
                    <button onClick={() => confirmCancel(order.id)}
                      className="px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Inventory Tab ── */}
      {tab === "inventory" && (
        <div className="max-w-lg mx-auto px-4 pt-3 pb-24 space-y-3">
          {(!invData || invData.length === 0) && (
            <div className="text-center py-20 text-gray-400"><Droplet className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No inventory</p></div>
          )}
          {invData?.map(item => {
            const isLow = (item.quantity ?? 0) < (item.minThreshold ?? 5);
            const displayVal = invEdits[item.id] !== undefined ? invEdits[item.id] : String(item.quantity ?? 0);
            return (
              <div key={item.id} className={`bg-white rounded-2xl p-4 border-2 ${isLow ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold">{item.itemName}</p>
                    <p className="text-sm text-gray-500">{item.unit}</p>
                  </div>
                  {isLow && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Low!
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Input type="number" inputMode="decimal" value={displayVal}
                    onChange={e => setInvEdits(p => ({ ...p, [item.id]: e.target.value }))}
                    className="flex-1 h-12 text-lg font-bold text-center" />
                  <button onClick={() => handleSaveInv(item.id)} disabled={updateInv.isPending}
                    className="h-12 px-6 bg-black text-white font-bold rounded-xl text-sm">
                    {t.save}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Stock Tab ── */}
      {tab === "stock" && (
        <div className="max-w-lg mx-auto px-4 pt-3 pb-24 space-y-3">
          {(!stockData || stockData.length === 0) && (
            <div className="text-center py-20 text-gray-400"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No stock</p></div>
          )}
          {stockData?.map(item => {
            const e = stockEdits[item.id];
            const total = e?.total ?? item.totalQuantity;
            const inUse = e?.inUse ?? item.inUse;
            const broken = e?.broken ?? item.broken;
            const avail = total - inUse - broken;
            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold">🍽️ {item.name}</p>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{avail} available</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([["total","Total",total],["inUse","In Use",inUse],["broken","Broken",broken]] as const).map(([key, label, val]) => (
                    <div key={key} className="text-center">
                      <label className="text-xs text-gray-500 block mb-1">{label}</label>
                      <Input type="number" inputMode="numeric" value={val}
                        onChange={e => setStockEdits(p => ({
                          ...p,
                          [item.id]: { total: p[item.id]?.total ?? item.totalQuantity, inUse: p[item.id]?.inUse ?? item.inUse, broken: p[item.id]?.broken ?? item.broken, [key]: parseInt(e.target.value) || 0 },
                        }))}
                        className="h-12 text-base font-bold text-center" />
                    </div>
                  ))}
                </div>
                <button onClick={() => handleSaveStock(item.id)} disabled={updateStock.isPending}
                  className="w-full h-12 bg-black text-white font-bold rounded-xl">
                  {t.save}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {payOrder && <PaymentSheet order={payOrder} open={!!payOrder} onClose={() => setPayOrder(null)} onDone={() => { refetch(); setPayOrder(null); }} />}
        {cancelConfirm !== null && (
          <Drawer open={true} onOpenChange={v => !v && setCancelConfirm(null)}>
            <DrawerContent className="max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle>{t.confirmCancel}</DrawerTitle>
                <DrawerDescription>{t.confirmCancelDesc}</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter className="flex gap-3 justify-end">
                <button onClick={() => setCancelConfirm(null)} className="px-4 py-2 bg-gray-200 rounded">{t.cancel}</button>
                <button onClick={() => { handleCancel(cancelConfirm); setCancelConfirm(null); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">{t.confirm}</button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      <NewOrderSheet open={showNewOrder} onClose={() => setShowNewOrder(false)} onDone={refetch} />

      {/* Floating Action Button for mobile screens */}
      <button
        onClick={() => setShowNewOrder(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 bg-black hover:bg-black/90 active:scale-95 text-white rounded-full p-4 shadow-xl transition-all flex items-center justify-center cursor-pointer border border-neutral-800"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  </div>
  );
}
