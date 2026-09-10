"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { useSocket } from "@/hooks/useSocket";
import { CartItem, MenuItem } from "@/types/hotel";
import { useCustomerService } from "../services/customerService";

// Storage keys
const LS_GUEST_NAME = "qh_guest_name";
const LS_GUEST_ID = "qh_guest_id";
const LS_VISIT_ID = "qh_visit_id";
const LS_PREV_NAME = "qh_previous_name";
const LS_COOKIE_HASH = "qh_cookie_hash";
const LS_TICKET_NO = "qh_ticket_no";
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

export type CustomerPortalStep = "lang" | "name" | "menu";

/**
 * ViewModel for Customer Portal Feature (MVVM)
 * Orchestrates CustomerService, local UI state, cart calculations, and socket events.
 */
export function useCustomerViewModel() {
  const { t, langSelected } = useLang();
  const [confirmPlace, setConfirmPlace] = useState(false);

  // Multi-step onboarding
  const [step, setStep] = useState<CustomerPortalStep>(() => (!langSelected ? "lang" : "name"));

  // Session state
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

  // Cart & UI Tab state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [placing, setPlacing] = useState(false);
  const submittingRef = useRef(false);

  // ── Service Layer Hook ───────────────────────────────────────────────────
  const service = useCustomerService({
    isMenuStep: step === "menu",
    guestName,
    visitId,
    langSelected,
    step,
  });

  // Session Verification Effect
  useEffect(() => {
    if (step !== "name" || !langSelected) return;
    if (!storedSession) return;
    if (service.visitStatus === undefined) return;

    let cancelled = false;
    const verifyAndRestore = async () => {
      if (service.visitStatus && service.visitStatus.status === "open") {
        setGuestId(storedSession.guestId);
        setVisitId(storedSession.visitId);
        setGuestName(storedSession.guestName);
        if (!cancelled) setStep("menu");
      } else {
        try {
          const r = await service.openVisit({ guestId: storedSession.guestId });
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
          // network error fallback
        }
      }
    };

    verifyAndRestore();
    return () => {
      cancelled = true;
    };
  }, [service.visitStatus, step, langSelected]);

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
      toast.error("Enter your name");
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
      const visitR = await service.openVisit({ guestId: newGId });
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
      const r = await service.placeOrder({
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
      service.refetchOrders();
      setActiveTab("history");
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
    cart,
    cartTotal,
    cartCount,
    activeTab,
    confirmPlace,
    isVerifyingSession:
      step === "name" &&
      !!storedSession &&
      service.visitStatus === undefined &&
      !service.isOpeningVisit,
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
    setActiveTab,
    setConfirmPlace,
    handleNameSubmit,
    handleChangeName,
    handleAddToCart,
    handleDecFromCart,
    handleRemoveFromCart,
    handlePlaceOrder,
  };
}
