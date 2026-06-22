import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const { data: menu, isLoading: menuLoading } = trpc.hotel.getMenu.useQuery();
  const placeOrder = trpc.hotel.placeOrder.useMutation();

  const addToCart = (id: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id]--;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const handleOrder = async () => {
    if (Object.keys(cart).length === 0) return;
    
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const item = menu?.find(m => m.id === parseInt(id));
      return {
        menuItemId: parseInt(id),
        quantity: qty,
        unitPrice: item?.price || "0"
      };
    });

    try {
      await placeOrder.mutateAsync({
        items: orderItems,
        customerName: "Guest" // Placeholder for now
      });
      setCart({});
      alert("Order placed! Lala chai bana raha hai.");
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    }
  };

  if (menuLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#F4F9F4] pb-24">
      <header className="bg-[#1A2F24] text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-[#D35400]" />
          <h1 className="text-xl font-bold font-serif">Smart Quetta Hotel</h1>
        </div>
        <Badge variant="secondary" className="bg-[#D35400] text-white">
          <ShoppingCart className="w-4 h-4 mr-1" /> {cartCount}
        </Badge>
      </header>

      <main className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu?.map(item => (
          <Card key={item.id} className="border-2 border-[#1A2F24] overflow-hidden">
            <div className="h-48 bg-muted flex items-center justify-center relative">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-4xl">☕</span>
              )}
              <div className="absolute top-2 right-2">
                <Badge className="bg-[#D35400]">{item.category}</Badge>
              </div>
            </div>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-serif text-[#1A2F24]">{item.name}</CardTitle>
                <span className="font-bold text-[#D35400]">Rs. {item.price}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              {cart[item.id] ? (
                <div className="flex items-center gap-4 bg-[#F4F9F4] rounded-full px-2 py-1 border border-[#1A2F24]">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => removeFromCart(item.id)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold">{cart[item.id]}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => addToCart(item.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button className="w-full bg-[#1A2F24] hover:bg-[#3E4A42]" onClick={() => addToCart(item.id)}>
                  Add to Order
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-4 border-[#D35400] flex justify-between items-center shadow-2xl">
          <div>
            <p className="text-sm text-muted-foreground">Total Items: {cartCount}</p>
            <p className="text-lg font-bold text-[#1A2F24]">
              Rs. {Object.entries(cart).reduce((sum, [id, qty]) => {
                const item = menu?.find(m => m.id === parseInt(id));
                return sum + parseFloat(item?.price || "0") * qty;
              }, 0)}
            </p>
          </div>
          <Button 
            className="bg-[#D35400] hover:bg-[#A04000] text-white px-8 font-bold"
            onClick={handleOrder}
            disabled={placeOrder.isPending}
          >
            {placeOrder.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
            Order Karein
          </Button>
        </div>
      )}
    </div>
  );
}
