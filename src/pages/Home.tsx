import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, ShoppingCart, Plus, Minus, X,
  ChevronDown, ChevronUp, Clock, CheckCircle2, ChefHat,
  Hotel, Utensils, Flame,
} from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useSocket } from "@/hooks/useSocket";

// ── localStorage keys ──────────────────────────────────────────────────────
// Phase 3: new domain-aligned keys
const LS_GUEST_NAME = "qh_guest_name";
const LS_GUEST_ID   = "qh_guest_id";
const LS_VISIT_ID   = "qh_visit_id";
const LS_PREV_NAME  = "qh_previous_name";

// Legacy keys (pre-Phase 3) — read-only for autofill hint fallback
const LS_LEGACY_NAME = "qh_customer_name";
const LS_LEGACY_ID   = "qh_customer_id";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read a numeric value from localStorage. Returns null if missing or invalid.
 */
function readStoredInt(key: string): number | null {
  const s = localStorage.getItem(key);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Both guestId AND visitId must be present and positive integers for the
 * stored session to be considered valid. If only one exists we treat the
 * whole session as incomplete and restart the flow.
 */
function readStoredSession(): { guestId: number; visitId: number; guestName: string } | null {
  const guestId  = readStoredInt(LS_GUEST_ID);
  const visitId  = readStoredInt(LS_VISIT_ID);
  const guestName = localStorage.getItem(LS_GUEST_NAME) ?? "";
  if (guestId && visitId && guestName) return { guestId, visitId, guestName };
  return null;
}

function clearStoredSession() {
  localStorage.removeItem(LS_GUEST_NAME);
  localStorage.removeItem(LS_GUEST_ID);
  localStorage.removeItem(LS_VISIT_ID);
  // Clear previous name so it does not surface as autofill hint for the next guest
  localStorage.removeItem(LS_PREV_NAME);
  // Legacy keys — clear on explicit sign-out so they don't resurface
  localStorage.removeItem(LS_LEGACY_NAME);
  localStorage.removeItem(LS_LEGACY_ID);
}

function saveStoredSession(guestId: number, visitId: number, name: string) {
  localStorage.setItem(LS_GUEST_NAME, name);
  localStorage.setItem(LS_GUEST_ID,   String(guestId));
  localStorage.setItem(LS_VISIT_ID,   String(visitId));
  localStorage.setItem(LS_PREV_NAME,  name);
}

// ── OrderCard ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready:     "bg-green-100 text-green-800",
  served:    "bg-gray-200 text-gray-700",
  paid:      "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function OrderCard({ order }: { order: any }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">#{order.id}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-700"}`}>
            {(t.status as any)[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-600 text-sm">Rs. {(order.totalAmount ?? 0).toFixed(0)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <div className="space-y-1">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                <span className="text-gray-600">Rs. {(item.unitPrice * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
            <span>{t.total}</span>
            <span className="text-orange-600">Rs. {(order.totalAmount ?? 0).toFixed(0)}</span>
          </div>
          {order.paymentStatus === "paid" && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t.payStatus.paid} — {order.paymentMethod}
            </p>
          )}
          {order.paymentStatus === "partial" && (
            <p className="text-xs text-amber-600">
              {t.payStatus.partial}: Rs. {(order.paidAmount ?? 0).toFixed(0)} / Rs. {(order.totalAmount ?? 0).toFixed(0)}
            </p>
          )}
          {order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
            <p className="text-xs text-red-500">{t.payStatus.unpaid}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Home ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { t } = useLang();

  // ── Session state ──────────────────────────────────────────────────────
  // Initialise from localStorage only when BOTH guestId and visitId are
  // present. If only one key exists the session is incomplete — start fresh.
  const storedSession = readStoredSession();

  const [guestName,  setGuestName]  = useState(storedSession?.guestName ?? "");
  const [guestId,    setGuestId]    = useState<number | null>(storedSession?.guestId ?? null);
  const [visitId,    setVisitId]    = useState<number | null>(storedSession?.visitId ?? null);

  // Autofill hint: prefer new key, fall back to legacy key
  const [previousName, setPreviousName] = useState(
    () => localStorage.getItem(LS_PREV_NAME) ?? localStorage.getItem(LS_LEGACY_NAME) ?? ""
  );

  const [cart,       setCart]       = useState<any[]>([]);
  const [activeTab,  setActiveTab]  = useState<"menu" | "history">("menu");
  const [placing,    setPlacing]    = useState(false);

  // Guard against concurrent / double-tap submissions (idempotency)
  const submittingRef = useRef(false);

  // Derived: is the session fully established?
  const sessionActive = guestId !== null && visitId !== null;

  // ── tRPC queries ───────────────────────────────────────────────────────
  const { data: menu, isLoading: menuLoading } =
    trpc.hotel.getMenu.useQuery(undefined, { enabled: sessionActive });

  // Use guestName for order history — same backend query, backward compat
  const { data: myOrders, isLoading: ordersLoading, refetch: refetchOrders } =
    trpc.hotel.getCustomerOrders.useQuery(
      { customerName: guestName },
      { enabled: sessionActive && !!guestName, refetchInterval: 15000 }
    );

  // ── tRPC mutations ─────────────────────────────────────────────────────
  const createGuest = trpc.guest.createGuest.useMutation();
  const openVisit   = trpc.visit.openVisit.useMutation();
  const placeOrder  = trpc.hotel.placeOrder.useMutation();

  // ── Sync effect: restore session on mount ─────────────────────────────
  // Extra safety: if component mounts and localStorage has a valid session
  // but state hasn't been set yet (edge case with strict-mode double invoke),
  // restore it. No-op if already restored from useState initialiser.
  useEffect(() => {
    if (!sessionActive) {
      const s = readStoredSession();
      if (s) {
        setGuestName(s.guestName);
        setGuestId(s.guestId);
        setVisitId(s.visitId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime: keep order history live for this guest ───────────────────
  const socket = useSocket();
  useEffect(() => {
    if (!sessionActive) return;
    const handler = () => refetchOrders();
    socket.on("order.updated", handler);
    socket.on("order.created", handler);
    return () => {
      socket.off("order.updated", handler);
      socket.off("order.created", handler);
    };
  }, [socket, sessionActive, refetchOrders]);

  // ── Derived cart values ────────────────────────────────────────────────
  const hasOrders  = (myOrders?.length ?? 0) > 0;
  const cartTotal  = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount  = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const getQty     = (id: number) => cart.find(c => c.id === id)?.quantity ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────

  /**
   * Entry flow: createGuest → openVisit
   * Double-submission is prevented by both the mutation isPending flag and
   * a ref guard that survives React re-renders within the same event flush.
   */
  const handleSubmit = async () => {
    if (!guestName.trim()) { toast.error("Enter your name"); return; }

    // Idempotency guard — prevents double-tap / concurrent calls
    if (submittingRef.current || createGuest.isPending || openVisit.isPending) return;
    submittingRef.current = true;

    try {
      // Step 1: create (or resume) guest by name
      const guestResult = await createGuest.mutateAsync({ name: guestName.trim() });
      const newGuestId  = guestResult.data.id;

      // Step 2: open a new visit for this guest
      const visitResult = await openVisit.mutateAsync({ guestId: newGuestId });
      const newVisitId  = visitResult.data.id;

      // Persist session — both keys written atomically from the caller's POV
      saveStoredSession(newGuestId, newVisitId, guestName.trim());
      setPreviousName(guestName.trim());

      setGuestId(newGuestId);
      setVisitId(newVisitId);

      toast.success(`${t.welcome}, ${guestName.trim()}!`);
    } catch {
      toast.error("Failed to start visit");
    } finally {
      submittingRef.current = false;
    }
  };

  /** Reset to name-entry screen and wipe the stored session. */
  const handleChangeName = () => {
    setGuestId(null);
    setVisitId(null);
    setGuestName("");
    setPreviousName("");   // clear autofill hint — next guest should not see previous guest's name
    setCart([]);
    clearStoredSession();
  };

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

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !guestId || !visitId) return;
    setPlacing(true);
    try {
      const result = await placeOrder.mutateAsync({
        customerName: guestName,
        customerId:   guestId,
        visitId,
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity, unitPrice: i.price })),
      });
      toast.success(`${t.orderPlaced} #${result.orderId} 🎉`);
      setCart([]);
      refetchOrders();
      setActiveTab("history");
    } catch {
      toast.error("Failed to place order");
    }
    setPlacing(false);
  };

  // ── Name entry screen ──────────────────────────────────────────────────
  if (!sessionActive) {
    const isBusy = createGuest.isPending || openVisit.isPending || submittingRef.current;

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3 shadow-inner">
              <Hotel className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.hotelName}</h1>
            <p className="text-sm text-gray-500 mt-1">{t.enterName}</p>
          </div>

          <LangSwitcher className="justify-center mb-6" />

          <div className="space-y-3">
            <Input
              placeholder={t.namePlaceholder}
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isBusy && handleSubmit()}
              className="h-14 text-lg text-center"
              autoFocus
              disabled={isBusy}
            />

            {/* Autofill hint — shows legacy name OR previous name if different */}
            {previousName && guestName.trim() !== previousName.trim() && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setGuestName(previousName)}
                  disabled={isBusy}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/50 rounded-lg shadow-sm transition-all duration-200 cursor-pointer group disabled:opacity-50"
                >
                  <span>{t.tapToAutofill}</span>
                  <span className="font-semibold underline group-hover:text-orange-950">{previousName}</span>
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isBusy}
              className="w-full h-14 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-lg font-semibold rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="animate-spin" /> : t.continueBtn}
            </button>
          </div>

          <div className="mt-6 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center gap-2">
            <Flame className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
            <p className="text-xs text-gray-600">Cricket Live: Pakistan needs 40 runs in 5 overs</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main app (session active) ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: cartCount > 0 ? "9rem" : "1.5rem" }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-lg font-bold">{t.hotelName}</h1>
              <p className="text-xs text-gray-500">{t.welcome}, {guestName}</p>
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <button
                onClick={handleChangeName}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-50"
              >
                {t.changeName}
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("menu")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "menu" ? "bg-white shadow text-black" : "text-gray-500"}`}
            >
              {t.menu}
            </button>
            <button
              onClick={() => hasOrders && setActiveTab("history")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5
                ${!hasOrders ? "text-gray-300 cursor-not-allowed" : activeTab === "history" ? "bg-white shadow text-black" : "text-gray-500"}`}
            >
              {t.myOrders}
              {hasOrders && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {myOrders!.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Menu Tab ── */}
      {activeTab === "menu" && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          {menuLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-7 w-7" /></div>
          ) : (
            <div className="space-y-2">
              {menu?.map(item => {
                const qty = getQty(item.id);
                return (
                  <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                    <div className="flex items-stretch">
                      {/* Image */}
                      {item.imageUrl ? (
                        <div className="w-24 h-24 shrink-0 overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
                          <Utensils className="w-8 h-8" />
                        </div>
                      )}

                      {/* Info + controls */}
                      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-base font-bold text-orange-600">Rs. {item.price}</span>

                          {qty === 0 ? (
                            <button
                              onClick={() => handleAdd(item)}
                              className="flex items-center gap-1 bg-black text-white text-xs font-semibold px-3 py-2 rounded-xl"
                            >
                              <Plus className="w-3.5 h-3.5" /> {t.addToCart}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDec(item.id)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-5 text-center font-bold text-sm">{qty}</span>
                              <button
                                onClick={() => handleAdd(item)}
                                className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-2">
          {ordersLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin h-7 w-7" /></div>
          ) : myOrders && myOrders.length > 0 ? (
            myOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <div className="text-center py-20 text-gray-400">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── Floating cart ── */}
      {cartCount > 0 && activeTab === "menu" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
          <div className="max-w-lg mx-auto space-y-2">
            {/* Cart items */}
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs bg-gray-50 px-3 py-1.5 rounded-lg">
                  <span className="font-medium">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-semibold">Rs. {(item.price * item.quantity).toFixed(0)}</span>
                    <button
                      onClick={() => setCart(c => c.filter(i => i.id !== item.id))}
                      className="text-gray-300 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Place order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {placing ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>{t.placeOrder}</span>
                  <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">Rs. {cartTotal.toFixed(0)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
