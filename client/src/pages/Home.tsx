import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShoppingCart, Plus, Minus, Grid3x3, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Home() {
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(false);
  
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

  const handleOrderClick = () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    if (Object.keys(cart).length === 0) {
      toast.error("Please add items to your order");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    setPendingOrder(true);
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
        customerName: customerName.trim()
      });
      setCart({});
      setCustomerName("");
      setShowConfirm(false);
      toast.success("Order placed! Your chai is being prepared. ☕");
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPendingOrder(false);
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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-light tracking-tight">Quetta Hotel</h1>
          {cartCount > 0 && (
            <div className="flex items-center gap-2 text-sm bg-orange-100 px-3 py-1 rounded-full">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-600">{cartCount}</span>
            </div>
          )}
        </div>
      </header>

      {/* Customer Name Input */}
      <div className="max-w-7xl mx-auto px-4 py-6 border-b border-gray-200">
        <label className="text-sm font-medium text-gray-700 block mb-2">Your Name</label>
        <Input 
          placeholder="Enter your name or table number"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          className="border-gray-300 text-sm"
        />
      </div>

      {/* Ghap-Shap Mode */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">🔥 <span className="font-medium">Cricket Live:</span> Pakistan needs 40 runs in 5 overs</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-2">
        <Button 
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
          className={viewMode === "grid" ? "bg-black text-white" : "border-gray-300"}
        >
          <Grid3x3 className="w-4 h-4 mr-2" /> Grid
        </Button>
        <Button 
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
          className={viewMode === "list" ? "bg-black text-white" : "border-gray-300"}
        >
          <List className="w-4 h-4 mr-2" /> List
        </Button>
      </div>

      {/* Menu */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu?.map(item => (
              <div key={item.id} className="group">
                <div className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors border border-gray-200">
                  {/* Item Image */}
                  <div className="h-40 bg-gray-200 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl">☕</div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-base">{item.name}</h3>
                      <span className="text-sm font-semibold text-orange-600">Rs. {item.price}</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.description}</p>

                    {/* Add to Cart */}
                    {cart[item.id] ? (
                      <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 border border-gray-300">
                        <button 
                          className="text-gray-600 hover:text-black"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove one item"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium flex-1 text-center">{cart[item.id]}</span>
                        <button 
                          className="text-gray-600 hover:text-black"
                          onClick={() => addToCart(item.id)}
                          title="Add one item"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-black hover:bg-gray-800 text-white text-sm h-9 rounded-full"
                        onClick={() => addToCart(item.id)}
                        title="Add this item to your order"
                      >
                        Add to Order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {menu?.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex gap-4 hover:bg-gray-100 transition-colors">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-200 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-2xl">☕</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <p className="text-sm font-semibold text-orange-600">Rs. {item.price}</p>
                  </div>

                  {/* Add to Cart */}
                  {cart[item.id] ? (
                    <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 border border-gray-300">
                      <button 
                        className="text-gray-600 hover:text-black"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove one item"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{cart[item.id]}</span>
                      <button 
                        className="text-gray-600 hover:text-black"
                        onClick={() => addToCart(item.id)}
                        title="Add one item"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button 
                      className="bg-black hover:bg-gray-800 text-white text-sm h-9 rounded-full px-6"
                      onClick={() => addToCart(item.id)}
                      title="Add this item to your order"
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-sm">
              <p className="text-gray-600">{cartCount} items</p>
              <p className="text-lg font-semibold">Rs. {cartTotal.toFixed(2)}</p>
            </div>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-full"
              onClick={handleOrderClick}
              disabled={placeOrder.isPending || !customerName.trim()}
              title="Place your order"
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Placing...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Order</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-4">
                <p><span className="font-medium">Name:</span> {customerName}</p>
                <p><span className="font-medium">Items:</span> {cartCount}</p>
                <p><span className="font-medium">Total:</span> Rs. {cartTotal.toFixed(2)}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmOrder}
              disabled={pendingOrder}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {pendingOrder ? "Placing..." : "Confirm Order"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
