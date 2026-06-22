import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StorageService } from "@/lib/storage";
import { useLocation } from "wouter";

export default function OrderHistory() {
  const [, setLocation] = useLocation();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const customerName = StorageService.getCustomerName();
  const { data: orders, isLoading } = trpc.hotel.getCustomerOrders.useQuery(
    { customerName: customerName || "" },
    { enabled: !!customerName }
  );

  if (!customerName) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please place an order first to view history</p>
          <Button onClick={() => setLocation("/")} className="bg-orange-600 hover:bg-orange-700">
            Go to Menu
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-tight">Order History</h1>
              <p className="text-sm text-gray-600">{customerName}</p>
            </div>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="text-xs"
            >
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!orders || orders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition"
              >
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div className="text-left flex-1">
                    <p className="font-semibold">Order #{order.id}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">Rs. {order.totalAmount}</p>
                      <div className="flex gap-2 justify-end mt-1">
                        <Badge className={`text-xs ${
                          order.status === 'pending' ? 'bg-yellow-600' :
                          order.status === 'ready' ? 'bg-green-600' :
                          'bg-gray-600'
                        }`}>
                          {order.status}
                        </Badge>
                        <Badge className={`text-xs ${
                          order.paymentStatus === 'paid' ? 'bg-green-600' :
                          order.paymentStatus === 'partial' ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition ${
                        expandedOrderId === order.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Order Details */}
                {expandedOrderId === order.id && (
                  <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-3">
                    {/* Items */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Items</p>
                      <p className="text-sm">Order #{order.id} - {order.status}</p>
                    </div>

                    {/* Payment Info */}
                    {order.paymentStatus !== 'unpaid' && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Payment Status</p>
                        <p className="text-sm">{order.paymentMethod || 'N/A'} - {order.paymentStatus}</p>
                      </div>
                    )}

                    {/* Reorder Button */}
                    <Button
                      onClick={() => {
                        // For now, just go back to menu
                        // In production, would load previous order items
                        setLocation("/");
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm h-8"
                    >
                      Reorder
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
