import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { StorageService } from "@/lib/storage";

export default function Confirmation() {
  const [, setLocation] = useLocation();
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const session = StorageService.loadOrderSession();
  const processPayment = trpc.hotel.processPayment.useMutation();

  if (!session || !session.orderId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">No Active Order</h1>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const cartTotal = session.cart?.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) || 0;
  const remainingAmount = cartTotal - paymentAmount;

  const handlePayment = async () => {
    if (!paymentMethod || paymentAmount <= 0) {
      toast.error("Please select payment method and enter amount");
      return;
    }

    setIsProcessing(true);
    try {
      await processPayment.mutateAsync({
        orderId: session.orderId || 0,
        amount: paymentAmount,
        method: paymentMethod
      });

      toast.success(`Payment of Rs. ${paymentAmount} processed via ${paymentMethod}`);

      // If fully paid, clear session
      if (paymentAmount >= cartTotal) {
        StorageService.clearOrderSession();
        StorageService.clearCart();
        setTimeout(() => setLocation("/"), 2000);
      } else {
        // Update session with new payment info
        session.lastUpdated = Date.now();
        StorageService.saveOrderSession(session);
        setPaymentAmount(0);
        setPaymentMethod(null);
        toast.info(`Remaining: Rs. ${remainingAmount.toFixed(2)}`);
      }
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-light tracking-tight">Order Confirmed!</h1>
          </div>
          <p className="text-sm text-gray-600">Order #{session.orderId || 'N/A'}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Customer</p>
          <p className="font-semibold">{session.customerName}</p>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Order Items</h2>
          <div className="space-y-2">
            {session.cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-600">x {item.quantity}</p>
                </div>
                <p className="font-semibold text-orange-600">
                  Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span>Rs. {cartTotal.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-semibold text-lg">
            <span>Total</span>
            <span className="text-orange-600">Rs. {cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-4">
          <h2 className="font-semibold">Payment</h2>

          {/* Payment Amount */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Amount to Pay</label>
            <Input
              type="number"
              value={paymentAmount || ""}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount"
              className="h-10"
              max={cartTotal}
            />
            <p className="text-xs text-gray-600 mt-1">
              Remaining: Rs. {remainingAmount.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`p-4 border-2 rounded-lg text-center font-medium transition ${
                  paymentMethod === "cash"
                    ? "border-green-600 bg-green-50 text-green-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                💵 Cash
              </button>
              <button
                onClick={() => setPaymentMethod("bank")}
                className={`p-4 border-2 rounded-lg text-center font-medium transition ${
                  paymentMethod === "bank"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                Bank
              </button>
            </div>
          </div>

          {/* Status Badge */}
          {remainingAmount > 0 && (
            <Badge className="bg-orange-600 text-white w-full justify-center py-2">
              Partial Payment: Rs. {remainingAmount.toFixed(2)} remaining
            </Badge>
          )}

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={!paymentMethod || paymentAmount <= 0 || isProcessing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay Rs. ${paymentAmount.toFixed(2)}`
            )}
          </Button>

          {/* Continue Shopping */}
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full h-12"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
