"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Utensils,
  Plus,
  Minus,
  Trash2,
  Tag,
  ShoppingBag,
  Loader2,
  Percent,
  Zap,
  Store,
  Building2,
  UserPlus,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Check,
  Receipt,
  ChefHat,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, playOrderSuccessSound } from "@/lib/sound";

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

const COMMON_TABLES = ["T-1", "T-2", "T-3", "T-4", "T-5", "T-6", "T-7", "T-8", "Takeaway 🛍️"];

export function PosTerminalTab({ onOrderCreated }: PosTerminalTabProps) {
  const { t, lang } = useLang();

  // State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState("T-1");
  const [customerPhone, setCustomerPhone] = useState("");
  const [accountType, setAccountType] = useState<"tables" | "shopkeepers">("tables");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPlacing, setIsPlacing] = useState(false);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newShopNumber, setNewShopNumber] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [confirmPaymentMode, setConfirmPaymentMode] = useState<"unpaid" | "paid">("unpaid");

  // Queries
  const { data: menu = [], isLoading: menuLoading } =
    trpc.hotel.getMenu.useQuery();
  const { data: shopkeepersList = [], refetch: refetchShopkeepers } =
    trpc.hotel.getShopkeepers.useQuery();
  const createShopkeeperMutation = trpc.hotel.createShopkeeper.useMutation();
  const getOrCreateCustomer = trpc.hotel.getOrCreateCustomer.useMutation();
  const placeOrder = trpc.hotel.placeOrder.useMutation();

  // Create new shopkeeper inline
  const handleCreateShopkeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) {
      toast.error("دکان کا نام درج کریں (Enter shop name)");
      return;
    }
    try {
      const created = await createShopkeeperMutation.mutateAsync({
        name: newOwnerName.trim() || newShopName.trim(),
        shopName: newShopName.trim(),
        shopNumber: newShopNumber.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      toast.success(`دکاندار "${created.shopName}" شامل کر دیا گیا ✓`);
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
          item.id === product.id
            ? { ...item, quantity: item.quantity + qtyCount }
            : item
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

  // Distinct Categories
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    menu.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return ["all", ...Array.from(cats)];
  }, [menu]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return menu.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, search]);

  // Pre-Order Confirmation: Opens confirmation modal rather than creating order directly
  const handleOpenConfirm = () => {
    if (cart.length === 0) {
      toast.error("آرڈر میں کوئی چیز شامل نہیں ہے (Cart is empty)");
      return;
    }
    playTapSound();
    setShowConfirmModal(true);
  };

  // Final Order Execution (Only after explicit review)
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
        items: cart.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });

      playOrderSuccessSound();
      toast.success(`Order #${result.orderId} placed for "${cName}" ✓`);

      setShowConfirmModal(false);
      clearCart();

      // Trigger payment callback if marked as paid or for receipt flow
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
      {/* ── LEFT PANE: Food Matrix / Fast List ──── */}
      <div className="flex-1 lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col overflow-hidden min-h-0 space-y-2">
        {/* Top Control Bar: Search & Categories */}
        <div className="bg-white px-2.5 sm:px-3 py-2 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 capitalize ${
                    isSelected
                      ? "bg-black text-white shadow-xs"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>
                    {cat === "all"
                      ? "🌟 " + (t.all || "All")
                      : cat.toLowerCase().includes("chai") || cat.toLowerCase().includes("tea")
                      ? "☕ " + cat
                      : cat.toLowerCase().includes("paratha") || cat.toLowerCase().includes("roti")
                      ? "🫓 " + cat
                      : cat.toLowerCase().includes("nashta") || cat.toLowerCase().includes("breakfast")
                      ? "🍳 " + cat
                      : cat.toLowerCase().includes("karahi") || cat.toLowerCase().includes("chicken")
                      ? "🍗 " + cat
                      : cat.toLowerCase().includes("drink") || cat.toLowerCase().includes("lassi")
                      ? "🥤 " + cat
                      : "🍽️ " + cat}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-36 sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder || "Search..."}
              className="w-full pl-8 pr-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Product Items: Responsive 1-Thumb Fast List on Mobile & Grid on Desktop */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 no-scrollbar pb-16 lg:pb-0">
          {menuLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
            </div>
          ) : (
            <div className="space-y-2 lg:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 lg:gap-2.5 lg:space-y-0">
              {filteredProducts.map((product) => {
                const qty = getQty(product.id);
                const isSelected = qty > 0;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl border transition-all flex lg:flex-col overflow-hidden relative select-none shadow-2xs ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Mobile 1-Thumb Row Layout (On Mobile screens) */}
                    <div className="flex lg:hidden items-center justify-between p-2.5 w-full gap-2.5">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 font-bold text-lg">
                            ☕
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                            {qty}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <p className="font-black text-xs text-gray-900 mt-0.5">
                          Rs. {product.price}
                        </p>
                      </div>

                      {/* 1-Tap Fast Multipliers */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => addToCart(product, 1)}
                          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-black text-xs text-gray-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(product, 2)}
                          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-black text-xs text-gray-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
                        >
                          +2
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(product, 5)}
                          className="w-9 h-9 rounded-xl bg-blue-100 hover:bg-blue-600 hover:text-white active:scale-90 font-black text-xs text-blue-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    {/* Desktop Card Layout (On Desktop/Tablet Screens) */}
                    <div className="hidden lg:flex flex-col h-full">
                      {/* Photo Section */}
                      <div
                        onClick={() => addToCart(product, 1)}
                        className="aspect-16/10 w-full bg-gray-100 relative overflow-hidden cursor-pointer"
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50/50 text-blue-400">
                            <Utensils className="w-8 h-8 opacity-30" />
                          </div>
                        )}

                        {/* Active Quantity Badge */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                            {qty}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between bg-white">
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm line-clamp-1 leading-tight">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                              Rs. {product.price}
                            </span>
                            {product.category && (
                              <span className="text-[9px] font-bold text-gray-400 truncate max-w-[70px]">
                                {product.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fast Multiplier Chips (+1, +2, +5) */}
                        <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => addToCart(product, 1)}
                            className="flex-1 py-1 rounded bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-extrabold text-[11px] text-gray-800 transition cursor-pointer text-center"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => addToCart(product, 2)}
                            className="flex-1 py-1 rounded bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-extrabold text-[11px] text-gray-800 transition cursor-pointer text-center"
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            onClick={() => addToCart(product, 5)}
                            className="flex-1 py-1 rounded bg-blue-100 hover:bg-blue-600 hover:text-white active:scale-90 font-extrabold text-[11px] text-blue-800 transition cursor-pointer text-center"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: Live Register Sale Sidebar (Desktop/Tablet) ──── */}
      <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 2xl:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex-col h-full overflow-hidden min-h-0">
        {/* Register Header */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
              Current Sale ({totalItemsCount})
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-600 hover:underline font-extrabold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Account Selector: Tables vs Market Shopkeepers Tab */}
        <div className="p-2.5 bg-gray-50/70 border-b border-gray-100 space-y-2 shrink-0">
          {/* Toggle Type */}
          <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-[11px] font-black">
            <button
              type="button"
              onClick={() => setAccountType("tables")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                accountType === "tables" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600"
              }`}
            >
              {t.dineInTables || "🪑 Dine-in Tables"}
            </button>
            <button
              type="button"
              onClick={() => setAccountType("shopkeepers")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center ${
                accountType === "shopkeepers" ? "bg-white text-blue-800 shadow-2xs" : "text-gray-600"
              }`}
            >
              {t.marketShopkeepers || "🏪 Market Shopkeepers (Khata)"}
            </button>
          </div>

          {/* If Tables Mode: Quick Table Chips + Walk-in Button + Custom Name & Phone */}
          {accountType === "tables" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setCustomerName(t.walkInCustomer || "Walk-in Guest");
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black shrink-0 transition cursor-pointer flex items-center gap-1 ${
                    customerName === (t.walkInCustomer || "Walk-in Guest")
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>👤</span>
                  <span>{t.walkInCustomer || "Walk-in"}</span>
                </button>
                {COMMON_TABLES.map((tName) => (
                  <button
                    key={tName}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setCustomerName(tName);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold shrink-0 transition cursor-pointer ${
                      customerName === tName
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tName}
                  </button>
                ))}
              </div>

              {/* Dual Input: Name & Phone Number (Just like captive portal) */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.enterCustomerName || "Name / Table"}
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t.phoneLabel || "Phone #"}
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* If Shopkeepers Mode: Registered Shopkeeper Chips + Add Shopkeeper Button */}
          {accountType === "shopkeepers" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {shopkeepersList.map((shop) => {
                  const shopLabel = `${shop.shopName}${shop.shopNumber ? ` (${shop.shopNumber})` : ""}`;
                  const isSelected = customerName === shopLabel;
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setCustomerName(shopLabel);
                        if (shop.phone) {
                          setCustomerPhone(shop.phone);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <Store className="w-3 h-3 text-blue-500" />
                      <span>{shop.shopName}</span>
                      {shop.shopNumber && (
                        <span className="text-[9px] opacity-75 font-mono">{shop.shopNumber}</span>
                      )}
                    </button>
                  );
                })}

                {/* Inline Add Shopkeeper Button */}
                <button
                  type="button"
                  onClick={() => setShowAddShopModal(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t.addNewShopkeeper || "+ Add Shopkeeper"}</span>
                </button>
              </div>

              {/* Dual Input for Khata Account */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <Store className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.shopNameLabel || "Shop / Account"}
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t.phoneLabel || "Phone #"}
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List (Internal Scroll) */}
        <div className="flex-1 overflow-y-auto px-4 py-1.5 divide-y divide-gray-100 no-scrollbar min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6 select-none">
              <ShoppingBag className="w-10 h-10 stroke-1 text-gray-300 mb-1.5" />
              <p className="text-xs sm:text-sm font-extrabold text-gray-700">
                {t.noItemsInSale || "No items in sale"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 max-w-[190px]">
                {t.tapProductsToAdd || "Click or tap products on the left to add"}
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between gap-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 ml-2">
                      Rs. {item.price * item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-gray-400 font-medium">
                      Rs. {item.price} each
                    </span>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => decFromCart(item.id)}
                          className="w-5 h-5 rounded bg-white shadow-2xs flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-90 transition cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-extrabold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item, 1)}
                          className="w-5 h-5 rounded bg-blue-600 text-white shadow-2xs flex items-center justify-center hover:bg-blue-700 active:scale-90 transition cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Giant 1-Tap Review & Place Order Button */}
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/90 shrink-0 space-y-2.5">
          <div className="flex justify-between items-center text-sm sm:text-base font-extrabold text-gray-900">
            <span>{t.totalBill || "Total Due"}</span>
            <span className="text-blue-600 text-base sm:text-lg">Rs. {total}</span>
          </div>

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={isPlacing || cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-40 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{t.reviewAndPlace || "Review & Place Order"} • Rs. {total}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MOBILE ONLY: Sticky Floating Bottom Register Bar (< lg) ──── */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                {totalItemsCount}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-300 font-bold truncate">
                  {customerName || (t.walkInCustomer || "Sale")}
                  {customerPhone ? ` • ${customerPhone}` : ""}
                </p>
                <p className="text-sm font-black text-white">Rs. {total}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearCart}
                className="px-2.5 py-2 text-xs font-bold text-gray-400 hover:text-white"
              >
                {t.clearSale || "Clear"}
              </button>
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={isPlacing}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{t.reviewAndPlace || "Review & Order"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: PRE-ORDER CONFIRMATION DIALOG (With Name & Phone Captive Style) ──── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 leading-none">
                    {t.confirmOrderTitle || "Confirm Order"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-bold">
                    {t.selectedAccount || "Account"}: <strong className="text-blue-700">{customerName}</strong>
                    {customerPhone && <span className="text-gray-400"> ({customerPhone})</span>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Captive-Style Customer Card (Name + Phone) */}
            <div className="mt-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/80 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-blue-950 flex items-center gap-1 mb-1">
                    <span>👤</span>
                    <span>{t.customerNameLabel || "Customer / Table"}</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.enterCustomerName || "Name or table..."}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-950 flex items-center gap-1 mb-1">
                    <span>📱</span>
                    <span>{t.phoneLabel || "Phone #"}</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-xxxxxxx"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="my-3 max-h-44 overflow-y-auto divide-y divide-gray-100 bg-gray-50 rounded-2xl p-3 border border-gray-100 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="py-1.5 flex justify-between text-xs">
                  <span className="font-bold text-gray-800">
                    {item.name} <strong className="text-blue-600">×{item.quantity}</strong>
                  </span>
                  <span className="font-black text-gray-900">
                    Rs. {item.price * item.quantity}
                  </span>
                </div>
              ))}
              <div className="pt-2 flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 mt-1">
                <span>{t.totalBill || "Total Due"}:</span>
                <span className="text-blue-700 text-base">Rs. {total}</span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-black text-gray-700">
                {t.paymentType || "Payment Status"}:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmPaymentMode("unpaid")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    confirmPaymentMode === "unpaid"
                      ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.khataLater || "Khata / Unpaid"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPaymentMode("paid")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    confirmPaymentMode === "paid"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.paidNow || "Paid Now (Cash)"}</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmAndPlace}
                disabled={isPlacing}
                className="flex-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.sendingToKitchen || "Sending..."}</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    <span>{t.confirmAndSendKitchen || "Confirm & Send to Kitchen"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD NEW SHOPKEEPER / KHATA ACCOUNT ──── */}
      {showAddShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-gray-900">
                  {t.newShopModalTitle || "Register Market Shopkeeper"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddShopModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShopkeeper} className="mt-3 space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-700">{t.shopNameLabel || "Shop Name *"}</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: خان کلاتھ ہاؤس"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700">{t.ownerNameLabel || "Owner Name"}</label>
                <input
                  type="text"
                  placeholder="مثلاً: حاجی بشیر صاحب"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700">{t.shopNumberLabel || "Shop #"}</label>
                  <input
                    type="text"
                    placeholder="Shop #12"
                    value={newShopNumber}
                    onChange={(e) => setNewShopNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700">{t.phoneLabel || "Phone"}</label>
                  <input
                    type="tel"
                    placeholder="0300-..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddShopModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={createShopkeeperMutation.isPending}
                  className="flex-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {createShopkeeperMutation.isPending ? (t.sendingToKitchen || "Saving...") : (t.saveAccount || "Save Account ✓")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
