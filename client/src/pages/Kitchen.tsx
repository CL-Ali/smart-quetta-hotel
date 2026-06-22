import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Kitchen() {
  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 3000
  });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const handleStatusUpdate = async (id: number, status: any) => {
    try {
      await updateStatus.mutateAsync({ orderId: id, status });
      refetch();
      toast.success(`Order marked as ${status}`);
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

  const activeOrders = orders?.filter(o => o.status === 'pending' || o.status === 'preparing') || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-light tracking-tight">Kitchen</h1>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <p className="text-lg text-gray-500">No pending orders</p>
            <p className="text-xs text-gray-400 mt-2">Sukoon hai!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-lg font-medium">Order #{order.id}</p>
                    <p className="text-xs text-gray-600">{order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-600">x {item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No items</p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Status</p>
                  <div className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-medium">
                    {order.status === 'preparing' ? 'Cooking' : 'Pending'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button 
                      className="flex-1 bg-black hover:bg-gray-800 text-white text-sm h-9 rounded-full"
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    >
                      Start
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button 
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm h-9 rounded-full"
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                    >
                      Ready
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
