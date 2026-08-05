import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, ShoppingCart, Plus, Minus, X,
  ChevronDown, ChevronUp, Clock, CheckCircle2, ChefHat,
  Hotel, Utensils, Flame, Check,
} from "lucide-react";
import { fmtDateTime } from "@/lib/time";
import { useLang, LANG_OPTIONS } from "@/contexts/LangContext";
import { useSocket } from "@/hooks/useSocket";
import { LangSwitcher } from "@/components/LangSwitcher";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";

// ── localStorage keys ──────────────────────────────────────────────────────
const LS_GUEST_NAME  = "qh_guest_name";
const LS_GUEST_ID    = "qh_guest_id";
const LS_VISIT_ID    = "qh_visit_id";
const LS_PREV_NAME   = "qh_previous_name";
const LS_COOKIE_HASH = "qh_cookie_hash";
const LS_TICKET_NO   = "qh_ticket_no";
const LS_LEGACY_NAME = "qh_customer_name";
const LS_LEGACY_ID   = "qh_customer_id";

// ── Helpers ────────────────────────────────────────────────────────────────

function readStoredInt(key: string): number | null {
  const s = localStorage.getItem(key);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readStoredSession(): { guestId: number; visitId: number; guestName: string } | null {
  const guestId   = readStoredInt(LS_GUEST_ID);
  const visitId   = readStoredInt(LS_VISIT_ID);
  const guestName = localStorage.getItem(LS_GUEST_NAME) ?? "";
  if (guestId && visitId && guestName) return { guestId, visitId, guestName };
  return null;
}

function clearStoredSession() {
  [LS_GUEST_NAME, LS_GUEST_ID, LS_VISIT_ID, LS_COOKIE_HASH, LS_TICKET_NO,
   LS_PREV_NAME, LS_LEGACY_NAME, LS_LEGACY_ID].forEach(k => localStorage.removeItem(k));
}

function saveStoredSession(
  guestId: number, visitId: number, name: string,
  cookieHash: string, ticketNo?: string | null,
) {
  localStorage.setItem(LS_GUEST_NAME,  name);
  localStorage.setItem(LS_GUEST_ID,    String(guestId));
  localStorage.setItem(LS_VISIT_ID,    String(visitId));
  localStorage.setItem(LS_COOKIE_HASH, cookieHash);
  localStorage.setItem(LS_PREV_NAME,   name);
  if (ticketNo) localStorage.setItem(LS_TICKET_NO, ticketNo);
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
            {fmtDateTime(order.createdAt)}
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
              <CheckCircle2 className="w-3 h-3" />{t.payStatus.paid} — {order.paymentMethod}
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

// ── Language selection screen ───────────────────────────────────────────────

function LangSelectScreen({ onDone }: { onDone: () => void }) {
  const { lang, setLang } = useLang();
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3 shadow-inner">
            <Hotel className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Quetta Hotel</h1>
          <p className="text-sm text-gray-500 mt-1">Choose your language / زبان منتخب کریں</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {LANG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer
                ${lang === opt.value
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-gray-200 text-gray-700 hover:border-orange-300"
                }`}
            >
              <span className="text-lg">{opt.flag}</span>
              <span className="flex-1 text-left">{opt.label}</span>
              {lang === opt.value && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
            </button>
          ))}
        </div>

        <button
          onClick={onDone}
          className="w-full h-14 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-lg font-semibold rounded-xl flex items-center justify-center cursor-pointer"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Home ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { t, langSelected } = useLang();
  const isMobile = useIsMobile();
  const [confirmPlace, setConfirmPlace] = useState(false);

  // ── Step state: "lang" → "name" → "menu" ──────────────────────────────
  // If language was never chosen, start at lang step.
  // If session is fully verified, skip straight to menu.
  type Step = "lang" | "name" | "menu";
  const [step, setStep] = useState<Step>(() =>
    !langSelected ? "lang" : "name"
  );

  // ── Session state ──────────────────────────────────────────────────────
  const storedSession = readStoredSession();
  const [guestName,    setGuestName]   = useState(storedSession?.guestName ?? "");
  const [guestId,      setGuestId]     = useState<number | null>(storedSession?.guestId ?? null);
  const [visitId,      setVisitId]     = useState<number | null>(storedSession?.visitId ?? null);
  const [ticketNo,     setTicketNo]    = useState<string | null>(() => localStorage.getItem(LS_TICKET_NO));
  const [guestPhone,   setGuestPhone]  = useState("");
  const [previousName, setPreviousName] = useState(
    () => localStorage.getItem(LS_PREV_NAME) ?? localStorage.getItem(LS_LEGACY_NAME) ?? ""
  );
  const [cart,      setCart]      = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [placing,   setPlacing]   = useState(false);
  const submittingRef = useRef(false);

  // ── tRPC ───────────────────────────────────────────────────────────────
  const isMenuStep = step === "menu";
  const { data: menu,     isLoading: menuLoading }    = trpc.hotel.getMenu.useQuery(undefined, { enabled: isMenuStep });
  const { data: myOrders, isLoading: ordersLoading,
          refetch: refetchOrders }                     = trpc.hotel.getCustomerOrders.useQuery(
    { customerName: guestName },
    { enabled: isMenuStep && !!guestName, refetchInterval: 15000 }
  );
  const { data: visitStatus } = trpc.visit.getVisitStatus.useQuery(
    { visitId: visitId ?? 0 },
    { enabled: langSelected && visitId !== null && step === "name", retry: false }
  );
  const createGuest = trpc.guest.createGuest.useMutation();
  const openVisitM  = trpc.visit.openVisit.useMutation();
  const resumeVisit = trpc.visit.resumeVisit.useMutation();
  const placeOrder  = trpc.hotel.placeOrder.useMutation();

  // ── Visit verification effect ──────────────────────────────────────────
  // After language is chosen and we have a stored session, verify visit.
  // If open → go straight to menu. If closed/missing → open fresh visit.
  useEffect(() => {
    if (step !== "name" || !langSelected) return;
    if (!storedSession) return;       // no stored session → stay on name entry
    if (visitStatus === undefined) return; // query still loading

    let cancelled = false;

    const run = async () => {
      if (visitStatus && visitStatus.status === "open") {
        // Visit still open — restore session and skip to menu
        setGuestId(storedSession.guestId);
        setVisitId(storedSession.visitId);
        setGuestName(storedSession.guestName);
        if (!cancelled) setStep("menu");
      } else {
        // Visit closed or not found — open a fresh one for the same guest
        try {
          const r = await openVisitM.mutateAsync({ guestId: storedSession.guestId });
          if (cancelled) return;
          const newVisitId = r.data.id;
          const cookie     = r.data.cookieHash as string;
          const ticket     = r.data.ticketNo as string | null;
          saveStoredSession(storedSession.guestId, newVisitId, storedSession.guestName, cookie, ticket);
          setVisitId(newVisitId);
          setTicketNo(ticket);
          setGuestId(storedSession.guestId);
          setGuestName(storedSession.guestName);
          setStep("menu");
        } catch {
          // Network error — show name entry so user can proceed manually
        }
      }
    };

    run();
    return () => { cancelled = true; };
  // visitStatus is the reactive trigger; everything else is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitStatus, step, langSelected]);

  // ── URL ticket / cookie resume (runs once on mount) ────────────────────
  useEffect(() => {
    if (step === "menu") return;
    const params     = new URLSearchParams(window.location.search);
    const ticket     = params.get("ticket");
    const cookieHash = localStorage.getItem(LS_COOKIE_HASH);
    if (!ticket && !cookieHash) return;
    let cancelled = false;
    const attempt = async () => {
      try {
        const r = await resumeVisit.mutateAsync(
          ticket ? { ticketNo: ticket } : { cookieHash: cookieHash! }
        );
        if (cancelled) return;
        const { visit, guest, cookieHash: newHash } = r.data;
        saveStoredSession(guest.id, visit.id, guest.name, newHash, visit.ticketNo);
        setPreviousName(guest.name);
        setTicketNo(visit.ticketNo ?? null);
        setGuestId(guest.id);
        setVisitId(visit.id);
        setGuestName(guest.name);
        setStep("menu");
        if (ticket) window.history.replaceState(null, "", window.location.pathname);
      } catch {
        if (!ticket && cookieHash) localStorage.removeItem(LS_COOKIE_HASH);
      }
    };
    attempt();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime ───────────────────────────────────────────────────────────
  const socket = useSocket();
  useEffect(() => {
    if (step !== "menu") return;
    const handler = () => refetchOrders();
    socket.on("order.updated", handler);
    socket.on("order.created", handler);
    return () => { socket.off("order.updated", handler); socket.off("order.created", handler); };
  }, [socket, step, refetchOrders]);

  // ── Derived ────────────────────────────────────────────────────────────
  const hasOrders = (myOrders?.length ?? 0) > 0;
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const getQty    = (id: number) => cart.find(c => c.id === id)?.quantity ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!guestName.trim()) { toast.error("Enter your name"); return; }
    if (submittingRef.current || createGuest.isPending || openVisitM.isPending) return;
    submittingRef.current = true;
    try {
      const guestR  = await createGuest.mutateAsync({ name: guestName.trim(), phone: guestPhone.trim() || undefined });
      const newGId  = guestR.data.id;
      const visitR  = await openVisitM.mutateAsync({ guestId: newGId });
      const newVId  = visitR.data.id;
      const cookie  = visitR.data.cookieHash as string;
      const ticket  = visitR.data.ticketNo as string | null;
      saveStoredSession(newGId, newVId, guestName.trim(), cookie, ticket);
      setPreviousName(guestName.trim());
      setTicketNo(ticket);
      setGuestId(newGId);
      setVisitId(newVId);
      toast.success(`${t.welcome}, ${guestName.trim()}!`);
      setStep("menu");
    } catch { toast.error("Failed to start visit"); }
    finally { submittingRef.current = false; }
  };

  const handleChangeName = () => {
    setStep("name");
    setGuestId(null); setVisitId(null);
    setGuestName(""); setGuestPhone(""); setTicketNo(null); setPreviousName("");
    setCart([]);
    clearStoredSession();
  };

  const handleAdd = (item: any) => setCart(prev => {
    const ex = prev.find(c => c.id === item.id);
    if (ex) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
    return [...prev, { ...item, quantity: 1 }];
  });

  const handleDec = (id: number) => setCart(prev => {
    const ex = prev.find(c => c.id === id);
    if (!ex) return prev;
    return ex.quantity <= 1 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
  });

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !guestId || !visitId) return;
    setPlacing(true);
    try {
      const r = await placeOrder.mutateAsync({
        customerName: guestName, customerId: guestId, visitId,
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity, unitPrice: i.price })),
      });
      toast.success(`${t.orderPlaced} #${r.orderId} 🎉`);
      setCart([]); refetchOrders(); setActiveTab("history");
    } catch { toast.error("Failed to place order"); }
    setPlacing(false);
  };

  const renderPlaceConfirmation = (isMob: boolean) => (
    <div className="p-4 flex flex-col gap-4 text-center">
      <div className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 ${isMob ? "pt-0" : "pt-2"}`}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-150">Confirm Order</h3>
      </div>
      <p className="text-sm text-gray-500 my-1">
        Are you sure you want to place this order for <strong>Rs. {cartTotal.toFixed(0)}</strong>?
      </p>
      {/* Cart item summary for user clarity */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-left max-h-40 overflow-y-auto space-y-1.5 border border-gray-100 dark:border-gray-800">
        {cart.map(item => (
          <div key={item.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{item.name} ×{item.quantity}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-200">Rs. {(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setConfirmPlace(false)}
          className="flex-1 h-11 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl text-sm font-semibold cursor-pointer text-gray-600 dark:text-gray-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { setConfirmPlace(false); handlePlaceOrder(); }}
          className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm cursor-pointer flex items-center justify-center shadow-sm"
        >
          Confirm Order
        </button>
      </div>
    </div>
  );

  // ── Step: Language selection ───────────────────────────────────────────
  if (step === "lang") {
    return <LangSelectScreen onDone={() => setStep("name")} />;
  }

  // ── Step: Verifying stored session ────────────────────────────────────
  // storedSession exists but visitStatus not yet loaded → show spinner
  if (step === "name" && storedSession && visitStatus === undefined && !openVisitM.isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Opening a fresh visit after detecting closed one
  if (openVisitM.isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">Starting your visit…</p>
        </div>
      </div>
    );
  }

  // ── Step: Name entry ───────────────────────────────────────────────────
  if (step === "name") {
    const isBusy = createGuest.isPending || submittingRef.current;
    const isResuming = resumeVisit.isPending;
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        {isResuming ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
            <p className="text-sm text-gray-500">Resuming your visit…</p>
          </div>
        ) : (
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
              <Input placeholder={t.namePlaceholder} value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isBusy && handleSubmit()}
                className="h-14 text-lg text-center" autoFocus disabled={isBusy} />
              <div className="relative">
                <Input type="tel" inputMode="tel"
                  placeholder="Phone number (optional — for loyalty)"
                  value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isBusy && handleSubmit()}
                  className="h-12 text-sm text-center pr-10" disabled={isBusy} />
                {guestPhone && (
                  <button type="button" tabIndex={-1}
                    onClick={() => setGuestPhone("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {previousName && guestName.trim() !== previousName.trim() && (
                <div className="flex justify-center">
                  <button type="button" disabled={isBusy} onClick={() => setGuestName(previousName)}
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/50 rounded-lg shadow-sm transition cursor-pointer group disabled:opacity-50">
                    <span>{t.tapToAutofill}</span>
                    <span className="font-semibold underline group-hover:text-orange-950">{previousName}</span>
                  </button>
                </div>
              )}
              <button onClick={handleSubmit} disabled={isBusy}
                className="w-full h-14 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-lg font-semibold rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-60">
                {isBusy ? <Loader2 className="animate-spin" /> : t.continueBtn}
              </button>
            </div>
            <div className="mt-6 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
              <p className="text-xs text-gray-600">Cricket Live: Pakistan needs 40 runs in 5 overs</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step: Menu (session active) ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: cartCount > 0 ? "9rem" : "1.5rem" }}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-lg font-bold">{t.hotelName}</h1>
              <p className="text-xs text-gray-500">{t.welcome}, {guestName}</p>
              {ticketNo && (
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono tracking-wide">🎫 {ticketNo}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <button onClick={handleChangeName}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-50">
                {t.changeName}
              </button>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setActiveTab("menu")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "menu" ? "bg-white shadow text-black" : "text-gray-500"}`}>
              {t.menu}
            </button>
            <button onClick={() => hasOrders && setActiveTab("history")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5
                ${!hasOrders ? "text-gray-300 cursor-not-allowed" : activeTab === "history" ? "bg-white shadow text-black" : "text-gray-500"}`}>
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
                      {item.imageUrl ? (
                        <div className="w-24 h-24 shrink-0 overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
                          <Utensils className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-base font-bold text-orange-600">Rs. {item.price}</span>
                          {qty === 0 ? (
                            <button onClick={() => handleAdd(item)}
                              className="flex items-center gap-1 bg-black text-white text-xs font-semibold px-3 py-2 rounded-xl">
                              <Plus className="w-3.5 h-3.5" /> {t.addToCart}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleDec(item.id)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-5 text-center font-bold text-sm">{qty}</span>
                              <button onClick={() => handleAdd(item)}
                                className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800">
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

      {cartCount > 0 && activeTab === "menu" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
          <div className="max-w-lg mx-auto space-y-2">
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs bg-gray-50 px-3 py-1.5 rounded-lg">
                  <span className="font-medium">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-semibold">Rs. {(item.price * item.quantity).toFixed(0)}</span>
                    <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))}
                      className="text-gray-300 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setConfirmPlace(true)} disabled={placing}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 disabled:opacity-60">
              {placing ? <Loader2 className="animate-spin w-5 h-5" /> : (
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

      {confirmPlace && (
        isMobile ? (
          <Drawer open={confirmPlace} onOpenChange={(v) => !v && setConfirmPlace(false)}>
            <DrawerContent className="bg-white dark:bg-gray-950 p-0">
              <div className="mx-auto w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full my-3 shrink-0" />
              {renderPlaceConfirmation(true)}
            </DrawerContent>
          </Drawer>
        ) : (
          <AlertDialog open={confirmPlace} onOpenChange={(v) => !v && setConfirmPlace(false)}>
            <AlertDialogContent className="max-w-sm mx-4 bg-white dark:bg-gray-950 p-0 overflow-hidden">
              {renderPlaceConfirmation(false)}
            </AlertDialogContent>
          </AlertDialog>
        )
      )}
    </div>
  );
}
