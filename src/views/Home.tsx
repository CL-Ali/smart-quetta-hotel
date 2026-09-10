"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ChefHat } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useSocket } from "@/hooks/useSocket";
import { LangSwitcher } from "@/components/LangSwitcher";
import { CartItem, MenuItem } from "@/types/hotel";

// Sub-components
import { LangSelectScreen } from "./Home/LangSelectScreen";
import { NameEntryStep } from "./Home/NameEntryStep";
import { MenuSection } from "./Home/MenuSection";
import { OrderHistoryCard } from "./Home/OrderHistoryCard";
import { CartBottomBar } from "./Home/CartBottomBar";
import { ConfirmPlaceModal } from "./Home/ConfirmPlaceModal";

// ── Session Storage Keys ────────────────────────────────────────────────────
const LS_GUEST_NAME = "qh_guest_name";
const LS_GUEST_ID = "qh_guest_id";
const LS_VISIT_ID = "qh_visit_id";
const LS_PREV_NAME = "qh_previous_name";
const LS_COOKIE_HASH = "qh_cookie_hash";
const LS_TICKET_NO = "qh_ticket_no";
const LS_LEGACY_NAME = "qh_customer_name";
const LS_LEGACY_ID = "qh_customer_id";

// ── Helper Storage Functions ────────────────────────────────────────────────
function readStoredInt(key: string): number | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(key);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readStoredSession(): { guestId: number; visitId: number; guestName: string } | null {
  if (typeof window === "undefined") return null;
  const guestId = readStoredInt(LS_GUEST_ID);
  const visitId = readStoredInt(LS_VISIT_ID);
  const guestName = localStorage.getItem(LS_GUEST_NAME) ?? "";
  if (guestId && visitId && guestName) return { guestId, visitId, guestName };
  return null;
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  [
    LS_GUEST_NAME,
    LS_GUEST_ID,
    LS_VISIT_ID,
    LS_COOKIE_HASH,
    LS_TICKET_NO,
    LS_PREV_NAME,
    LS_LEGACY_NAME,
    LS_LEGACY_ID,
  ].forEach((k) => localStorage.removeItem(k));
}

function saveStoredSession(
  guestId: number,
  visitId: number,
  name: string,
  cookieHash: string,
  ticketNo?: string | null
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_GUEST_NAME, name);
  localStorage.setItem(LS_GUEST_ID, String(guestId));
  localStorage.setItem(LS_VISIT_ID, String(visitId));
  localStorage.setItem(LS_COOKIE_HASH, cookieHash);
  localStorage.setItem(LS_PREV_NAME, name);
  if (ticketNo) localStorage.setItem(LS_TICKET_NO, ticketNo);
}

/**
 * Main Customer Portal View for Smart Quetta Hotel
 */
export default function Home() {
  const { t, langSelected } = useLang();
  const [confirmPlace, setConfirmPlace] = useState(false);

  // ── Multi-step Onboarding State ("lang" ➔ "name" ➔ "menu") ───────────────
  type Step = "lang" | "name" | "menu";
  const [step, setStep] = useState<Step>(() => (!langSelected ? "lang" : "name"));

  // ── Session State ──────────────────────────────────────────────────────────
  const storedSession = readStoredSession();
  const [guestName, setGuestName] = useState(storedSession?.guestName ?? "");
  const [guestId, setGuestId] = useState<number | null>(storedSession?.guestId ?? null);
  const [visitId, setVisitId] = useState<number | null>(storedSession?.visitId ?? null);
  const [ticketNo, setTicketNo] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(LS_TICKET_NO) : null
  );
  const [guestPhone, setGuestPhone] = useState("");
  const [previousName, setPreviousName] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(LS_PREV_NAME) ?? localStorage.getItem(LS_LEGACY_NAME) ?? ""
      : ""
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [placing, setPlacing] = useState(false);
  const submittingRef = useRef(false);

  // ── tRPC Queries & Mutations ───────────────────────────────────────────────
  const isMenuStep = step === "menu";
  const { data: menu, isLoading: menuLoading } = trpc.hotel.getMenu.useQuery(undefined, {
    enabled: isMenuStep,
  });
  const {
    data: myOrders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = trpc.hotel.getCustomerOrders.useQuery(
    { customerName: guestName },
    { enabled: isMenuStep && !!guestName, refetchInterval: 15000 }
  );
  const { data: visitStatus } = trpc.visit.getVisitStatus.useQuery(
    { visitId: visitId ?? 0 },
    { enabled: langSelected && visitId !== null && step === "name", retry: false }
  );

  const createGuest = trpc.guest.createGuest.useMutation();
  const openVisitM = trpc.visit.openVisit.useMutation();
  const resumeVisit = trpc.visit.resumeVisit.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();

  // ── Verify Stored Session on Load ─────────────────────────────────────────
  useEffect(() => {
    if (step !== "name" || !langSelected) return;
    if (!storedSession) return;
    if (visitStatus === undefined) return;

    let cancelled = false;

    const run = async () => {
      if (visitStatus && visitStatus.status === "open") {
        setGuestId(storedSession.guestId);
        setVisitId(storedSession.visitId);
        setGuestName(storedSession.guestName);
        if (!cancelled) setStep("menu");
      } else {
        try {
          const r = await openVisitM.mutateAsync({ guestId: storedSession.guestId });
          if (cancelled) return;
          const newVisitId = r.data.id;
          const cookie = r.data.cookieHash as string;
          const ticket = r.data.ticketNo as string | null;
          saveStoredSession(
            storedSession.guestId,
            newVisitId,
            storedSession.guestName,
            cookie,
            ticket
          );
          setVisitId(newVisitId);
          setTicketNo(ticket);
          setGuestId(storedSession.guestId);
          setGuestName(storedSession.guestName);
          setStep("menu");
        } catch {
          // Stay on name step if network fails
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [visitStatus, step, langSelected]);

  // ── URL Ticket & Cookie Resumption ─────────────────────────────────────────
  useEffect(() => {
    if (step === "menu") return;
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get("ticket");
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
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Realtime Socket Synchronization ───────────────────────────────────────
  const socket = useSocket();
  useEffect(() => {
    if (step !== "menu") return;
    const handler = () => refetchOrders();
    socket.on("order.updated", handler);
    socket.on("order.created", handler);
    return () => {
      socket.off("order.updated", handler);
      socket.off("order.created", handler);
    };
  }, [socket, step, refetchOrders]);

  // ── Calculations ──────────────────────────────────────────────────────────
  const hasOrders = (myOrders?.length ?? 0) > 0;
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNameSubmit = async () => {
    if (!guestName.trim()) {
      toast.error("Enter your name");
      return;
    }
    if (submittingRef.current || createGuest.isPending || openVisitM.isPending) return;
    submittingRef.current = true;
    try {
      const guestR = await createGuest.mutateAsync({
        name: guestName.trim(),
        phone: guestPhone.trim() || undefined,
      });
      const newGId = guestR.data.id;
      const visitR = await openVisitM.mutateAsync({ guestId: newGId });
      const newVId = visitR.data.id;
      const cookie = visitR.data.cookieHash as string;
      const ticket = visitR.data.ticketNo as string | null;
      saveStoredSession(newGId, newVId, guestName.trim(), cookie, ticket);
      setPreviousName(guestName.trim());
      setTicketNo(ticket);
      setGuestId(newGId);
      setVisitId(newVId);
      toast.success(`${t.welcome}, ${guestName.trim()}!`);
      setStep("menu");
    } catch {
      toast.error("Failed to start visit");
    } finally {
      submittingRef.current = false;
    }
  };

  const handleChangeName = () => {
    setStep("name");
    setGuestId(null);
    setVisitId(null);
    setGuestName("");
    setGuestPhone("");
    setTicketNo(null);
    setPreviousName("");
    setCart([]);
    clearStoredSession();
  };

  const handleAddToCart = (item: MenuItem | CartItem) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          description: item.description,
          imageUrl: item.imageUrl,
        },
      ];
    });
  };

  const handleDecFromCart = (id: number) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === id);
      if (!ex) return prev;
      return ex.quantity <= 1
        ? prev.filter((c) => c.id !== id)
        : prev.map((c) => (c.id === id ? { ...c, quantity: c.quantity - 1 } : c));
    });
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !guestId || !visitId) return;
    setPlacing(true);
    try {
      const r = await placeOrder.mutateAsync({
        customerName: guestName,
        customerId: guestId,
        visitId,
        items: cart.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });
      toast.success(`${t.orderPlaced} #${r.orderId} 🎉`);
      setCart([]);
      refetchOrders();
      setActiveTab("history");
    } catch {
      toast.error("Failed to place order");
    }
    setPlacing(false);
  };

  // ── Screen Rendering ───────────────────────────────────────────────────────
  if (step === "lang") {
    return <LangSelectScreen onDone={() => setStep("name")} />;
  }

  if (
    step === "name" &&
    storedSession &&
    visitStatus === undefined &&
    !openVisitM.isPending
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">Checking your session…</p>
        </div>
      </div>
    );
  }

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

  if (step === "name") {
    return (
      <NameEntryStep
        guestName={guestName}
        guestPhone={guestPhone}
        previousName={previousName}
        isBusy={createGuest.isPending || submittingRef.current}
        isResuming={resumeVisit.isPending}
        setGuestName={setGuestName}
        setGuestPhone={setGuestPhone}
        onSubmit={handleNameSubmit}
      />
    );
  }

  // ── Step: Menu & Order History ─────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ paddingBottom: cartCount > 0 ? "9rem" : "1.5rem" }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-lg font-bold">{t.hotelName}</h1>
              <p className="text-xs text-gray-500">
                {t.welcome}, {guestName}
              </p>
              {ticketNo && (
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono tracking-wide">
                  🎫 {ticketNo}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <button
                type="button"
                onClick={handleChangeName}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                {t.changeName}
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab("menu")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                activeTab === "menu" ? "bg-white shadow-xs text-black" : "text-gray-500"
              }`}
            >
              {t.menu}
            </button>
            <button
              type="button"
              onClick={() => hasOrders && setActiveTab("history")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !hasOrders
                  ? "text-gray-300 cursor-not-allowed"
                  : activeTab === "history"
                  ? "bg-white shadow-xs text-black"
                  : "text-gray-500"
              }`}
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

      {/* Menu Tab */}
      {activeTab === "menu" && (
        <MenuSection
          menu={menu}
          isLoading={menuLoading}
          cart={cart}
          onAdd={handleAddToCart}
          onDec={handleDecFromCart}
        />
      )}

      {/* Order History Tab */}
      {activeTab === "history" && (
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-2">
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin h-7 w-7 text-orange-500" />
            </div>
          ) : myOrders && myOrders.length > 0 ? (
            myOrders.map((order) => <OrderHistoryCard key={order.id} order={order} />)
          ) : (
            <div className="text-center py-20 text-gray-400">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Sticky Cart Summary */}
      {cartCount > 0 && activeTab === "menu" && (
        <CartBottomBar
          cart={cart}
          cartTotal={cartTotal}
          placing={placing}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => setConfirmPlace(true)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmPlaceModal
        open={confirmPlace}
        cart={cart}
        cartTotal={cartTotal}
        onClose={() => setConfirmPlace(false)}
        onConfirm={handlePlaceOrder}
      />
    </div>
  );
}
