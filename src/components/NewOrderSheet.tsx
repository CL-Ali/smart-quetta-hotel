import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Minus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent,
} from "@/components/ui/alert-dialog";
import {
  Drawer, DrawerContent,
} from "@/components/ui/drawer";
import { useLang } from "@/contexts/LangContext";
import { useIsMobile } from "@/hooks/useMobile";

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function NewOrderSheet({ open, onClose, onDone }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<any[]>([]);

  const { data: menu, isLoading } = trpc.hotel.getMenu.useQuery(undefined, { enabled: open });
  const getOrCreateCustomer = trpc.hotel.getOrCreateCustomer.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart]
  );

  const handleAdd = (item: any) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleDec = (id: number) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (!ex) return prev;
      if (ex.quantity <= 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const getQty = (id: number) => cart.find(c => c.id === id)?.quantity ?? 0;

  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error("Enter customer name"); return; }
    if (cart.length === 0) { toast.error("Add at least one item"); return; }
    try {
      const customer = await getOrCreateCustomer.mutateAsync({ name: customerName.trim() });
      const result = await placeOrder.mutateAsync({
        customerName: customerName.trim(),
        customerId: customer.id,
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity, unitPrice: i.price })),
      });
      toast.success(`Order #${result.orderId} placed!`);
      setCart([]);
      setCustomerName("");
      onDone();
      onClose();
    } catch { toast.error("Failed to place order"); }
  };

  const handleClose = () => {
    setCart([]);
    setCustomerName("");
    onClose();
  };

  const renderContent = (isMob: boolean) => (
    <div className="flex flex-col h-full overflow-hidden max-h-[80vh]">
      {/* Header */}
      <div className={`px-4 pb-3 border-b border-gray-100 shrink-0 ${isMob ? "pt-2" : "pt-4"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t.newOrder}</h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Input
          placeholder="Customer name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          className="mt-2 h-11"
          autoFocus
        />
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}
        {menu?.map(item => {
          const qty = getQty(item.id);
          return (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-orange-600 font-semibold">Rs. {item.price}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {qty > 0 ? (
                  <>
                    <button onClick={() => handleDec(item.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{qty}</span>
                  </>
                ) : <div className="w-16" />}
                <button onClick={() => handleAdd(item)}
                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`px-4 py-3 border-t border-gray-100 shrink-0 space-y-2 ${isMob ? "pb-8" : "pb-4"}`}>
        {cart.length > 0 && (
          <div className="bg-orange-50 rounded-xl px-3 py-2 flex justify-between text-sm font-semibold text-orange-700">
            <span>{t.total}</span>
            <span>Rs. {cartTotal.toFixed(0)}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleClose}
            className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 cursor-pointer">
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={placeOrder.isPending || !customerName.trim() || cart.length === 0}
            className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 cursor-pointer"
          >
            {placeOrder.isPending ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : t.placeOrder}
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => !v && handleClose()}>
        <DrawerContent className="max-h-[85vh] flex flex-col p-0">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full my-3 shrink-0" />
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={v => !v && handleClose()}>
      <AlertDialogContent className="max-w-sm mx-4 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}
