import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, Clock, Package, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.hotel.getOrders.useQuery();
  const { data: cashReport } = trpc.hotel.getCashReport.useQuery();
  const { data: inventory } = trpc.hotel.getInventory.useQuery();
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const handleStatusUpdate = async (id: number, status: any) => {
    await updateStatus.mutateAsync({ orderId: id, status });
    refetchOrders();
  };

  if (ordersLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 bg-[#F4F9F4] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-serif text-[#1A2F24]">Lala's Control Room</h1>
        <Button variant="outline" onClick={() => refetchOrders()} className="border-[#1A2F24]">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-t-4 border-t-[#D35400]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Live Galla (Cash)</CardTitle>
            <DollarSign className="h-4 w-4 text-[#D35400]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {cashReport?.totalCash || "0.00"}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#1A2F24]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-[#1A2F24]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#3E4A42]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <Package className="h-4 w-4 text-[#3E4A42]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory?.filter(i => parseFloat(i.quantity || "0") < 5).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-[#1A2F24]">
        <CardHeader>
          <CardTitle className="font-serif">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer/Table</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map(order => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.customerName || "Guest"} / {order.seatingAreaId || "N/A"}</TableCell>
                  <TableCell>Rs. {order.totalAmount}</TableCell>
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
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'preparing')}>Start</Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(order.id, 'ready')}>Ready</Button>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" className="bg-[#D35400]" onClick={() => handleStatusUpdate(order.id, 'served')}>Served</Button>
                      )}
                      {order.status === 'served' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(order.id, 'paid')}>Mark Paid</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
