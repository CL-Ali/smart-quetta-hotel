import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Plus, Edit2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [quickOrderName, setQuickOrderName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [editingInventory, setEditingInventory] = useState<Record<number, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 5000
  });
  const { data: cashReport } = trpc.hotel.getCashReport.useQuery(undefined, {
    refetchInterval: 5000
  });
  const { data: inventory, refetch: refetchInventory } = trpc.hotel.getInventory.useQuery(undefined, {
    refetchInterval: 30000
  });
  const { data: menu } = trpc.hotel.getMenu.useQuery();
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();

  const handleStatusUpdate = (id: number, status: string) => {
    setConfirmAction({ type: 'status', id, status });
    setShowConfirm(true);
  };

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus.mutateAsync({ orderId: confirmAction.id, status: confirmAction.status });
      refetchOrders();
      toast.success(`Order marked as ${confirmAction.status}`);
    } catch (err) {
      toast.error("Failed to update order");
    }
    setShowConfirm(false);
    setConfirmAction(null);
  };

  const handleQuickOrder = () => {
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

    setConfirmAction({ type: 'order', items, name: quickOrderName || "Counter" });
    setShowConfirm(true);
  };

  const executeQuickOrder = async () => {
    if (!confirmAction) return;
    try {
      await placeOrder.mutateAsync({
        customerName: confirmAction.name,
        items: confirmAction.items
      });
      setQuickOrderName("");
      setSelectedItems({});
      refetchOrders();
      toast.success("Order added!");
    } catch (err) {
      toast.error("Failed to add order");
    }
    setShowConfirm(false);
    setConfirmAction(null);
  };

  const toggleItem = (id: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleInventoryChange = (id: number, value: string) => {
    setEditingInventory(prev => ({ ...prev, [id]: value }));
  };

  const saveInventory = (id: number) => {
    const newQty = editingInventory[id];
    if (!newQty || isNaN(parseFloat(newQty))) {
      toast.error("Invalid quantity");
      return;
    }
    
    setConfirmAction({ type: 'inventory', id, quantity: newQty });
    setShowConfirm(true);
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
                          variant={selectedItems[item.id] ? "default" : "outline"}
                          className={`h-auto py-2 flex flex-col items-start text-xs ${selectedItems[item.id] ? 'bg-black text-white' : 'border-gray-300 hover:bg-gray-50'}`}
                          onClick={() => toggleItem(item.id)}
                          title={`Add ${item.name} to order`}
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className={selectedItems[item.id] ? 'text-gray-200' : 'text-gray-500'}>Rs. {item.price}</span>
                          {selectedItems[item.id] && <span className="mt-1 text-xs">x {selectedItems[item.id]}</span>}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="border-l border-gray-200 pl-6 space-y-4">
                    <h3 className="font-medium text-sm">Selected Items</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {Object.entries(selectedItems).map(([id, qty]) => {
                        const item = menu?.find(m => m.id === parseInt(id));
                        return (
                          <div key={id} className="flex justify-between text-xs">
                            <span>{item?.name} x {qty}</span>
                            <span className="text-orange-600 font-medium">Rs. {parseFloat(item?.price || "0") * qty}</span>
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
                        disabled={Object.keys(selectedItems).length === 0}
                        title="Confirm and place this order"
                      >
                        Place Order
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
              title="Refresh all data"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Live Galla (Cash)</p>
            <p className="text-3xl font-light">Rs. {cashReport?.totalCash || "0.00"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Active Orders</p>
            <p className="text-3xl font-light">{activeOrders.length}</p>
          </div>
          <div className={`rounded-lg p-6 border ${lowStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs mb-2 ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>Low Stock Alerts</p>
            <p className={`text-3xl font-light ${lowStockItems.length > 0 ? 'text-red-600' : ''}`}>{lowStockItems.length}</p>
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
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-gray-600">{order.customerName} • Rs. {order.totalAmount}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 rounded-full px-3"
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          title="Mark order as preparing in kitchen"
                        >
                          Start Cooking
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 rounded-full px-3"
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          title="Mark order as ready to serve"
                        >
                          Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 rounded-full px-3"
                          onClick={() => handleStatusUpdate(order.id, 'served')}
                          title="Mark order as served"
                        >
                          Served
                        </Button>
                      )}
                      {order.status === 'served' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-300 text-xs h-7 rounded-full px-3"
                          onClick={() => handleStatusUpdate(order.id, 'paid')}
                          title="Mark order as paid"
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory Management */}
          <div>
            <h2 className="text-sm font-medium mb-4">Inventory Management</h2>
            {inventory?.length === 0 ? (
              <p className="text-xs text-gray-500 py-8">No inventory</p>
            ) : (
              <div className="space-y-2">
                {inventory?.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.itemName}</p>
                        <p className="text-xs text-gray-600">{item.unit}</p>
                      </div>
                      
                      {editingInventory[item.id] !== undefined ? (
                        <div className="flex gap-2 items-center">
                          <Input 
                            type="number"
                            value={editingInventory[item.id] || ''}
                            onChange={e => handleInventoryChange(item.id, e.target.value)}
                            className="w-20 border-gray-300 text-sm h-8"
                            placeholder="Qty"
                          />
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                            onClick={() => saveInventory(item.id)}
                            title="Save inventory update"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-gray-300 h-8 w-8 p-0"
                            onClick={() => setEditingInventory(prev => { delete prev[item.id]; return prev; })}
                            title="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${parseFloat(item.quantity || "0") < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.quantity}
                            </p>
                            {parseFloat(item.quantity || "0") < 5 && (
                              <Badge variant="destructive" className="text-xs mt-1">Low</Badge>
                            )}
                          </div>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-gray-300 h-8 w-8 p-0"
                            onClick={() => handleInventoryChange(item.id, item.quantity || '0')}
                            title="Edit inventory quantity"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
            <AlertDialogTitle>
              {confirmAction?.type === 'status' && 'Confirm Order Status Update'}
              {confirmAction?.type === 'order' && 'Confirm New Order'}
              {confirmAction?.type === 'inventory' && 'Confirm Inventory Update'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'status' && `Mark order as "${confirmAction.status}"?`}
              {confirmAction?.type === 'order' && (
                <div className="space-y-2 mt-4">
                  <p><span className="font-medium">Customer:</span> {confirmAction.name}</p>
                  <p><span className="font-medium">Items:</span> {confirmAction.items.length}</p>
                </div>
              )}
              {confirmAction?.type === 'inventory' && `Update quantity to ${confirmAction.quantity}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmAction?.type === 'status') executeStatusUpdate();
                if (confirmAction?.type === 'order') executeQuickOrder();
                if (confirmAction?.type === 'inventory') {
                  // TODO: Implement inventory update API
                  toast.success("Inventory updated");
                  setShowConfirm(false);
                  setConfirmAction(null);
                }
              }}
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
