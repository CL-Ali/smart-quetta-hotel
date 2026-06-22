import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Kitchen() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  
  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 3000
  });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const handleStatusUpdate = (id: number, status: string) => {
    setConfirmAction({ orderId: id, status });
    setShowConfirm(true);
  };

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus.mutateAsync({ orderId: confirmAction.orderId, status: confirmAction.status });
      refetch();
      toast.success(`Order marked as ${confirmAction.status}`);
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

  const activeOrders = orders?.filter(o => o.status === 'pending' || o.status === 'preparing') || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            <h1 className="text-2xl font-light tracking-tight">Kitchen Display</h1>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg text-gray-500">No pending orders</p>
            <p className="text-xs text-gray-400 mt-2">Sukoon hai! ☕</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map(order => (
              <div 
                key={order.id} 
                className={`rounded-lg p-6 border-2 ${
                  order.status === 'preparing' 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xl font-semibold">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <Badge className={`text-xs font-medium ${
                    order.status === 'preparing' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-800'
                  }`}>
                    {order.status === 'preparing' ? '🔥 Cooking' : '⏳ Pending'}
                  </Badge>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-6 pb-6 border-b-2 border-gray-300">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="bg-white px-2 py-1 rounded font-bold text-orange-600">x {item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No items</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-10 rounded-lg font-medium"
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      title="Start cooking this order"
                    >
                      🔥 Start Cooking
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-10 rounded-lg font-medium"
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      title="Mark order as ready to serve"
                    >
                      ✅ Ready to Serve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.status === 'preparing' && 'Start cooking Order #' + confirmAction?.orderId + '?'}
              {confirmAction?.status === 'ready' && 'Mark Order #' + confirmAction?.orderId + ' as ready to serve?'}
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
