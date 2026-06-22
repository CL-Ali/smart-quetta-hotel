import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingCart, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
      toast.success("Order placed! Your chai is being prepared.");
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    }
  };

  if (menuLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin h-8 w-8 text-black" />
      </div>
    );
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu?.find(m => m.id === parseInt(id));
    return sum + parseFloat(item?.price || "0") * qty;
  }, 0);

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-light tracking-tight">Quetta Hotel</h1>
          {cartCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>{cartCount} items</span>
            </div>
          )}
        </div>
      </header>

      {/* Ghap-Shap Mode - Minimal Style */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">🔥 <span className="font-medium">Cricket Live:</span> Pakistan needs 40 runs in 5 overs</p>
        </div>
      </div>

      {/* Menu Grid - Minimal Cards */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu?.map(item => (
            <div key={item.id} className="group">
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                {/* Item Image */}
                <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center mb-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full rounded-md" />
                  ) : (
                    <span className="text-4xl">☕</span>
                  )}
                </div>

                {/* Item Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-base">{item.name}</h3>
                    <span className="text-sm font-semibold text-orange-600">Rs. {item.price}</span>
                  </div>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>

                {/* Add to Cart */}
                <div className="mt-4">
                  {cart[item.id] ? (
                    <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 border border-gray-300">
                      <button 
                        className="flex-1 text-left"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="h-3 w-3 inline" />
                      </button>
                      <span className="text-sm font-medium flex-1 text-center">{cart[item.id]}</span>
                      <button 
                        className="flex-1 text-right"
                        onClick={() => addToCart(item.id)}
                      >
                        <Plus className="h-3 w-3 inline" />
                      </button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-black hover:bg-gray-800 text-white text-sm h-9 rounded-full"
                      onClick={() => addToCart(item.id)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Footer - Minimal */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-sm">
              <p className="text-gray-600">{cartCount} items</p>
              <p className="text-lg font-semibold">Rs. {cartTotal.toFixed(2)}</p>
            </div>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-full"
              onClick={handleOrder}
              disabled={placeOrder.isPending}
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Placing...
                </>
              ) : (
                "Order"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
