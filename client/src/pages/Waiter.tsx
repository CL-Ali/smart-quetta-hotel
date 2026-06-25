import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Utensils, Coffee, Check, UserCheck, ChevronDown, ChevronUp } from "lucide-react";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { NewOrderSheet } from "@/components/NewOrderSheet";

export default function Waiter() {
  const { t } = useLang();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [serving, setServing] = useState<Set<number>>(new Set()); // itemIds being processed

  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(
    undefined, { refetchInterval: 3000 }
  );
  const updateItemStatus = trpc.hotel.updateItemStatus.useMutation();

  const toggleExpand = (id: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleServeItem = async (itemId: number, qty: number) => {
    setServing(prev => new Set(prev).add(itemId));
    try {
      await updateItemStatus.mutateAsync({
        itemId,
        kitchenStatus: "served",
        serveQty: qty,
      });
      refetch();
      toast.success("Item served ✓");
    } catch {
      toast.error("Failed");
    } finally {
      setServing(prev => { const n = new Set(prev); n.delete(itemId); return n; });
    }
  };

  const handleServeAll = async (order: any) => {
    const readyItems = order.items?.filter((i: any) => i.kitchenStatus === "ready") ?? [];
    for (const item of readyItems) {
      await handleServeItem(item.id, item.quantity - (item.servedQty ?? 0));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  // Orders with at least one ready item
  const withReady = (orders ?? []).filter(o =>
    o.items?.some((i: any) => i.kitchenStatus === "ready")
  );

  // Recently fully served (last 8)
  const recentServed = (orders ?? [])
    .filter(o => o.status === "served" || o.status === "paid")
    .slice(0, 8);

  // Group ready orders by customer
  const grouped = withReady.reduce<Record<string, typeof withReady>>((acc, order) => {
    const key = order.customerName ?? `#${order.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            <h1 className="text-lg font-bold">{t.waiterView}</h1>
            {withReady.length > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {withReady.length}
              </span>
            )}
          </div>
          <LangSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">

        {/* ── Ready to Serve ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            {t.readyToServe}
            {withReady.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {withReady.length}
              </span>
            )}
          </h2>

          {withReady.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <Coffee className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">{t.noOrdersReady}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([customerName, customerOrders]) => (
                <div key={customerName} className="rounded-2xl border-2 border-green-200 bg-green-50 overflow-hidden">
                  {/* Customer name bar */}
                  <div className="bg-green-600 px-4 py-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-100" />
                    <span className="font-bold text-sm text-white">{customerName}</span>
                  </div>

                  {customerOrders.map((order) => {
                    const readyItems = order.items?.filter((i: any) => i.kitchenStatus === "ready") ?? [];
                    const isExpanded = expandedOrders.has(order.id) || customerOrders.length === 1;
                    const servedBill = order.servedAmount ?? 0;

                    return (
                      <div key={order.id} className="border-b border-green-100 last:border-0">
                        {/* Order row — collapsible */}
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-100/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-800">#{order.id}</span>
                            <span className="text-xs text-green-700">
                              {readyItems.length} item{readyItems.length !== 1 ? "s" : ""} ready
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-900">
                              Rs. {servedBill.toFixed(0)} served
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-green-700" /> : <ChevronDown className="w-4 h-4 text-green-700" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2">
                            {order.items?.map((item: any) => {
                              const isReady  = item.kitchenStatus === "ready";
                              const isServed = item.kitchenStatus === "served";
                              const pending  = item.quantity - (item.servedQty ?? 0);
                              if (!isReady && !isServed) return null; // hide pending/preparing items

                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 border
                                    ${isServed ? "bg-white/60 border-gray-100 opacity-50" : "bg-white border-green-200"}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isServed
                                      ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                      : <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                    }
                                    <span className="text-sm font-semibold text-gray-800 truncate">{item.name}</span>
                                    <span className="text-xs text-gray-500 shrink-0">
                                      ×{item.quantity}
                                      {item.servedQty > 0 && item.servedQty < item.quantity &&
                                        <span className="text-amber-600"> ({item.servedQty} done)</span>
                                      }
                                    </span>
                                  </div>

                                  {isReady && pending > 0 && (
                                    <button
                                      onClick={() => handleServeItem(item.id, pending)}
                                      disabled={serving.has(item.id)}
                                      className="shrink-0 ml-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                      {serving.has(item.id)
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <><Check className="w-3 h-3" /> Serve</>
                                      }
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {/* Serve all ready at once */}
                            {readyItems.length > 1 && (
                              <button
                                onClick={() => handleServeAll(order)}
                                disabled={updateItemStatus.isPending}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
                              >
                                <UserCheck className="w-4 h-4" />
                                Serve All ({readyItems.length} items)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recently Served ── */}
        {recentServed.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">{t.recentlyServed}</h2>
            <div className="space-y-2">
              {recentServed.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">
                      #{order.id} — {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">
                      Rs. {(order.servedAmount ?? order.totalAmount ?? 0).toFixed(0)}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                      <UserCheck className="w-3 h-3" /> Served
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <NewOrderSheet open={showNewOrder} onClose={() => setShowNewOrder(false)} onDone={refetch} />
      <FloatingAddButton onClick={() => setShowNewOrder(true)} />
    </div>
  );
}
