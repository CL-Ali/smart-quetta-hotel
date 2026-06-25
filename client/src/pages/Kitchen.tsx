import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Clock, ChefHat, Check, Coffee, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";

// Item-level status badge colors
const ITEM_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-gray-100",   text: "text-gray-600",   label: "Pending"   },
  preparing: { bg: "bg-blue-100",   text: "text-blue-700",   label: "Cooking"   },
  ready:     { bg: "bg-green-100",  text: "text-green-700",  label: "Ready"     },
  served:    { bg: "bg-emerald-50", text: "text-emerald-600",label: "Served"    },
};

export default function Kitchen() {
  const { t } = useLang();
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(
    undefined, { refetchInterval: 3000 }
  );
  const updateItemStatus = trpc.hotel.updateItemStatus.useMutation();
  const updateOrderStatus = trpc.hotel.updateOrderStatus.useMutation();

  const toggleExpand = (id: number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleItemAction = async (
    itemId: number,
    currentStatus: string,
    orderId: number
  ) => {
    const next =
      currentStatus === "pending"   ? "preparing" :
      currentStatus === "preparing" ? "ready"     : null;

    if (!next) return;

    try {
      await updateItemStatus.mutateAsync({ itemId, kitchenStatus: next as any });
      refetch();
      toast.success(next === "preparing" ? "Cooking started" : "Item ready ✓");
    } catch {
      toast.error("Failed");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  // Show orders that have at least one item not yet served
  const active = (orders ?? []).filter(o =>
    (o.status === "pending" || o.status === "preparing" || o.status === "ready") &&
    o.items?.some((i: any) => i.kitchenStatus !== "served")
  );

  // Group by customer name — same customer's items shown together
  const grouped = active.reduce<Record<string, typeof active>>((acc, order) => {
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
            <ChefHat className="w-5 h-5" />
            <h1 className="text-lg font-bold">{t.kitchenDisplay}</h1>
            {active.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {active.length}
              </span>
            )}
          </div>
          <LangSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {active.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t.noOrders}</p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-1">
              <Coffee className="w-3.5 h-3.5 text-gray-300" />
              <span>All clear!</span>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([customerName, customerOrders]) => (
            <div key={customerName} className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden">
              {/* Customer header */}
              <div className="bg-orange-50 border-b border-orange-100 px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Customer</span>
                <span className="font-bold text-sm text-gray-900">{customerName}</span>
              </div>

              {customerOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id) || customerOrders.length === 1;
                const activeItems = order.items?.filter((i: any) => i.kitchenStatus !== "served") ?? [];
                const allReady = activeItems.every((i: any) => i.kitchenStatus === "ready");

                return (
                  <div key={order.id} className="border-b border-gray-100 last:border-0">
                    {/* Order sub-header */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">#{order.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          order.status === "preparing" ? "bg-blue-100 text-blue-700" :
                          order.status === "ready"     ? "bg-green-100 text-green-700" :
                                                         "bg-gray-100 text-gray-600"
                        }`}>
                          {order.status === "preparing" ? "Cooking" :
                           order.status === "ready"     ? "Ready" : "Pending"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{activeItems.length} items</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Item list */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {order.items?.map((item: any) => {
                          const status = item.kitchenStatus ?? "pending";
                          const s = ITEM_STATUS[status] ?? ITEM_STATUS.pending;
                          const isFullyServed = status === "served";
                          const canAct = status === "pending" || status === "preparing";

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all
                                ${isFullyServed ? "bg-emerald-50 border-emerald-100 opacity-60" : "bg-gray-50 border-gray-100"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text}`}>
                                  {s.label}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 truncate">{item.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">×{item.quantity}</span>
                                {item.servedQty > 0 && item.servedQty < item.quantity && (
                                  <span className="text-xs text-amber-600 font-semibold shrink-0">
                                    ({item.servedQty} served)
                                  </span>
                                )}
                              </div>

                              {canAct && (
                                <button
                                  onClick={() => handleItemAction(item.id, status, order.id)}
                                  disabled={updateItemStatus.isPending}
                                  className={`shrink-0 ml-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer
                                    ${status === "pending"   ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                                >
                                  {updateItemStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                   status === "pending" ? <><ChefHat className="w-3 h-3 inline mr-1" />Cook</> :
                                   <><Check className="w-3 h-3 inline mr-1" />Ready</>}
                                </button>
                              )}
                              {isFullyServed && (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                              )}
                            </div>
                          );
                        })}

                        {/* Mark all ready at once if any still pending/preparing */}
                        {!allReady && activeItems.length > 1 && (
                          <button
                            onClick={async () => {
                              for (const item of activeItems) {
                                if (item.kitchenStatus === "pending" || item.kitchenStatus === "preparing") {
                                  await updateItemStatus.mutateAsync({ itemId: item.id, kitchenStatus: "ready" });
                                }
                              }
                              refetch();
                              toast.success("All items marked ready");
                            }}
                            className="w-full py-2 mt-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <Check className="w-3 h-3 inline mr-1" />
                            Mark All Ready
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
