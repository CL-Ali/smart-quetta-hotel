import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, BarChart3, Package, Droplet, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [inventoryEdits, setInventoryEdits] = useState<Record<number, number>>({});
  const [stockEdits, setStockEdits] = useState<Record<number, { total: number; inUse: number; broken: number }>>({});

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 3000
  });
  const { data: inventory, isLoading: inventoryLoading } = trpc.hotel.getInventory.useQuery();
  const { data: stock, isLoading: stockLoading } = trpc.hotel.getStock.useQuery();
  const { data: cashReport } = trpc.hotel.getCashReport.useQuery();
  const { data: bill } = trpc.hotel.getOrderBill.useQuery(
    { orderId: selectedOrderId || 0 },
    { enabled: !!selectedOrderId }
  );

  const updateOrderStatus = trpc.hotel.updateOrderStatus.useMutation();
  const updateInventory = trpc.hotel.updateInventory.useMutation();
  const updateStock = trpc.hotel.updateStock.useMutation();
  const processPayment = trpc.hotel.processPayment.useMutation();

  const handleViewBill = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowBillDialog(true);
  };

  const handleProcessPayment = async (orderId: number, amount: string | number, method: "cash" | "bank") => {
    try {
      await processPayment.mutateAsync({ orderId, amount: typeof amount === 'string' ? parseFloat(amount) : amount, method });
      refetchOrders();
      toast.success(`Payment processed: ${method}`);
    } catch (err) {
      toast.error("Payment failed");
    }
  };

  const handleSaveInventory = async (id: number) => {
    try {
      await updateInventory.mutateAsync({
        inventoryId: id,
        quantity: inventoryEdits[id] || 0
      });
      toast.success("Inventory updated");
      const newEdits = { ...inventoryEdits };
      delete newEdits[id];
      setInventoryEdits(newEdits);
    } catch (err) {
      toast.error("Failed to update inventory");
    }
  };

  const handleSaveStock = async (id: number) => {
    try {
      const edit = stockEdits[id];
      if (!edit) return;
      await updateStock.mutateAsync({
        stockId: id,
        totalQuantity: edit.total,
        inUse: edit.inUse,
        broken: edit.broken
      });
      toast.success("Stock updated");
      const newEdits = { ...stockEdits };
      delete newEdits[id];
      setStockEdits(newEdits);
    } catch (err) {
      toast.error("Failed to update stock");
    }
  };

  if (ordersLoading) {
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-light tracking-tight mb-4">Admin Dashboard</h1>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Live Cash</p>
              <p className="text-2xl font-semibold">Rs. {cashReport?.totalCash || "0"}</p>
              <p className="text-xs text-gray-500 mt-1">{cashReport?.totalOrders || 0} orders</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Pending Orders</p>
              <p className="text-2xl font-semibold">{orders?.filter(o => o.status === 'pending').length || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Unpaid Orders</p>
              <p className="text-2xl font-semibold">{orders?.filter(o => o.paymentStatus === 'unpaid').length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4 mt-6">
            {orders?.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                  <div className="flex gap-2">
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

                {/* Items */}
                <div className="space-y-1 mb-3 pb-3 border-b border-gray-200">
                  {order.items?.map((item: any) => (
                    <p key={item.id} className="text-sm">
                      <span className="font-medium">{item.name}</span> x{item.quantity} = Rs. {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                    </p>
                  ))}
                </div>

                {/* Total & Actions */}
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">Rs. {order.totalAmount}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewBill(order.id)}
                      className="text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Bill
                    </Button>
                    {order.paymentStatus !== 'paid' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => handleProcessPayment(order.id, parseFloat(order.totalAmount || '0'), 'cash')}
                        >
                          💵 Cash
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          onClick={() => handleProcessPayment(order.id, parseFloat(order.totalAmount || '0'), 'bank')}
                        >
                          Bank
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4 mt-6">
            {inventoryLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="space-y-3">
                {inventory?.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-600" />
                        {item.itemName}
                      </p>
                      <p className="text-xs text-gray-600">{item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={inventoryEdits[item.id] !== undefined ? inventoryEdits[item.id] : (item.quantity || 0)}
                        onChange={(e) => setInventoryEdits({ ...inventoryEdits, [item.id]: parseFloat(e.target.value) })}
                        className="w-20 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveInventory(item.id)}
                        className="bg-black hover:bg-gray-800 text-white text-xs h-8"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4 mt-6">
            {stockLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="space-y-3">
                {stock?.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-orange-600" />
                      {item.name}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-600">Total</label>
                        <Input
                          type="number"
                          value={stockEdits[item.id]?.total !== undefined ? stockEdits[item.id].total : (item.totalQuantity || 0)}
                          onChange={(e) => setStockEdits({
                            ...stockEdits,
                            [item.id]: { ...(stockEdits[item.id] || { total: 0, inUse: 0, broken: 0 }), total: parseInt(e.target.value) }
                          })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">In Use</label>
                        <Input
                          type="number"
                          value={stockEdits[item.id]?.inUse !== undefined ? stockEdits[item.id].inUse : (item.inUse || 0)}
                          onChange={(e) => setStockEdits({
                            ...stockEdits,
                            [item.id]: { ...(stockEdits[item.id] || { total: 0, inUse: 0, broken: 0 }), inUse: parseInt(e.target.value) }
                          })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Broken</label>
                        <Input
                          type="number"
                          value={stockEdits[item.id]?.broken !== undefined ? stockEdits[item.id].broken : (item.broken || 0)}
                          onChange={(e) => setStockEdits({
                            ...stockEdits,
                            [item.id]: { ...(stockEdits[item.id] || { total: 0, inUse: 0, broken: 0 }), broken: parseInt(e.target.value) }
                          })}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-xs">
                      <p className="text-gray-600">Available: {item.available}</p>
                      <Button
                        size="sm"
                        onClick={() => handleSaveStock(item.id)}
                        className="bg-black hover:bg-gray-800 text-white h-8"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bill Dialog */}
      <AlertDialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <AlertDialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Order Bill</AlertDialogTitle>
          </AlertDialogHeader>

          {bill && selectedOrderId && (
            <div className="space-y-4 my-4 text-sm">
              <div className="border-b pb-3">
                <p className="font-semibold">Order #{bill.order.id}</p>
                <p className="text-xs text-gray-600">{bill.order.customerName}</p>
                <p className="text-xs text-gray-600">{new Date(bill.order.createdAt).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-xs text-gray-600">Items</p>
                {bill.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span>{item.name} x{item.quantity}</span>
                    <span>Rs. {(parseFloat(item.unitPrice || '0') * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>Rs. {bill.totalAmount || '0'}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Paid:</span>
                  <span>Rs. {(bill.paidAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-orange-600">
                  <span>Remaining:</span>
                  <span>Rs. {(parseFloat(bill.totalAmount || '0') - (bill.paidAmount || 0)).toFixed(2)}</span>
                </div>
              </div>

              {bill.payments?.length > 0 && (
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <p className="font-medium mb-2">Payment History</p>
                  {bill.payments.map((p: any) => (
                    <p key={p.id} className="text-gray-600">
                      {p.method === 'cash' ? '💵' : '🏦'} Rs. {p.amount} ({p.status})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
