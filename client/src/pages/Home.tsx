import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Grid3x3, List, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Home() {
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const { data: menu, isLoading: menuLoading } = trpc.hotel.getMenu.useQuery();
  const getOrCreateCustomer = trpc.hotel.getOrCreateCustomer.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();
  const processPayment = trpc.hotel.processPayment.useMutation();

  const handleCustomerSubmit = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      const customer = await getOrCreateCustomer.mutateAsync({
        name: customerName,
      });
      setCustomerId(customer.id);
      toast.success(`Welcome, ${customerName}! 👋`);
    } catch (err) {
      toast.error("Failed to identify customer");
    }
  };

  const handleAddToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart(cart.filter(c => c.id !== itemId));
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        unitPrice: item.price.toString()
      }));

      const result = await placeOrder.mutateAsync({
        customerName,
        customerId: customerId || undefined,
        items: orderItems,
        isReorder: true // Always try to add to existing unpaid order
      });

      // Process payment
      const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      await processPayment.mutateAsync({
        orderId: result.orderId,
        amount: totalAmount,
        method: paymentMethod
      });

      toast.success(`Order #${result.orderId} placed! Payment: ${paymentMethod}`);
      setCart([]);
      setShowCheckout(false);
      setPaymentMethod(null);
    } catch (err) {
      toast.error("Failed to place order");
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  }, [cart]);

  if (!customerId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light tracking-tight mb-2">Quetta Hotel</h1>
            <p className="text-sm text-gray-600">Welcome! Please enter your name to continue</p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Your name or table number"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCustomerSubmit()}
              className="h-12 text-base"
            />
            <Button
              onClick={handleCustomerSubmit}
              disabled={getOrCreateCustomer.isPending}
              className="w-full h-12 bg-black text-white hover:bg-gray-800 font-medium"
            >
              {getOrCreateCustomer.isPending ? <Loader2 className="animate-spin" /> : "Continue"}
            </Button>
          </div>

          <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-gray-600">
              🔥 <strong>Cricket Live:</strong> Pakistan needs 40 runs in 5 overs
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (menuLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-light tracking-tight">Quetta Hotel</h1>
              <p className="text-xs text-gray-600">Welcome, {customerName}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCustomerId(null);
                setCustomerName("");
                setCart([]);
              }}
              className="text-xs"
            >
              Change
            </Button>
          </div>

          {/* View Toggle & Cricket */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className="h-8"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className="h-8"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-orange-600 font-medium">🔥 Pakistan 40/5 overs</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu?.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition">
                <div className="h-40 bg-gray-100 overflow-hidden">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-600 mb-3">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-orange-600">Rs. {item.price}</span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="bg-black hover:bg-gray-800 text-white text-xs h-8"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {menu?.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-orange-600 min-w-20 text-right">Rs. {item.price}</span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    className="bg-black hover:bg-gray-800 text-white text-xs h-8"
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-gray-600">{cart.length} items</p>
                <p className="text-lg font-semibold">Rs. {cartTotal}</p>
              </div>
              <Button
                onClick={() => setShowCheckout(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Checkout
              </Button>
            </div>

            {/* Cart Items Preview */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                  <span>{item.name} x{item.quantity}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    <button onClick={() => handleRemoveFromCart(item.id)} className="text-gray-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <AlertDialog open={showCheckout} onOpenChange={setShowCheckout}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Select Payment Method</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3 my-4">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`w-full p-4 border-2 rounded-lg text-center font-medium transition ${
                paymentMethod === "cash"
                  ? "border-green-600 bg-green-50 text-green-900"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              💵 Cash Payment
            </button>
            <button
              onClick={() => setPaymentMethod("bank")}
              className={`w-full p-4 border-2 rounded-lg text-center font-medium transition ${
                paymentMethod === "bank"
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              🏦 Bank Transfer
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-medium mb-1">Order Summary</p>
            {cart.map(item => (
              <p key={item.id} className="text-xs text-gray-600">
                {item.name} x{item.quantity} = Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}
              </p>
            ))}
            <p className="font-semibold text-lg mt-2 text-orange-600">Total: Rs. {cartTotal}</p>
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePlaceOrder}
              disabled={!paymentMethod || placeOrder.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {placeOrder.isPending ? "Processing..." : "Confirm Order"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
