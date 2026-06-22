import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Waiter() {
  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 3000
  });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const handleStatusUpdate = async (id: number, status: any) => {
    try {
      await updateStatus.mutateAsync({ orderId: id, status });
      refetch();
      toast.success("Order marked as served");
    } catch (err) {
      toast.error("Failed to update order");
    }
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
          <h1 className="text-2xl font-light tracking-tight">Waiter View</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ready to Serve */}
          <div>
            <h2 className="text-sm font-medium mb-4">Ready to Serve</h2>
            {readyOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-8">No orders ready</p>
            ) : (
              <div className="space-y-3">
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-xs text-gray-600">{order.customerName}</p>
                      </div>
                      <div className="inline-block bg-green-200 rounded-full px-2 py-1 text-xs font-medium text-green-800">
                        Ready
                      </div>
                    </div>
                    <div className="space-y-1 mb-4 pb-4 border-b border-green-200">
                      {order.items?.map((item: any) => (
                        <p key={item.id} className="text-sm">
                          {item.name} <span className="text-gray-600">x {item.quantity}</span>
                        </p>
                      ))}
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-9 rounded-full"
                      onClick={() => handleStatusUpdate(order.id, 'served')}
                    >
                      Mark Served
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Served */}
          <div>
            <h2 className="text-sm font-medium mb-4">Recently Served</h2>
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
                      <div className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs text-gray-700">
                        Served
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
