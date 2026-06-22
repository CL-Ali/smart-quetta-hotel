import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Utensils, Plus, Coffee, Check, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { NewOrderSheet } from "@/components/NewOrderSheet";

export default function Waiter() {
  const { t } = useLang();
  const [confirmId, setConfirmId]       = useState<number | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const isMobile = useIsMobile();

  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(
    undefined, { refetchInterval: 3000 }
  );
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const executeServed = async () => {
    if (confirmId === null) return;
    try {
      await updateStatus.mutateAsync({ orderId: confirmId, status: "served" });
      refetch(); toast.success("Served ✅");
    } catch { toast.error("Failed"); }
    setConfirmId(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const readyOrders  = orders?.filter(o => o.status === "ready")  ?? [];
  const servedOrders = orders?.filter(o => o.status === "served").slice(0, 8) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            <h1 className="text-lg font-bold">{t.waiterView}</h1>
            {readyOrders.length > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {readyOrders.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> {t.newOrder}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">

        {/* Ready to serve */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            {t.readyToServe}
            {readyOrders.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {readyOrders.length}
              </span>
            )}
          </h2>

          {readyOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <Coffee className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">{t.noOrdersReady}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg flex items-center gap-1.5">
                        #{order.id}
                        <Check className="w-5 h-5 text-green-500" />
                      </p>
                      <p className="font-semibold text-base">{order.customerName}</p>
                    </div>
                    <span className="text-base font-bold text-orange-600">
                      Rs. {(order.totalAmount ?? 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="space-y-0.5 mb-4 pb-3 border-b border-green-200">
                    {order.items?.map((item: any) => (
                      <p key={item.id} className="text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500"> ×{item.quantity}</span>
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => setConfirmId(order.id)}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>{t.markServed}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently served */}
        {servedOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">{t.recentlyServed}</h2>
            <div className="space-y-2">
              {servedOrders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">#{order.id} — {order.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-1 rounded-full">
                    <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                    <span>Served</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {isMobile ? (
        <Drawer open={confirmId !== null} onOpenChange={v => !v && setConfirmId(null)}>
          <DrawerContent className="max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
            <DrawerHeader>
              <DrawerTitle>Mark Order #{confirmId} as served?</DrawerTitle>
              <DrawerDescription>This will notify the admin.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 bg-gray-200 rounded">
                {t.cancel}
              </button>
              <button onClick={executeServed} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                {t.markServed}
              </button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <AlertDialog open={confirmId !== null} onOpenChange={v => !v && setConfirmId(null)}>
          <AlertDialogContent className="max-w-sm mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Order #{confirmId} as served?</AlertDialogTitle>
              <AlertDialogDescription>This will notify the admin.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={executeServed} className="bg-green-600 hover:bg-green-700">
                {t.markServed}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <NewOrderSheet open={showNewOrder} onClose={() => setShowNewOrder(false)} onDone={refetch} />
    </div>
  );
}
