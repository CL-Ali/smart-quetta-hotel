import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Waiter() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  
  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 3000
  });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const handleStatusUpdate = (id: number) => {
    setConfirmAction({ orderId: id });
    setShowConfirm(true);
  };

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus.mutateAsync({ orderId: confirmAction.orderId, status: 'served' });
      refetch();
      toast.success("Order marked as served ✅");
    } catch (err) {
      toast.error("Failed to update order");
    }
    setShowConfirm(false);
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin h-8 w-8 text-black" />
      </div>
    );
  }

  const readyOrders = orders?.filter(o => o.status === 'ready') || [];
  const servedOrders = orders?.filter(o => o.status === 'served').slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6" />
            <h1 className="text-2xl font-light tracking-tight">Waiter View</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ready to Serve */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium">Ready to Serve</h2>
              {readyOrders.length > 0 && (
                <Badge className="bg-green-600 text-white text-xs">{readyOrders.length}</Badge>
              )}
            </div>
            {readyOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-8">No orders ready</p>
            ) : (
              <div className="space-y-3">
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">Order #{order.id}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      <Badge className="bg-green-600 text-white text-xs">
                        Ready ✅
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-4 pb-4 border-b border-green-200">
                      {order.items?.map((item: any) => (
                        <p key={item.id} className="text-sm">
                          <span className="font-medium">{item.name}</span> <span className="text-gray-600">x {item.quantity}</span>
                        </p>
                      ))}
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-10 rounded-lg font-medium"
                      onClick={() => handleStatusUpdate(order.id)}
                      title="Mark this order as served"
                    >
                      ✋ Mark Served
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Served */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium">Recently Served</h2>
              {servedOrders.length > 0 && (
                <Badge className="bg-gray-300 text-gray-800 text-xs">{servedOrders.length}</Badge>
              )}
            </div>
            {servedOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-8">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {servedOrders.map(order => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-gray-600">{order.customerName}</p>
                      </div>
                      <Badge className="bg-gray-300 text-gray-800 text-xs">
                        Served
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Serving</AlertDialogTitle>
            <AlertDialogDescription>
              Mark Order #{confirmAction?.orderId} as served?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeStatusUpdate}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
