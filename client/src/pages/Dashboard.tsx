import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, DollarSign, Clock, Package, AlertCircle } from "lucide-react";
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
        customerName: quickOrderName || "Counter Guest",
        items
      });
      setQuickOrderName("");
      setSelectedItems({});
      refetchOrders();
      toast.success("Order added to Galla!");
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
      <div className="flex justify-center items-center h-screen bg-[#F4F9F4]">
        <Loader2 className="animate-spin h-12 w-12 text-[#1A2F24]" />
      </div>
    );
  }

  const lowStockItems = inventory?.filter(i => parseFloat(i.quantity || "0") < 5) || [];
  const activeOrders = orders?.filter(o => o.status !== 'paid' && o.status !== 'cancelled') || [];

  return (
    <div className="p-6 bg-[#F4F9F4] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-serif text-[#1A2F24]">Lala's Control Room</h1>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#D35400] hover:bg-[#A04000] text-white font-bold">
                + Quick Add Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#1A2F24]">Add Manual Order</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#1A2F24] font-bold">Customer/Area Name</Label>
                    <Input 
                      placeholder="e.g. Takht 1" 
                      value={quickOrderName} 
                      onChange={e => setQuickOrderName(e.target.value)}
                      className="border-2 border-[#1A2F24]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {menu?.map(item => (
                      <Button 
                        key={item.id} 
                        variant="outline" 
                        className="h-auto py-2 flex flex-col items-start border-2 border-[#1A2F24] hover:bg-[#F4F9F4]"
                        onClick={() => toggleItem(item.id)}
                      >
                        <span className="font-bold text-[#1A2F24]">{item.name}</span>
                        <span className="text-xs text-muted-foreground">Rs. {item.price}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="border-l-2 border-[#1A2F24] pl-6 space-y-4">
                  <h3 className="font-bold border-b-2 border-[#1A2F24] pb-2 text-[#1A2F24]">Selected Items</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {Object.entries(selectedItems).map(([id, qty]) => {
                      const item = menu?.find(m => m.id === parseInt(id));
                      return (
                        <div key={id} className="flex justify-between text-sm">
                          <span className="font-semibold">{item?.name} x {qty}</span>
                          <span className="text-[#D35400]">Rs. {parseFloat(item?.price || "0") * qty}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t-2 border-[#1A2F24]">
                    <div className="flex justify-between font-bold text-lg mb-4 text-[#1A2F24]">
                      <span>Total:</span>
                      <span className="text-[#D35400]">Rs. {Object.entries(selectedItems).reduce((sum, [id, qty]) => {
                        const item = menu?.find(m => m.id === parseInt(id));
                        return sum + parseFloat(item?.price || "0") * qty;
                      }, 0)}</span>
                    </div>
                    <Button 
                      className="w-full bg-[#1A2F24] hover:bg-[#3E4A42] text-white font-bold"
                      onClick={handleQuickOrder} 
                      disabled={Object.keys(selectedItems).length === 0 || placeOrder.isPending}
                    >
                      {placeOrder.isPending ? "Adding..." : "Place Order"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={() => refetchOrders()} 
            className="border-2 border-[#1A2F24] text-[#1A2F24]"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-t-4 border-t-[#D35400] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-[#1A2F24]">Live Galla (Cash)</CardTitle>
            <DollarSign className="h-5 w-5 text-[#D35400]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A2F24]">Rs. {cashReport?.totalCash || "0.00"}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#1A2F24] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-[#1A2F24]">Active Orders</CardTitle>
            <Clock className="h-5 w-5 text-[#1A2F24]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A2F24]">{activeOrders.length}</div>
          </CardContent>
        </Card>

        <Card className={`border-t-4 ${lowStockItems.length > 0 ? 'border-t-red-500' : 'border-t-green-500'} bg-white`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-[#1A2F24]">Low Stock Alerts</CardTitle>
            {lowStockItems.length > 0 ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Package className="h-5 w-5 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A2F24]">{lowStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders and Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-2 border-[#1A2F24]">
          <CardHeader>
            <CardTitle className="font-serif text-[#1A2F24]">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet. Sukoon hai!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#1A2F24] font-bold">Order</TableHead>
                    <TableHead className="text-[#1A2F24] font-bold">Customer</TableHead>
                    <TableHead className="text-[#1A2F24] font-bold">Status</TableHead>
                    <TableHead className="text-[#1A2F24] font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-bold">#{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.status === 'ready' ? 'bg-green-500' : 
                          order.status === 'preparing' ? 'bg-blue-500' : 
                          'bg-gray-500'
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, 'paid')}
                          className="border-[#1A2F24] text-[#1A2F24]"
                        >
                          Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card className="border-2 border-[#1A2F24]">
          <CardHeader>
            <CardTitle className="font-serif text-[#1A2F24]">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            {inventory?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No inventory tracked</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#1A2F24] font-bold">Item</TableHead>
                    <TableHead className="text-[#1A2F24] font-bold">Stock</TableHead>
                    <TableHead className="text-[#1A2F24] font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold">{item.itemName}</TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell>
                        {parseFloat(item.quantity || "0") < 5 ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-green-500">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
