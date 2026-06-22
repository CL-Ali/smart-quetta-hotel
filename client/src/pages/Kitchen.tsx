import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Clock, ChefHat, Check, Coffee } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";

export default function Kitchen() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [confirm, setConfirm] = useState<{ orderId: number; status: string } | null>(null);

  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, { refetchInterval: 3000 });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const handle = (id: number, status: string) => setConfirm({ orderId: id, status });

  const execute = async () => {
    if (!confirm) return;
    try {
      await updateStatus.mutateAsync({ orderId: confirm.orderId, status: confirm.status });
      refetch();
      toast.success(`Order #${confirm.orderId} → ${confirm.status}`);
    } catch {
      toast.error("Failed");
    }
    setConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const active = orders?.filter((o) => o.status === "pending" || o.status === "preparing") ?? [];

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

      <div className="max-w-lg mx-auto px-4 py-4">
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
          <div className="space-y-3">
            {active.map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl p-4 border-2 ${
                  order.status === "preparing" ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-xl">#{order.id}</p>
                    <p className="font-semibold text-base">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                        order.status === "preparing" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {order.status === "preparing" ? (
                        <ChefHat className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{order.status === "preparing" ? "Cooking" : "Pending"}</span>
                    </span>
                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-xl px-3 py-2 mb-4 space-y-1">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm font-medium">
                      <span>{item.name}</span>
                      <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-lg text-xs">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.status === "pending" && (
                  <button
                    onClick={() => handle(order.id, "preparing")}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ChefHat className="w-5 h-5 animate-pulse" />
                    <span>{t.startCooking}</span>
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => handle(order.id, "ready")}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    <span>{t.readyToServeBtn}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {isMobile ? (
        <Drawer open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
          <DrawerContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto flex flex-col">
            <DrawerHeader>
              <DrawerTitle>
                {confirm?.status === "preparing"
                  ? `Start cooking Order #${confirm?.orderId}?`
                  : `Mark Order #${confirm?.orderId} ready?`}
              </DrawerTitle>
              <DrawerDescription>{t.confirmationDesc}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 bg-gray-200 rounded">
                {t.cancel}
              </button>
              <button onClick={execute} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
                {t.confirm}
              </button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
          <AlertDialogContent className="max-w-sm mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirm?.status === "preparing"
                  ? `Start cooking Order #${confirm?.orderId}?`
                  : `Mark Order #${confirm?.orderId} ready?`}
              </AlertDialogTitle>
              <AlertDialogDescription>{t.confirmationDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={execute} className="bg-orange-600 hover:bg-orange-700 text-white">
                {t.confirm}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
