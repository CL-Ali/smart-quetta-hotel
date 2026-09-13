"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { useSocket } from "@/hooks/useSocket";
import { CartItem, MenuItem } from "@/types/hotel";
import { playOrderSuccessSound, playTapSound } from "@/lib/sound";
import { useCustomerService } from "../services/customerService";

// Storage keys
const LS_GUEST_NAME = "qh_guest_name";
const LS_GUEST_ID = "qh_guest_id";
const LS_VISIT_ID = "qh_visit_id";
const LS_PREV_NAME = "qh_previous_name";
const LS_COOKIE_HASH = "qh_cookie_hash";
const LS_TICKET_NO = "qh_ticket_no";
const LS_PEOPLE_COUNT = "qh_people_count";
const LS_SEAT_OR_TABLE = "qh_seat_or_table";
const LS_LEGACY_NAME = "qh_customer_name";
const LS_LEGACY_ID = "qh_customer_id";

function readStoredInt(key: string): number | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(key);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readStoredSession() {
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
    LS_PEOPLE_COUNT,
    LS_SEAT_OR_TABLE,
    LS_LEGACY_NAME,
    LS_LEGACY_ID,
  ].forEach((k) => localStorage.removeItem(k));
}

function saveStoredSession(
  guestId: number,
  visitId: number,
  name: string,
  cookieHash: string,
  ticketNo?: string | null,
  peopleCount?: number,
  seatOrTableNo?: string
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_GUEST_NAME, name);
  localStorage.setItem(LS_GUEST_ID, String(guestId));
  localStorage.setItem(LS_VISIT_ID, String(visitId));
  localStorage.setItem(LS_COOKIE_HASH, cookieHash);
  localStorage.setItem(LS_PREV_NAME, name);
  if (ticketNo) localStorage.setItem(LS_TICKET_NO, ticketNo);
  if (peopleCount) localStorage.setItem(LS_PEOPLE_COUNT, String(peopleCount));
  if (seatOrTableNo) localStorage.setItem(LS_SEAT_OR_TABLE, seatOrTableNo);
}

export type CustomerPortalStep = "lang" | "name" | "seating" | "menu";

/**
 * ViewModel for Customer Portal Feature (MVVM)
 * Orchestrates CustomerService, local UI state, party size / seating, cart calculations, and socket events.
 */
export function useCustomerViewModel() {
  const { t, langSelected } = useLang();
  const [confirmPlace, setConfirmPlace] = useState(false);

  // Session state from storage
  const storedSession = readStoredSession();

  // Multi-step onboarding: lang -> (seating if returning | name if first time) -> menu
  const [step, setStep] = useState<CustomerPortalStep>(() => {
    if (!langSelected) return "lang";
    if (storedSession?.guestName) return "seating";
    return "name";
  });

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

  // Seating and Party Size State
  const [peopleCount, setPeopleCount] = useState<number>(() => {
    const saved = readStoredInt(LS_PEOPLE_COUNT);
    return saved ?? 1;
  });
  const [seatOrTableNo, setSeatOrTableNo] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LS_SEAT_OR_TABLE) ?? "";
    }
    return "";
  });

  // Cart & UI Tab state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [placing, setPlacing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const submittingRef = useRef(false);

  // Format seating label cleanly
  const formattedSeatingLabel = useMemo(() => {
    const isSingle = peopleCount === 1;
    if (isSingle) {
      return seatOrTableNo.trim()
        ? `${seatOrTableNo.trim().toUpperCase().startsWith("S") ? "" : "Seat "}${seatOrTableNo.trim()} (1p)`
        : "Seat (1p)";
    }
    return seatOrTableNo.trim()
      ? `${seatOrTableNo.trim().toUpperCase().startsWith("T") ? "" : "Table "}${seatOrTableNo.trim()} (${peopleCount}p)`
      : `Table (${peopleCount}p)`;
  }, [peopleCount, seatOrTableNo]);

  // ── Service Layer Hook ───────────────────────────────────────────────────
  const service = useCustomerService({
    isMenuStep: step === "menu",
    guestName,
    visitId,
    langSelected,
    step,
  });

  // URL Ticket / Cookie Resume Effect
  useEffect(() => {
    if (step === "menu") return;
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get("ticket");
    const cookieHash = localStorage.getItem(LS_COOKIE_HASH);
    if (!ticket && !cookieHash) return;

    let cancelled = false;
    const attempt = async () => {
      try {
        const r = await service.resumeVisit(
          ticket ? { ticketNo: ticket } : { cookieHash: cookieHash! }
        );
        if (cancelled) return;
        const { visit, guest, cookieHash: newHash } = r.data;
        saveStoredSession(
          guest.id,
          visit.id,
          guest.name,
          newHash,
          visit.ticketNo,
          visit.peopleCount ?? 1,
          visit.seatingNo ?? ""
        );
        setPreviousName(guest.name);
        setTicketNo(visit.ticketNo ?? null);
        setGuestId(guest.id);
        setVisitId(visit.id);
        setGuestName(guest.name);
        if (visit.peopleCount) setPeopleCount(visit.peopleCount);
        if (visit.seatingNo) setSeatOrTableNo(visit.seatingNo);
        // If resuming active session via URL/QR ticket, go straight to seating or menu
        setStep("seating");
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

  // Realtime Socket Sync
  const socket = useSocket();
  useEffect(() => {
    if (step !== "menu") return;
    const handler = () => service.refetchOrders();
    socket.on("order.updated", handler);
    socket.on("order.created", handler);
    return () => {
      socket.off("order.updated", handler);
      socket.off("order.created", handler);
    };
  }, [socket, step, service.refetchOrders]);

  // Derived Calculations
  const hasOrders = (service.myOrders?.length ?? 0) > 0;
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // Handlers
  const handleNameSubmit = async () => {
    if (!guestName.trim()) {
      toast.error(t.nameRequiredError || "Enter your name");
      return;
    }
    if (!seatOrTableNo.trim()) {
      toast.error(t.seatRequiredError || "Please enter or select your seat / table number");
      return;
    }
    if (submittingRef.current || service.isCreatingGuest || service.isOpeningVisit) return;
    submittingRef.current = true;
    try {
      const guestR = await service.createGuest({
        name: guestName.trim(),
        phone: guestPhone.trim() || undefined,
      });
      const newGId = guestR.data.id;

      const seatingType = peopleCount > 1 ? "table" : "seat";
      const visitR = await service.openVisit({
        guestId: newGId,
        seatingNo: seatOrTableNo.trim(),
        peopleCount,
        seatingType,
      });

      const newVId = visitR.data.id;
      const cookie = visitR.data.cookieHash as string;
      const ticket = visitR.data.ticketNo as string | null;

      saveStoredSession(
        newGId,
        newVId,
        guestName.trim(),
        cookie,
        ticket,
        peopleCount,
        seatOrTableNo.trim()
      );

      setPreviousName(guestName.trim());
      setTicketNo(ticket);
      setGuestId(newGId);
      setVisitId(newVId);
      toast.success(`${t.welcome}, ${guestName.trim()}! (${formattedSeatingLabel})`);
      setStep("menu");
    } catch {
      toast.error("Failed to start visit");
    } finally {
      submittingRef.current = false;
    }
  };

  const handleSeatingSubmit = async () => {
    if (!guestId) {
      setStep("name");
      return;
    }
    if (!seatOrTableNo.trim()) {
      toast.error(t.seatRequiredError || "Please enter or select your seat / table number");
      return;
    }
    if (submittingRef.current || service.isOpeningVisit) return;
    submittingRef.current = true;
    try {
      const seatingType = peopleCount > 1 ? "table" : "seat";
      const visitR = await service.openVisit({
        guestId,
        seatingNo: seatOrTableNo.trim(),
        peopleCount,
        seatingType,
      });

      const newVId = visitR.data.id;
      const cookie = visitR.data.cookieHash as string;
      const ticket = visitR.data.ticketNo as string | null;

      saveStoredSession(
        guestId,
        newVId,
        guestName,
        cookie,
        ticket,
        peopleCount,
        seatOrTableNo.trim()
      );

      setVisitId(newVId);
      setTicketNo(ticket);
      toast.success(`${formattedSeatingLabel} ✓`);
      setStep("menu");
    } catch {
      toast.error("Failed to confirm seating");
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
    setPeopleCount(1);
    setSeatOrTableNo("");
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
    const placedTotal = cartTotal;
    try {
      const r = await service.placeOrder({
        customerName: guestName,
        customerId: guestId,
        visitId,
        seatingNo: seatOrTableNo.trim() || undefined,
        peopleCount,
        seatingType: peopleCount > 1 ? "table" : "seat",
        items: cart.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });
      const orderTicket = (r as any).ticketNo || (r as any).orderNo || `TKT-${r.orderId}`;
      setTicketNo(orderTicket);
      playOrderSuccessSound();
      setLastOrderTotal(placedTotal);
      setShowSuccessModal(true);
      setConfirmPlace(false);
      toast.success(`${t.orderPlaced} (${orderTicket}) 🎉`);
      setCart([]);
      service.refetchOrders();
    } catch {
      toast.error("Failed to place order");
    }
    setPlacing(false);
  };

  return {
    // State
    step,
    guestName,
    guestPhone,
    previousName,
    ticketNo,
    peopleCount,
    seatOrTableNo,
    formattedSeatingLabel,
    cart,
    cartTotal,
    cartCount,
    activeTab,
    confirmPlace,
    showSuccessModal,
    lastOrderTotal,
    isVerifyingSession: false,
    isOpeningVisit: service.isOpeningVisit,
    isNameBusy: service.isCreatingGuest || submittingRef.current,
    isResuming: service.isResumingVisit,
    placing: placing || service.isPlacingOrder,
    hasOrders,
    menu: service.menu,
    menuLoading: service.menuLoading,
    myOrders: service.myOrders,
    ordersLoading: service.ordersLoading,

    // Actions
    setStep,
    setGuestName,
    setGuestPhone,
    setPeopleCount,
    setSeatOrTableNo,
    setActiveTab,
    setConfirmPlace,
    setShowSuccessModal,
    handleNameSubmit,
    handleSeatingSubmit,
    handleChangeName,
    handleAddToCart,
    handleDecFromCart,
    handleRemoveFromCart,
    handlePlaceOrder,
  };
}
