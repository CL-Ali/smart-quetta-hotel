import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Navigation, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Waiter() {
  const { data: orders, isLoading, refetch } = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 5000 // Poll for ready orders
  });
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();

  const readyOrders = orders?.filter(o => o.status === 'ready');
  const servedOrders = orders?.filter(o => o.status === 'served');

  const handleStatusUpdate = async (id: number, status: any) => {
    await updateStatus.mutateAsync({ orderId: id, status });
    refetch();
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F4F9F4] p-4">
      <header className="flex justify-between items-center mb-6 border-b-2 border-[#1A2F24] pb-4">
        <h1 className="text-2xl font-bold font-serif text-[#1A2F24]">Smart Waiter</h1>
        <Badge className="bg-[#D35400]">{readyOrders?.length} Ready to Serve</Badge>
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-[#D35400]" /> Ready for Pickup
          </h2>
          <div className="grid gap-4">
            {readyOrders?.map(order => (
              <Card key={order.id} className="border-2 border-[#D35400]">
                <CardHeader className="p-4 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">#{order.id} - {order.customerName || "Table"}</CardTitle>
                    <p className="text-xs text-muted-foreground">Ready at {new Date(order.updatedAt).toLocaleTimeString()}</p>
                  </div>
                  <Button className="bg-[#D35400]" onClick={() => handleStatusUpdate(order.id, 'served')}>
                    Mark Served
                  </Button>
                </CardHeader>
              </Card>
            ))}
            {readyOrders?.length === 0 && <p className="text-center py-8 text-muted-foreground italic">No orders ready yet.</p>}
          </div>
        </section>

        <section className="opacity-75">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" /> Recently Served
          </h2>
          <div className="grid gap-2">
            {servedOrders?.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white p-3 border border-gray-200 flex justify-between items-center">
                <span>#{order.id} - {order.customerName}</span>
                <span className="text-xs text-muted-foreground">{new Date(order.updatedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
