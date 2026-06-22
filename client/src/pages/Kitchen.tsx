import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Kitchen() {
  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 5000 // Poll every 5 seconds for new orders
  });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const activeOrders = orders?.filter(o => o.status === 'pending' || o.status === 'preparing');

  const handleStatusUpdate = async (id: number, status: any) => {
    await updateStatus.mutateAsync({ orderId: id, status });
    refetch();
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#1A2F24] p-6 text-white">
      <header className="flex justify-between items-center mb-8 border-b-4 border-[#D35400] pb-4">
        <div className="flex items-center gap-3">
          <Bell className="text-[#D35400] h-8 w-8" />
          <h1 className="text-4xl font-bold font-serif">Kitchen Display</h1>
        </div>
        <div className="text-2xl font-bold bg-[#D35400] px-4 py-2">
          {activeOrders?.length} Orders Active
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders?.map(order => (
          <Card key={order.id} className="bg-white text-[#1A2F24] border-4 border-[#D35400]">
            <CardHeader className="bg-[#F4F9F4] border-b-2 border-[#1A2F24] flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">#{order.id}</CardTitle>
                <p className="text-sm font-semibold">{order.customerName || "Table/Area"}</p>
              </div>
              <Badge className={order.status === 'preparing' ? 'bg-blue-600' : 'bg-[#D35400]'}>
                {order.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 min-h-[150px]">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <p key={item.id} className="font-bold text-lg">
                    • {item.name} x {item.quantity}
                  </p>
                ))}
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              {order.status === 'pending' ? (
                <Button 
                  className="w-full h-16 text-xl font-bold bg-[#1A2F24] hover:bg-[#3E4A42]"
                  onClick={() => handleStatusUpdate(order.id, 'preparing')}
                >
                  START COOKING
                </Button>
              ) : (
                <Button 
                  className="w-full h-16 text-xl font-bold bg-[#D35400] hover:bg-[#A04000]"
                  onClick={() => handleStatusUpdate(order.id, 'ready')}
                >
                  MARK AS READY
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {activeOrders?.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] opacity-50">
          <CheckCircle className="h-24 w-24 mb-4" />
          <p className="text-3xl font-serif">No pending orders. Sukoon hai!</p>
        </div>
      )}
    </div>
  );
}
