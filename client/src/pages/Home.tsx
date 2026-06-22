import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, Plus, Minus, UtensilsCrossed, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Home() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const { data: menu, isLoading: menuLoading, error: menuError } = trpc.hotel.getMenu.useQuery();
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
    if (Object.keys(cart).length === 0) {
      toast.error("Please add items to your order");
      return;
    }
    
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
        customerName: "Guest"
      });
      setCart({});
      toast.success("Order placed! Lala chai bana raha hai. ☕");
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    }
  };

  if (menuLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F4F9F4]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-[#1A2F24] mb-4" />
          <p className="text-[#1A2F24] font-serif">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (menuError || !menu?.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F4F9F4]">
        <Card className="border-2 border-red-500 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Menu Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">We're having trouble loading the menu. Please refresh or try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu?.find(m => m.id === parseInt(id));
    return sum + parseFloat(item?.price || "0") * qty;
  }, 0);

  return (
    <div className="min-h-screen bg-[#F4F9F4] pb-24">
      {/* Header */}
      <header className="bg-[#1A2F24] text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-[#D35400] h-6 w-6" />
          <h1 className="text-xl font-bold font-serif">Smart Quetta Hotel</h1>
        </div>
        {cartCount > 0 && (
          <Badge className="bg-[#D35400] text-white text-base px-3 py-1">
            <ShoppingCart className="w-4 h-4 mr-1" /> {cartCount}
          </Badge>
        )}
      </header>

      {/* Ghap-Shap Mode Banner */}
      <div className="bg-[#1A2F24] text-white p-4 m-4 rounded-lg border-l-4 border-[#D35400]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">🔥 Ghap-Shap Mode</h2>
            <p className="text-xs opacity-80">Cricket Live: Pakistan needs 40 runs in 5 overs!</p>
          </div>
          <Badge className="bg-[#D35400]">LIVE</Badge>
        </div>
      </div>

      {/* Menu Grid */}
      <main className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu.map(item => (
          <Card key={item.id} className="border-2 border-[#1A2F24] overflow-hidden hover:shadow-lg transition-shadow">
            {/* Item Image */}
            <div className="h-40 bg-gradient-to-br from-[#D35400] to-[#1A2F24] flex items-center justify-center relative">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-5xl">☕</span>
              )}
              <div className="absolute top-2 right-2">
                <Badge className="bg-[#D35400] text-white">{item.category}</Badge>
              </div>
            </div>

            {/* Item Details */}
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg font-serif text-[#1A2F24]">{item.name}</CardTitle>
                <span className="font-bold text-[#D35400] text-lg">Rs. {item.price}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </CardHeader>

            {/* Add to Cart Controls */}
            <CardFooter className="p-4 pt-2">
              {cart[item.id] ? (
                <div className="w-full flex items-center gap-2 bg-white rounded-full px-3 py-2 border-2 border-[#1A2F24]">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full hover:bg-[#F4F9F4]"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Minus className="h-4 w-4 text-[#1A2F24]" />
                  </Button>
                  <span className="font-bold flex-1 text-center text-[#1A2F24]">{cart[item.id]}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full hover:bg-[#F4F9F4]"
                    onClick={() => addToCart(item.id)}
                  >
                    <Plus className="h-4 w-4 text-[#1A2F24]" />
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full bg-[#1A2F24] hover:bg-[#3E4A42] text-white font-bold"
                  onClick={() => addToCart(item.id)}
                >
                  Add to Order
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </main>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-4 border-[#D35400] flex justify-between items-center shadow-2xl">
          <div>
            <p className="text-sm text-muted-foreground">Total Items: {cartCount}</p>
            <p className="text-2xl font-bold text-[#1A2F24]">Rs. {cartTotal.toFixed(2)}</p>
          </div>
          <Button 
            className="bg-[#D35400] hover:bg-[#A04000] text-white px-8 font-bold text-lg"
            onClick={handleOrder}
            disabled={placeOrder.isPending}
          >
            {placeOrder.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Processing...
              </>
            ) : (
              "Order Karein"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
