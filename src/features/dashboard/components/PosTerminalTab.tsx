"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Loader2,
  Zap,
  Store,
  Building2,
  UserPlus,
  X,
  Banknote,
  Receipt,
  ChefHat,
  ArrowRight,
  User,
  Phone,
  Users,
  Sun,
  Check,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Utensils,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { playTapSound, playOrderSuccessSound } from "@/lib/sound";
import { fmtTime } from "@/lib/time";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";

interface PosCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: string | null;
}

interface PosTerminalTabProps {
  onOrderCreated: (order: any) => void;
}

function getDepartmentLabel(deptName: string, lang: string) {
  const lower = deptName.toLowerCase();
  if (lower === "all") return lang === "ur" ? "تمام" : "All";
  if (lang === "ur") {
    if (lower === "tea") return "چائے و قہوہ";
    if (lower === "paratha") return "پراٹھا و نان";
    if (lower === "kitchen") return "کچن و سالن";
    if (lower === "drinks") return "مشروبات و لسی";
  }
  return deptName;
}

function getItemBadge(product: any, departments: any[], lang: string): { text: string } | null {
  if (product.departmentId && departments.length > 0) {
    const dept = departments.find((d: any) => d.id === product.departmentId);
    if (dept) {
      return { text: getDepartmentLabel(dept.name, lang) };
    }
  }
  if (product.category) {
    return { text: getDepartmentLabel(product.category, lang) };
  }
  return null;
}

export function PosTerminalTab({ onOrderCreated }: PosTerminalTabProps) {
  const { t, lang } = useLang();
  const { permissions } = useAuth();

  // State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // Default view mode: list on mobile (< 768px), grid on tablets/desktop (>= 768px)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("list");
    }
  }, []);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState("T-1");
  const [customerPhone, setCustomerPhone] = useState("");
  const [accountType, setAccountType] = useState<"tables" | "shopkeepers">("tables");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const isMobile = useIsMobile();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isSettlingKhata, setIsSettlingKhata] = useState(false);

  // Seating & Area Selection State
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedSeatingType, setSelectedSeatingType] = useState<"table" | "seat" | "takeaway">("table");
  const [selectedSeatingAreaId, setSelectedSeatingAreaId] = useState<number | null>(null);
  const [peopleCount, setPeopleCount] = useState<number>(4);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settlePayMode, setSettlePayMode] = useState<"cash" | "bank">("cash");
  const [isFullPay, setIsFullPay] = useState(true);
  const [newShopName, setNewShopName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newShopNumber, setNewShopNumber] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [confirmPaymentMode, setConfirmPaymentMode] = useState<"unpaid" | "paid">("unpaid");

  // Queries
  const { data: menu = [], isLoading: menuLoading } = trpc.hotel.getMenu.useQuery();
  const { data: departments = [] } = trpc.hotel.getDepartments.useQuery();
  const { data: seatingTables = [] } = trpc.hotel.getSeatingTables.useQuery(undefined, { refetchInterval: 6000 });
  const { data: shopkeepersList = [], refetch: refetchShopkeepers } = trpc.hotel.getShopkeepers.useQuery();
  const { data: allOrders = [], refetch: refetchOrders } = trpc.hotel.getOrders.useQuery(undefined, { refetchInterval: 5000 });

  const createShopkeeperMutation = trpc.hotel.createShopkeeper.useMutation();
  const getOrCreateCustomer = trpc.hotel.getOrCreateCustomer.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();
  const recordPayment = trpc.hotel.recordPayment.useMutation();

  // Selected shopkeeper object
  const selectedShop = useMemo(() => {
    if (accountType !== "shopkeepers") return null;
    return shopkeepersList.find(
      (s) =>
        customerName.includes(s.shopName) ||
        (s.phone && customerPhone && s.phone === customerPhone)
    );
  }, [accountType, shopkeepersList, customerName, customerPhone]);

  // Unpaid khata orders for the active shopkeeper
  const shopUnpaidOrders = useMemo(() => {
    if (accountType !== "shopkeepers" || !customerName) return [];
    return allOrders.filter((o: any) => {
      const isMatch =
        o.customerName === customerName ||
        (selectedShop?.shopName && o.customerName.includes(selectedShop.shopName)) ||
        (selectedShop?.phone && o.customerPhone === selectedShop.phone);
      const isUnpaid = o.status !== "paid" && (o.paidAmount ?? 0) < (o.totalAmount ?? o.total ?? 0);
      return isMatch && isUnpaid;
    });
  }, [accountType, customerName, selectedShop, allOrders]);

  const totalShopKhataDue = useMemo(() => {
    return shopUnpaidOrders.reduce((sum, o: any) => {
      const tot = o.totalAmount ?? o.total ?? 0;
      const paid = o.paidAmount ?? 0;
      return sum + Math.max(0, tot - paid);
    }, 0);
  }, [shopUnpaidOrders]);

  // Create new shopkeeper inline
  const handleCreateShopkeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) {
      toast.error(lang === "ur" ? "دکان کا نام درج کریں" : "Please enter shop name");
      return;
    }
    try {
      const created = await createShopkeeperMutation.mutateAsync({
        name: newOwnerName.trim() || newShopName.trim(),
        shopName: newShopName.trim(),
        shopNumber: newShopNumber.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      toast.success(
        lang === "ur"
          ? `دکاندار "${created.shopName}" شامل کر دیا گیا`
          : `Shopkeeper "${created.shopName}" registered successfully`
      );
      await refetchShopkeepers();
      setCustomerName(`${created.shopName}${created.shopNumber ? ` (${created.shopNumber})` : ""}`);
      if (created.phone) setCustomerPhone(created.phone);
      setShowAddShopModal(false);
      setNewShopName("");
      setNewOwnerName("");
      setNewShopNumber("");
      setNewPhone("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create shopkeeper");
    }
  };

  // Cart operations
  const addToCart = (product: any, qtyCount: number = 1) => {
    playTapSound();
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qtyCount } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qtyCount,
          imageUrl: product.imageUrl,
          category: product.category,
        },
      ];
    });
  };

  const decFromCart = (productId: number) => {
    playTapSound();
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    playTapSound();
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    playTapSound();
    setCart([]);
    setDiscountPercent(0);
  };

  const getQty = (productId: number) => {
    return cart.find((item) => item.id === productId)?.quantity ?? 0;
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountPercent <= 0) return 0;
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const total = Math.max(0, subtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Distinct Department Tabs
  const departmentTabs = useMemo(() => {
    return [
      { id: "all", name: lang === "ur" ? "تمام" : "All" },
      ...departments.map((d) => ({
        id: String(d.id),
        name: getDepartmentLabel(d.name, lang),
      })),
    ];
  }, [departments, lang]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return menu.filter((p: any) => {
      const matchesDept =
        selectedCategory === "all" ||
        String(p.departmentId) === selectedCategory ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
      return matchesDept && matchesSearch;
    });
  }, [menu, selectedCategory, search]);

  // Settle / Clear Khata for Shopkeeper (Full or Partial)
  const handleOpenSettleModal = () => {
    if (shopUnpaidOrders.length === 0) {
      toast.info("No unpaid orders for this shopkeeper");
      return;
    }
    playTapSound();
    setSettleAmount(totalShopKhataDue.toString());
    setIsFullPay(true);
    setSettlePayMode("cash");
    setShowSettleModal(true);
  };

  const handleExecuteKhataSettlement = async () => {
    const payAmt = isFullPay ? totalShopKhataDue : parseFloat(settleAmount) || 0;
    if (payAmt <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (payAmt > totalShopKhataDue) {
      toast.error(`Amount cannot exceed total due of Rs. ${totalShopKhataDue.toLocaleString()}`);
      return;
    }

    setIsSettlingKhata(true);
    try {
      let remainingToPay = payAmt;
      for (const ord of shopUnpaidOrders) {
        if (remainingToPay <= 0) break;
        const ordDue = Math.max(0, (ord.totalAmount ?? ord.total ?? 0) - (ord.paidAmount ?? 0));
        if (ordDue > 0) {
          const allocation = Math.min(ordDue, remainingToPay);
          await recordPayment.mutateAsync({
            orderId: ord.id,
            amount: allocation,
            method: settlePayMode,
          });
          remainingToPay -= allocation;
        }
      }
      playOrderSuccessSound();
      toast.success(`Payment of Rs. ${payAmt.toLocaleString()} recorded for ${customerName}`);
      setShowSettleModal(false);
      await refetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to settle khata");
    } finally {
      setIsSettlingKhata(false);
    }
  };

  // Pre-Order Confirmation
  const handleOpenConfirm = () => {
    if (cart.length === 0) {
      toast.error(lang === "ur" ? "آرڈر میں کوئی چیز شامل نہیں ہے" : "Cart is empty");
      return;
    }
    playTapSound();
    setShowConfirmModal(true);
  };

  // Final Order Execution
  const handleConfirmAndPlace = async () => {
    if (cart.length === 0) return;

    setIsPlacing(true);
    try {
      const cName = customerName.trim() || t.walkInCustomer || "Walk-in Guest";
      const cPhone = customerPhone.trim() || undefined;
      const customer = await getOrCreateCustomer.mutateAsync({ name: cName, phone: cPhone });
      const result = await placeOrder.mutateAsync({
        customerName: cName,
        customerId: customer.id,
        seatingAreaId: selectedSeatingAreaId || undefined,
        seatingNo: cName,
        peopleCount: peopleCount,
        seatingType: selectedSeatingType,
        items: cart.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });

      playOrderSuccessSound();
      toast.success(`Order #${result.orderId} sent to kitchen for "${cName}"`);

      setShowConfirmModal(false);
      clearCart();
      await refetchOrders();

      if (result && result.orderId) {
        onOrderCreated({
          id: result.orderId,
          customerName: cName,
          totalPrice: total,
          status: "pending",
          paymentStatus: confirmPaymentMode,
          items: cart.map((c) => ({
            id: c.id,
            menuItemId: c.id,
            menuItemName: c.name,
            quantity: c.quantity,
            priceAtOrder: c.price,
          })),
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to punch order");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 items-stretch overflow-hidden relative">
      {/* ── LEFT PANE: Food Matrix (Identical Card Design to Customer Portal) ──── */}
      <div className="flex-1 lg:col-span-7 xl:col-span-8 2xl:col-span-8 flex flex-col overflow-hidden min-h-0 space-y-3">
        {/* Top Customer & Seating Selection Bar */}
        <div className="bg-white dark:bg-[#121824] rounded-[24px] p-3 sm:p-3.5 space-y-2.5 shrink-0 border-0 shadow-none">
          {/* Account Mode Switcher: Dine-in vs Market Shopkeepers */}
          <div className="flex items-center bg-[#F8F3EC] dark:bg-[#1A2232] p-1 rounded-full text-xs font-bold border-0">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAccountType("tables");
                setCustomerName("T-1");
              }}
              className={`flex-1 py-1.5 rounded-full transition cursor-pointer text-center ${
                accountType === "tables"
                  ? "bg-[#D98A3C] text-white shadow-none font-black"
                  : "text-[#4A3E31] dark:text-zinc-300 hover:text-[#24180A]"
              }`}
            >
              {t.dineInTables || "Dine-in / Parcel"}
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAccountType("shopkeepers");
                if (shopkeepersList.length > 0) {
                  const s = shopkeepersList[0];
                  setCustomerName(`${s.shopName}${s.shopNumber ? ` (${s.shopNumber})` : ""}`);
                  if (s.phone) setCustomerPhone(s.phone);
                }
              }}
              className={`flex-1 py-1.5 rounded-full transition cursor-pointer text-center ${
                accountType === "shopkeepers"
                  ? "bg-[#D98A3C] text-white shadow-none font-black"
                  : "text-[#4A3E31] dark:text-zinc-300 hover:text-[#24180A]"
              }`}
            >
              {t.marketShopkeepers || "Market Khata"}
            </button>
          </div>

          {/* Mode 1: Dine-in Tables & Parcel */}
          {accountType === "tables" && (
            <div className="space-y-2">
              {/* Row 1: Area Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: "all", label: t.allAreas || (lang === "ur" ? "تمام ہال" : "All Areas"), Icon: Building2 },
                  { id: "indoor", label: t.mainHall || (lang === "ur" ? "مین ہال" : "Main Hall"), Icon: Store },
                  { id: "family", label: t.familyArea || (lang === "ur" ? "فیملی ہال" : "Family"), Icon: Users },
                  { id: "rooftop", label: t.rooftop || (lang === "ur" ? "روف ٹاپ" : "Rooftop"), Icon: Sun },
                  { id: "takeaway", label: t.parcelTakeaway || (lang === "ur" ? "پارسل" : "Parcel"), Icon: ShoppingBag },
                ].map((area) => {
                  const isSelected = selectedArea === area.id;
                  const AreaIcon = area.Icon;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setSelectedArea(area.id);
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer border-0 ${
                        isSelected
                          ? "bg-[#D98A3C] text-white shadow-none"
                          : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#EFE7DC]"
                      }`}
                    >
                      <AreaIcon className="w-3 h-3" />
                      <span>{area.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Table / Seat Dropdown Selector + Quick Walk-in Button + Name/Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-6 flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Utensils className="w-3.5 h-3.5 text-[#D98A3C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={
                        selectedSeatingAreaId
                          ? String(selectedSeatingAreaId)
                          : customerName === (t.walkInCustomer || "Walk-in Guest")
                          ? "walk-in"
                          : seatingTables.find((t) => t.name === customerName)?.id
                          ? String(seatingTables.find((t) => t.name === customerName)?.id)
                          : "walk-in"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        playTapSound();
                        if (val === "walk-in") {
                          setCustomerName(t.walkInCustomer || "Walk-in Guest");
                          setSelectedSeatingAreaId(null);
                          setSelectedSeatingType("table");
                        } else {
                          const tableId = Number(val);
                          const table = seatingTables.find((t) => t.id === tableId);
                          if (table) {
                            setCustomerName(table.name);
                            setSelectedSeatingAreaId(table.id);
                            setPeopleCount(table.capacity || 4);
                            if (table.type === "takeaway") {
                              setSelectedSeatingType("takeaway");
                            } else {
                              setSelectedSeatingType(table.capacity === 1 ? "seat" : "table");
                            }
                          }
                        }
                      }}
                      className="w-full pl-9 pr-8 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white border-0 shadow-none focus:outline-none focus:ring-2 focus:ring-[#D98A3C] appearance-none cursor-pointer truncate"
                    >
                      <option value="walk-in" className="text-black dark:text-white bg-white dark:bg-[#121824]">
                        {t.walkInCustomer || "Walk-in Guest"} (No Table Assigned)
                      </option>
                      {(selectedArea === "all"
                        ? seatingTables
                        : seatingTables.filter(
                            (t) => (t.type || "indoor").toLowerCase() === selectedArea.toLowerCase()
                          )
                      ).map((table) => (
                        <option
                          key={table.id}
                          value={table.id}
                          className="text-black dark:text-white bg-white dark:bg-[#121824]"
                        >
                          {table.isOccupied ? "[Occupied]" : "[Available]"} {table.name} ({table.capacity || 4} Seats)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setCustomerName(t.walkInCustomer || "Walk-in Guest");
                      setSelectedSeatingAreaId(null);
                      setSelectedSeatingType("table");
                    }}
                    className={`h-8 px-3 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 border-0 cursor-pointer ${
                      customerName === (t.walkInCustomer || "Walk-in Guest")
                        ? "bg-[#D98A3C] text-white shadow-none"
                        : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#EFE7DC]"
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Walk-in</span>
                  </button>
                </div>

                {/* Dual Input: Name & Phone */}
                <div className="sm:col-span-6 grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-3 h-3 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Name / Table"
                      className="w-full pl-8 pr-2 py-1.5 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3 h-3 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone #"
                      className="w-full pl-8 pr-2 py-1.5 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Market Shopkeepers Khata */}
          {accountType === "shopkeepers" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Store className="w-3.5 h-3.5 text-[#D98A3C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={
                      shopkeepersList.find(
                        (s) => `${s.shopName}${s.shopNumber ? ` (${s.shopNumber})` : ""}` === customerName
                      )?.id || (shopkeepersList[0]?.id ?? "")
                    }
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const shop = shopkeepersList.find((s) => s.id === selectedId);
                      if (shop) {
                        playTapSound();
                        const label = `${shop.shopName}${shop.shopNumber ? ` (${shop.shopNumber})` : ""}`;
                        setCustomerName(label);
                        if (shop.phone) setCustomerPhone(shop.phone);
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white border-0 shadow-none focus:outline-none focus:ring-2 focus:ring-[#D98A3C] appearance-none cursor-pointer truncate"
                  >
                    {shopkeepersList.length === 0 ? (
                      <option value="">No registered shopkeepers</option>
                    ) : (
                      shopkeepersList.map((shop) => (
                        <option key={shop.id} value={shop.id} className="text-black dark:text-white bg-white dark:bg-[#121824]">
                          {shop.shopNumber ? `${shop.shopNumber} — ` : ""}{shop.shopName} {shop.name ? `(${shop.name})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowAddShopModal(true);
                  }}
                  className="h-8 px-3.5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-none cursor-pointer"
                  title="Register New Shopkeeper"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New</span>
                </button>
              </div>

              {/* Shopkeeper Due Banner */}
              {totalShopKhataDue > 0 && (
                <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-2.5 rounded-2xl flex items-center justify-between gap-2 border-0">
                  <div>
                    <span className="text-[10px] text-[#786B5D] dark:text-zinc-400 font-bold block uppercase">
                      Running Khata Due
                    </span>
                    <span className="text-sm font-black text-[#D98A3C] font-mono">
                      Rs. {totalShopKhataDue.toLocaleString()}
                    </span>
                  </div>

                  {permissions.canSettleKhata && (
                    <button
                      type="button"
                      onClick={handleOpenSettleModal}
                      disabled={isSettlingKhata}
                      className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-full flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSettlingKhata ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Settle Payment</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unified Search & Category Bar Card */}
        <div className="bg-white dark:bg-[#121824] rounded-[24px] p-3 sm:p-3.5 space-y-2.5 shrink-0 border-0 shadow-none">
          {/* Top Row: Search Input (left) + View Mode Toggle (right) */}
          <div className="flex items-center gap-2.5 w-full">
            <div className="relative flex items-center flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchFoodPlaceholder || "Search food or tea..."}
                className="w-full pl-9 pr-8 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-semibold text-[#24180A] dark:text-white placeholder:text-stone-400 border-0 shadow-none focus:outline-none focus:ring-2 focus:ring-[#D98A3C]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View Mode Toggle on right side of Searchbar */}
            <div className="flex items-center rounded-full p-1 bg-[#F8F3EC] dark:bg-[#1A2232] shrink-0 border-0">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setViewMode("grid");
                }}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#D98A3C] text-white shadow-none"
                    : "text-[#786B5D] hover:text-[#24180A] dark:hover:text-white"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setViewMode("list");
                }}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#D98A3C] text-white shadow-none"
                    : "text-[#786B5D] hover:text-[#24180A] dark:hover:text-white"
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom: Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {departmentTabs.map((dept) => {
              const isSelected = selectedCategory === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory(dept.id);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none border-0 ${
                    isSelected
                      ? "bg-[#D98A3C] text-white shadow-none"
                      : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#EFE7DC] dark:hover:bg-[#222C40]"
                  }`}
                >
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Matrix (Grid / List Modes) */}
        <div className="flex-1 overflow-y-auto px-1 pt-1.5 pb-20 lg:pb-2 min-h-0 no-scrollbar">
          {menuLoading ? (
            <div className="flex justify-center items-center h-48 bg-white dark:bg-[#121824] rounded-[24px]">
              <Loader2 className="animate-spin h-8 w-8 text-[#D98A3C]" />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredProducts.map((product) => {
                const qty = getQty(product.id);
                const isSelected = qty > 0;
                const badge = getItemBadge(product, departments, lang);
                const itemImg = product.imageUrl || "/images/placeholder-food.png";
                const displayName = product.name;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product, 1)}
                    className={`bg-white dark:bg-[#121824] rounded-[20px] sm:rounded-[22px] p-3 sm:p-3.5 transition-all duration-200 flex flex-col justify-between select-none cursor-pointer border-0 shadow-none hover:-translate-y-0.5 ${
                      isSelected ? "ring-2 ring-inset ring-[#D98A3C]" : ""
                    }`}
                  >
                    {/* Card Top: Photo + Title + Badge */}
                    <div>
                      {/* Food Photo Banner */}
                      <div className="aspect-[16/10] w-full bg-[#F8F3EC] dark:bg-[#1A2232] rounded-[14px] sm:rounded-[16px] overflow-hidden relative mb-2.5">
                        <img
                          src={itemImg}
                          alt={displayName}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Selected Quantity Badge */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-[#D98A3C] text-white font-black text-[11px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-none">
                            {qty}
                          </div>
                        )}
                      </div>

                      {/* Title & Popular Badge Row */}
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="font-bold text-[#1C1917] dark:text-white text-xs sm:text-sm leading-tight truncate">
                          {displayName}
                        </h3>
                        {badge && (
                          <span className="shrink-0 border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                            {badge.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-t border-stone-100 dark:border-white/5 my-2" />

                    {/* Card Bottom: Orange Price on Left | + Add Pill on Right */}
                    <div className="flex items-center justify-between gap-1.5">
                      {/* Left: Bold Orange Price */}
                      <span className="text-xs sm:text-sm font-bold text-[#E65100] dark:text-[#FB8C00] font-mono">
                        Rs. {product.price}
                      </span>

                      {/* Right: Pill Button or Stepper */}
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        {isSelected ? (
                          <div className="h-7 sm:h-8 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full px-1.5 flex items-center gap-1.5 border-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                decFromCart(product.id);
                              }}
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                                qty === 1
                                  ? "bg-red-500 text-white"
                                  : "bg-black text-white dark:bg-white dark:text-black"
                              }`}
                              title={qty === 1 ? "Remove from cart" : "Decrease quantity"}
                            >
                              {qty === 1 ? (
                                <Trash2 className="w-2.5 h-2.5" />
                              ) : (
                                <Minus className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <span className="min-w-[14px] text-center text-xs font-mono font-bold text-[#24180A] dark:text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                              }}
                              className="w-5 h-5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1);
                            }}
                            className="h-7 sm:h-8 px-3 sm:px-4 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-black font-bold text-[11px] sm:text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-none active:scale-95"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{t.addToCart || "Add"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {filteredProducts.map((product) => {
                const qty = getQty(product.id);
                const isSelected = qty > 0;
                const badge = getItemBadge(product, departments, lang);
                const itemImg = product.imageUrl || "/images/placeholder-food.png";
                const displayName = product.name;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product, 1)}
                    className={`bg-white dark:bg-[#121824] rounded-2xl sm:rounded-full p-2 sm:px-3.5 sm:py-2 flex items-center justify-between gap-2.5 sm:gap-3 transition-all select-none cursor-pointer border-0 shadow-none hover:bg-stone-50/80 dark:hover:bg-[#182030] ${
                      isSelected ? "ring-2 ring-inset ring-[#D98A3C]" : ""
                    }`}
                  >
                    {/* Left: Thumbnail */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] overflow-hidden relative shrink-0">
                      <img
                        src={itemImg}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Middle: Details */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-[#24180A] dark:text-white text-xs sm:text-sm truncate">
                          {displayName}
                        </h4>
                        {badge && (
                          <span className="shrink-0 bg-amber-500/15 text-[#D98A3C] text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            {badge.text}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-[#E65100] dark:text-[#FB8C00] font-mono">
                        Rs. {product.price}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      {isSelected ? (
                        <div className="h-6.5 sm:h-7 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full px-1.5 flex items-center gap-1 sm:gap-1.5 border-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              decFromCart(product.id);
                            }}
                            className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                              qty === 1
                                ? "bg-red-500 text-white"
                                : "bg-black text-white dark:bg-white dark:text-black"
                            }`}
                          >
                            {qty === 1 ? <Trash2 className="w-2 h-2" /> : <Minus className="w-2 h-2" />}
                          </button>
                          <span className="min-w-[12px] text-center text-[11px] sm:text-xs font-mono font-bold text-[#24180A] dark:text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1);
                            }}
                            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                          >
                            <Plus className="w-2 h-2" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1);
                          }}
                          className="h-6.5 sm:h-7 px-3 bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-black font-bold text-[11px] rounded-full shadow-none flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{t.addToCart || "Add"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: Live Register Sale & Khata Sidebar (Desktop & Tablet) ──── */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 2xl:col-span-4 bg-white dark:bg-[#121824] rounded-[28px] border-0 shadow-none flex-col h-full overflow-hidden min-h-0">
        {/* Register Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#F8F3EC] dark:border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#24180A] dark:text-white leading-tight">
                {accountType === "shopkeepers" ? "Market Khata Tab" : "Current Sale"}
              </h3>
              <p className="text-[10px] text-[#786B5D] dark:text-zinc-400 font-bold">
                {accountType === "shopkeepers" ? customerName : `Seating: ${customerName}`}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Middle Area: Cart Items OR Running Khata Breakdown */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar min-h-0">
          {/* If Shopkeepers Mode & Has Unpaid Tickets: Show My Orders Style History */}
          {accountType === "shopkeepers" && shopUnpaidOrders.length > 0 && (
            <div className="space-y-2 mb-3">
              <span className="text-[10px] font-bold text-[#786B5D] dark:text-zinc-400 uppercase tracking-wider block px-1">
                Unpaid Rounds ({shopUnpaidOrders.length})
              </span>
              {shopUnpaidOrders.map((ord: any) => {
                const tkt = ord.ticketNo || ord.orderNo || `TKT-${ord.id}`;
                const due = Math.max(0, (ord.totalAmount ?? ord.total ?? 0) - (ord.paidAmount ?? 0));
                return (
                  <div
                    key={ord.id}
                    className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-2.5 space-y-1.5 border-0 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#24180A] dark:text-white flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-[#D98A3C]" />
                        <span>{tkt}</span>
                        <span className="text-[10px] text-stone-400 font-normal">({fmtTime(ord.createdAt)})</span>
                      </span>
                      <span className="font-bold text-[#D98A3C] font-mono">Rs. {due}</span>
                    </div>

                    <div className="text-[11px] text-[#786B5D] dark:text-zinc-400 pl-4 space-y-0.5">
                      {ord.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between">
                          <span>{it.name} ×{it.quantity}</span>
                          <span className="font-mono">Rs. {it.unitPrice * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Cart Items */}
          {cart.length === 0 ? (
            accountType !== "shopkeepers" || shopUnpaidOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 py-6 select-none">
                <ShoppingBag className="w-8 h-8 stroke-1 text-stone-300 mb-1" />
                <p className="text-xs font-bold text-[#24180A] dark:text-white">
                  {t.noItemsInSale || "No items selected"}
                </p>
                <p className="text-[11px] text-[#786B5D] dark:text-zinc-400 mt-0.5">
                  Tap + Add on any food item to begin order
                </p>
              </div>
            ) : null
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#786B5D] dark:text-zinc-400 uppercase tracking-wider block px-1">
                New Items ({totalItemsCount})
              </span>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#24180A] dark:text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-[#D98A3C] font-bold font-mono">
                      Rs. {item.price * item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-7 bg-white dark:bg-[#121824] rounded-full px-1.5 flex items-center gap-1.5 border-0">
                      <button
                        type="button"
                        onClick={() => decFromCart(item.id)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer ${
                          item.quantity === 1
                            ? "bg-red-500 text-white"
                            : "bg-black text-white dark:bg-white dark:text-black"
                        }`}
                      >
                        {item.quantity === 1 ? <Trash2 className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                      </button>
                      <span className="min-w-[14px] text-center text-xs font-mono font-bold text-[#24180A] dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(item, 1)}
                        className="w-5 h-5 rounded-full bg-[#D98A3C] text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Checkout Action */}
        <div className="p-3.5 border-t border-[#F8F3EC] dark:border-white/5 bg-[#F8F3EC]/50 dark:bg-[#1A2232]/50 shrink-0 space-y-2.5">
          {/* Quick Discount Selector if permitted */}
          {permissions.canDiscount && (
            <div className="flex items-center justify-between gap-1.5 pb-1">
              <span className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400">
                Discount:
              </span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setDiscountPercent(pct);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      discountPercent === pct
                        ? "bg-[#D98A3C] text-white"
                        : "bg-white dark:bg-[#121824] text-stone-600 dark:text-zinc-400 hover:bg-stone-100"
                    }`}
                  >
                    {pct === 0 ? "0%" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold text-[#24180A] dark:text-white">
            <span>{t.totalBill || "Total Due"}</span>
            <div className="text-right">
              {discountPercent > 0 && (
                <span className="text-xs line-through text-stone-400 mr-1.5">
                  Rs. {subtotal}
                </span>
              )}
              <span className="text-[#D98A3C] text-base sm:text-lg font-mono font-black">
                Rs. {total}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={isPlacing || cart.length === 0}
            className="w-full bg-[#D98A3C] hover:bg-[#C27930] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-2xl shadow-none transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {accountType === "shopkeepers" ? "Send to Kitchen & Khata" : "Review & Place Order"} • Rs. {total}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MOBILE FLOATING CART BOTTOM BAR ──── */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-0 right-0 z-30 px-3 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setIsMobileCartOpen(true);
              }}
              className="w-full bg-[#121824] text-white p-2.5 rounded-full border border-stone-800 shadow-2xl shadow-black/40 ring-1 ring-white/10 transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98]"
            >
              {/* Left: Cart Count & Total Price */}
              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-9 h-9 rounded-full bg-[#D98A3C]/20 text-[#D98A3C] flex items-center justify-center font-bold shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-[11px] font-medium text-stone-300 leading-tight">
                    {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} selected • <span className="text-stone-400">{customerName}</span>
                  </p>
                  <p className="text-base font-black font-mono text-[#D98A3C] leading-tight mt-0.5">
                    Rs. {total.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Right: View Cart Button */}
              <div className="flex items-center gap-1.5 bg-[#D98A3C] hover:bg-[#C27930] text-black font-black px-4 py-2 rounded-full text-xs shrink-0 active:scale-95 transition-transform shadow-md">
                <span>View Order</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE CART DRAWER (Sheet) ──── */}
      <Drawer open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <DrawerContent className="max-h-[90vh] bg-white dark:bg-[#121824] border-0 rounded-t-[32px] p-0 flex flex-col focus:outline-none overflow-hidden">
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto my-2.5 shrink-0" />
          
          {/* Drawer Header */}
          <div className="px-5 py-2.5 flex items-center justify-between border-b border-[#F8F3EC] dark:border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#24180A] dark:text-white leading-tight">
                  {accountType === "shopkeepers" ? "Market Khata Tab" : "Current Order Ticket"}
                </h3>
                <p className="text-[10px] text-[#786B5D] dark:text-zinc-400 font-bold">
                  {accountType === "shopkeepers" ? customerName : `Seating: ${customerName}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Middle: Cart Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 no-scrollbar min-h-0">
            {/* If Shopkeepers Mode & Has Unpaid Tickets */}
            {accountType === "shopkeepers" && shopUnpaidOrders.length > 0 && (
              <div className="space-y-2 mb-3">
                <span className="text-[10px] font-bold text-[#786B5D] dark:text-zinc-400 uppercase tracking-wider block px-1">
                  Unpaid Rounds ({shopUnpaidOrders.length})
                </span>
                {shopUnpaidOrders.map((ord: any) => {
                  const tkt = ord.ticketNo || ord.orderNo || `TKT-${ord.id}`;
                  const due = Math.max(0, (ord.totalAmount ?? ord.total ?? 0) - (ord.paidAmount ?? 0));
                  return (
                    <div
                      key={ord.id}
                      className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-2.5 space-y-1.5 border-0 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#24180A] dark:text-white flex items-center gap-1">
                          <Receipt className="w-3 h-3 text-[#D98A3C]" />
                          <span>{tkt}</span>
                          <span className="text-[10px] text-stone-400 font-normal">({fmtTime(ord.createdAt)})</span>
                        </span>
                        <span className="font-bold text-[#D98A3C] font-mono">Rs. {due}</span>
                      </div>

                      <div className="text-[11px] text-[#786B5D] dark:text-zinc-400 pl-4 space-y-0.5">
                        {ord.items?.map((it: any) => (
                          <div key={it.id} className="flex justify-between">
                            <span>{it.name} ×{it.quantity}</span>
                            <span className="font-mono">Rs. {it.unitPrice * it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Items */}
            {cart.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-center text-stone-400 py-6 select-none">
                <ShoppingBag className="w-8 h-8 stroke-1 text-stone-300 mb-1" />
                <p className="text-xs font-bold text-[#24180A] dark:text-white">
                  {t.noItemsInSale || "No items selected"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#786B5D] dark:text-zinc-400 uppercase tracking-wider block px-1">
                  Selected Items ({totalItemsCount})
                </span>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#24180A] dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-[#D98A3C] font-bold font-mono">
                        Rs. {item.price * item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="h-7 bg-white dark:bg-[#121824] rounded-full px-1.5 flex items-center gap-1.5 border-0">
                        <button
                          type="button"
                          onClick={() => decFromCart(item.id)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer ${
                            item.quantity === 1
                              ? "bg-red-500 text-white"
                              : "bg-black text-white dark:bg-white dark:text-black"
                          }`}
                        >
                          {item.quantity === 1 ? <Trash2 className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                        </button>
                        <span className="min-w-[14px] text-center text-xs font-mono font-bold text-[#24180A] dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item, 1)}
                          className="w-5 h-5 rounded-full bg-[#D98A3C] text-white flex items-center justify-center transition cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Bottom Action */}
          <div className="p-4 border-t border-[#F8F3EC] dark:border-white/5 bg-[#F8F3EC]/50 dark:bg-[#1A2232]/50 shrink-0 space-y-2.5">
            {/* Quick Discount Selector */}
            {permissions.canDiscount && (
              <div className="flex items-center justify-between gap-1.5 pb-1">
                <span className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400">
                  Discount:
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setDiscountPercent(pct);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        discountPercent === pct
                          ? "bg-[#D98A3C] text-white"
                          : "bg-white dark:bg-[#121824] text-stone-600 dark:text-zinc-400 hover:bg-stone-100"
                      }`}
                    >
                      {pct === 0 ? "0%" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-bold text-[#24180A] dark:text-white">
              <span>{t.totalBill || "Total Due"}</span>
              <div className="text-right">
                {discountPercent > 0 && (
                  <span className="text-xs line-through text-stone-400 mr-1.5">
                    Rs. {subtotal}
                  </span>
                )}
                <span className="text-[#D98A3C] text-base sm:text-lg font-mono font-black">
                  Rs. {total}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileCartOpen(false);
                handleOpenConfirm();
              }}
              disabled={isPlacing || cart.length === 0}
              className="w-full bg-[#D98A3C] hover:bg-[#C27930] active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl shadow-none transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {accountType === "shopkeepers" ? "Send to Kitchen & Khata" : "Review & Place Order"} • Rs. {total}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── MODAL 1: PRE-ORDER CONFIRMATION DIALOG ──── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[28px] p-5 sm:p-6 max-w-md w-full border-0 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-[#F8F3EC] dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white">
                    {t.confirmOrderTitle || "Confirm Order"}
                  </h3>
                  <p className="text-[11px] text-[#786B5D] dark:text-zinc-400 font-bold">
                    Account: <strong className="text-[#D98A3C]">{customerName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Items Preview */}
            <div className="my-3 max-h-44 overflow-y-auto divide-y divide-stone-100 dark:divide-white/5 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-3 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="py-1.5 flex justify-between text-xs font-bold text-[#24180A] dark:text-white">
                  <span>
                    {item.name} <strong className="text-[#D98A3C]">×{item.quantity}</strong>
                  </span>
                  <span className="font-mono">Rs. {item.price * item.quantity}</span>
                </div>
              ))}
              {/* Discount in Modal */}
              {permissions.canDiscount && (
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#24180A] dark:text-white border-t border-stone-200 dark:border-white/10 mt-1">
                  <span>Discount:</span>
                  <div className="flex items-center gap-1">
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setDiscountPercent(pct);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          discountPercent === pct
                            ? "bg-[#D98A3C] text-white"
                            : "bg-stone-100 dark:bg-[#121824] text-stone-600 dark:text-zinc-400"
                        }`}
                      >
                        {pct === 0 ? "0%" : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between text-sm font-black text-[#24180A] dark:text-white border-t border-stone-200 dark:border-white/10 mt-1">
                <span>Total Due:</span>
                <div className="text-right">
                  {discountPercent > 0 && (
                    <span className="text-xs line-through text-stone-400 mr-1.5 font-normal">
                      Rs. {subtotal}
                    </span>
                  )}
                  <span className="text-[#D98A3C] text-base font-mono">Rs. {total}</span>
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-bold text-[#24180A] dark:text-white">
                Payment Status:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmPaymentMode("unpaid")}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border-0 ${
                    confirmPaymentMode === "unpaid"
                      ? "bg-[#D98A3C] text-white shadow-none"
                      : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Khata / Unpaid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPaymentMode("paid")}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border-0 ${
                    confirmPaymentMode === "paid"
                      ? "bg-emerald-600 text-white shadow-none"
                      : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Paid (Cash)</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-[#786B5D] hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232] cursor-pointer border-0"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmAndPlace}
                disabled={isPlacing}
                className="flex-2 py-2.5 bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-0"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    <span>Send to Kitchen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD NEW SHOPKEEPER / KHATA ACCOUNT ──── */}
      {showAddShopModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[28px] p-5 sm:p-6 max-w-sm w-full border-0 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-[#F8F3EC] dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-[#24180A] dark:text-white">
                  Register Market Shopkeeper
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddShopModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShopkeeper} className="mt-3 space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400">Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khan Cloth House"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400">Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Haji Bashir"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400">Shop #</label>
                  <input
                    type="text"
                    placeholder="Shop #12"
                    value={newShopNumber}
                    onChange={(e) => setNewShopNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400">Phone</label>
                  <input
                    type="tel"
                    placeholder="0300-..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-bold text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddShopModal(false)}
                  className="flex-1 py-2 rounded-full text-xs font-bold text-stone-500 hover:bg-[#F8F3EC] cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createShopkeeperMutation.isPending}
                  className="flex-2 py-2 bg-[#D98A3C] hover:bg-[#C27930] text-white rounded-full text-xs font-bold shadow-none cursor-pointer disabled:opacity-50 border-0"
                >
                  {createShopkeeperMutation.isPending ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: SETTLE KHATA PAYMENT (FULL & PARTIAL) ──── */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[28px] p-5 sm:p-6 max-w-md w-full border-0 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F8F3EC] dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#24180A] dark:text-white">
                    Settle Khata Payment
                  </h3>
                  <p className="text-[11px] font-bold text-stone-500 dark:text-zinc-400">
                    {customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 no-scrollbar min-h-0">
              {/* Due Summary Card */}
              <div className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#786B5D] dark:text-zinc-400 block">
                    Total Khata Due
                  </span>
                  <span className="text-xl font-black font-mono text-[#D98A3C]">
                    Rs. {totalShopKhataDue.toLocaleString()}
                  </span>
                </div>
                <span className="px-3 py-1 bg-white dark:bg-[#121824] rounded-full text-[11px] font-bold text-[#24180A] dark:text-zinc-200">
                  {shopUnpaidOrders.length} Unpaid Rounds
                </span>
              </div>

              {/* Full vs Partial Toggle */}
              <div>
                <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400 block mb-1">
                  Payment Option
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#F8F3EC] dark:bg-[#1A2232] p-1 rounded-full">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setIsFullPay(true);
                      setSettleAmount(totalShopKhataDue.toString());
                    }}
                    className={`py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      isFullPay
                        ? "bg-[#D98A3C] text-white font-black"
                        : "text-stone-600 dark:text-zinc-300 hover:text-[#24180A]"
                    }`}
                  >
                    Full (Rs. {totalShopKhataDue.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setIsFullPay(false);
                      setSettleAmount("");
                    }}
                    className={`py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      !isFullPay
                        ? "bg-[#D98A3C] text-white font-black"
                        : "text-stone-600 dark:text-zinc-300 hover:text-[#24180A]"
                    }`}
                  >
                    Partial Payment
                  </button>
                </div>
              </div>

              {/* Partial Amount Input & Quick Buttons */}
              {!isFullPay && (
                <div className="space-y-2 animate-in fade-in-50">
                  <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400 block">
                    Enter Amount to Settle (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalShopKhataDue}
                    placeholder="e.g. 500"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-sm font-black font-mono text-[#24180A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                    autoFocus
                  />

                  {/* Quick Pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[100, 200, 500, 1000].map((amt) => {
                      if (amt > totalShopKhataDue) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            playTapSound();
                            setSettleAmount(amt.toString());
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-stone-100 dark:bg-zinc-800 hover:bg-[#D98A3C]/20 hover:text-[#D98A3C] text-stone-700 dark:text-zinc-300 cursor-pointer transition"
                        >
                          + Rs. {amt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remaining Balance Preview */}
                  {parseFloat(settleAmount) > 0 && (
                    <div className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 flex justify-between pt-1">
                      <span>Remaining Balance after payment:</span>
                      <span className="font-mono text-orange-600 dark:text-orange-400 font-black">
                        Rs. {Math.max(0, totalShopKhataDue - (parseFloat(settleAmount) || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-bold text-[#786B5D] dark:text-zinc-400 block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlePayMode("cash")}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      settlePayMode === "cash"
                        ? "border-[#D98A3C] bg-[#D98A3C]/10 text-[#D98A3C]"
                        : "border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlePayMode("bank")}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      settlePayMode === "bank"
                        ? "border-[#D98A3C] bg-[#D98A3C]/10 text-[#D98A3C]"
                        : "border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Online / QR</span>
                  </button>
                </div>
              </div>

              {/* Unpaid Tickets Breakdown */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#786B5D] dark:text-zinc-400 block">
                  Orders Covered in this Khata
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 no-scrollbar">
                  {shopUnpaidOrders.map((ord: any) => {
                    const tkt = ord.ticketNo || ord.orderNo || `TKT-${ord.id}`;
                    const due = Math.max(0, (ord.totalAmount ?? ord.total ?? 0) - (ord.paidAmount ?? 0));
                    return (
                      <div
                        key={ord.id}
                        className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-xl p-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-[#24180A] dark:text-white flex items-center gap-1">
                            <Receipt className="w-3 h-3 text-[#D98A3C]" />
                            <span>{tkt}</span>
                            <span className="text-[10px] text-stone-400 font-normal">({fmtTime(ord.createdAt)})</span>
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-zinc-400 truncate block">
                            {ord.items?.map((it: any) => `${it.name} ×${it.quantity}`).join(", ")}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#D98A3C] shrink-0">
                          Rs. {due}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-3 border-t border-[#F8F3EC] dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-stone-500 hover:bg-[#F8F3EC] cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteKhataSettlement}
                disabled={isSettlingKhata}
                className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-0"
              >
                {isSettlingKhata ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      Confirm Rs. {isFullPay ? totalShopKhataDue.toLocaleString() : (parseFloat(settleAmount) || 0).toLocaleString()}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
