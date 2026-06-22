import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Dashboard() {
  const [quickOrderName, setQuickOrderName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 5000
  });
  const { data: cashReport } = trpc.hotel.getCashReport.useQuery(undefined, {
    refetchInterval: 5000
  });
  const { data: inventory } = trpc.hotel.getInventory.useQuery(undefined, {
    refetchInterval: 30000
  });
  const { data: menu } = trpc.hotel.getMenu.useQuery();
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();

  const handleStatusUpdate = async (id: number, status: any) => {
    try {
      await updateStatus.mutateAsync({ orderId: id, status });
      refetchOrders();
      toast.success(`Order updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update order");
    }
  };

  const handleQuickOrder = async () => {
    const items = Object.entries(selectedItems).map(([id, qty]) => {
      const menuItem = menu?.find(m => m.id === parseInt(id));
      return {
        menuItemId: parseInt(id),
        quantity: qty,
        unitPrice: menuItem?.price || "0"
      };
    });

    if (items.length === 0) {
      toast.error("Please select items");
      return;
    }

    try {
      await placeOrder.mutateAsync({
        customerName: quickOrderName || "Counter",
        items
      });
      setQuickOrderName("");
      setSelectedItems({});
      refetchOrders();
      toast.success("Order added!");
    } catch (err) {
      toast.error("Failed to add order");
    }
  };

  const toggleItem = (id: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  if (ordersLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin h-8 w-8 text-black" />
      </div>
    );
  }

  const lowStockItems = inventory?.filter(i => parseFloat(i.quantity || "0") < 5) || [];
  const activeOrders = orders?.filter(o => o.status !== 'paid' && o.status !== 'cancelled') || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-light tracking-tight">Control Room</h1>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white text-sm h-9 rounded-full px-6">
                  <Plus className="w-4 h-4 mr-2" /> Add Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Manual Order</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Customer/Area</Label>
                      <Input 
                        placeholder="e.g. Takht 1" 
                        value={quickOrderName} 
                        onChange={e => setQuickOrderName(e.target.value)}
                        className="border-gray-300 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {menu?.map(item => (
                        <Button 
                          key={item.id} 
                          variant="outline" 
                          className="h-auto py-2 flex flex-col items-start text-xs border-gray-300 hover:bg-gray-50"
                          onClick={() => toggleItem(item.id)}
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500">Rs. {item.price}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="border-l border-gray-200 pl-6 space-y-4">
                    <h3 className="font-medium text-sm">Selected</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {Object.entries(selectedItems).map(([id, qty]) => {
                        const item = menu?.find(m => m.id === parseInt(id));
                        return (
                          <div key={id} className="flex justify-between text-xs">
                            <span>{item?.name} x {qty}</span>
                            <span className="text-orange-600">Rs. {parseFloat(item?.price || "0") * qty}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex justify-between font-medium text-sm">
                        <span>Total:</span>
                        <span className="text-orange-600">Rs. {Object.entries(selectedItems).reduce((sum, [id, qty]) => {
                          const item = menu?.find(m => m.id === parseInt(id));
                          return sum + parseFloat(item?.price || "0") * qty;
                        }, 0)}</span>
                      </div>
                      <Button 
                        className="w-full bg-black hover:bg-gray-800 text-white text-sm h-9 rounded-full"
                        onClick={handleQuickOrder} 
                        disabled={Object.keys(selectedItems).length === 0 || placeOrder.isPending}
                      >
                        {placeOrder.isPending ? "Adding..." : "Place"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              onClick={() => refetchOrders()} 
              className="border-gray-300 text-black text-sm h-9 rounded-full px-6"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs - Minimal Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Live Galla</p>
            <p className="text-2xl font-light">Rs. {cashReport?.totalCash || "0.00"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Active Orders</p>
            <p className="text-2xl font-light">{activeOrders.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Low Stock</p>
            <p className="text-2xl font-light">{lowStockItems.length}</p>
          </div>
        </div>
      </div>

      {/* Orders and Inventory */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders */}
          <div>
            <h2 className="text-sm font-medium mb-4">Recent Orders</h2>
            {orders?.length === 0 ? (
              <p className="text-xs text-gray-500 py-8">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders?.map(order => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">#{order.id}</p>
                      <p className="text-xs text-gray-600">{order.customerName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(order.id, 'paid')}
                        className="border-gray-300 text-xs h-7 rounded-full px-3"
                      >
                        Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory */}
          <div>
            <h2 className="text-sm font-medium mb-4">Inventory</h2>
            {inventory?.length === 0 ? (
              <p className="text-xs text-gray-500 py-8">No inventory</p>
            ) : (
              <div className="space-y-2">
                {inventory?.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{item.itemName}</p>
                      <p className="text-xs text-gray-600">{item.quantity} {item.unit}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${parseFloat(item.quantity || "0") < 5 ? 'border-red-300 text-red-600' : 'border-green-300 text-green-600'}`}
                    >
                      {parseFloat(item.quantity || "0") < 5 ? 'Low' : 'OK'}
                    </Badge>
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
