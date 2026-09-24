"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { StaffWorkspaceSwitcher } from "@/components/StaffWorkspaceSwitcher";
import { StaffAuthGuard } from "@/components/StaffAuthGuard";
import { playTapSound, playOrderSuccessSound } from "@/lib/sound";
import {
  Hotel,
  Users,
  Wallet,
  TrendingUp,
  CreditCard,
  Building2,
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Share2,
  Smartphone,
  Check,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowRight,
  LogOut,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  CheckSquare,
  Square,
  Settings,
  Store,
  Split,
  Maximize2,
  X,
  ChefHat,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PERMISSION_OPTIONS = [
  {
    id: "can_access_cashier",
    label: "Cashier POS Access",
    desc: "Open billing register and punch orders",
    roles: ["admin", "cashier"],
  },
  {
    id: "can_discount",
    label: "Apply Discounts",
    desc: "Allow applying custom discounts & vouchers",
    roles: ["admin", "cashier"],
  },
  {
    id: "can_settle_khata",
    label: "Settle Khata / Udhar",
    desc: "Collect payments & clear shopkeeper ledger balances",
    roles: ["admin", "cashier"],
  },
  {
    id: "can_void_order",
    label: "Void / Cancel Orders",
    desc: "Cancel active or misplaced orders",
    roles: ["admin"],
  },
  {
    id: "can_access_kitchen",
    label: "Kitchen KDS Access",
    desc: "View kitchen queue and update food preparation status",
    roles: ["admin", "cashier", "kitchen"],
  },
  {
    id: "can_access_waiter",
    label: "Waiter Delivery Station",
    desc: "Serve ready items and manage table delivery",
    roles: ["admin", "cashier", "kitchen", "waiter"],
  },
  {
    id: "can_view_reports",
    label: "Financial Analytics & Reports",
    desc: "View daily sales, total cash/bank breakdown",
    roles: ["admin"],
  },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  admin: [
    "can_access_cashier",
    "can_discount",
    "can_settle_khata",
    "can_void_order",
    "can_access_kitchen",
    "can_access_waiter",
    "can_view_reports",
  ],
  cashier: [
    "can_access_cashier",
    "can_discount",
    "can_settle_khata",
    "can_access_kitchen",
    "can_access_waiter",
  ],
  kitchen: ["can_access_kitchen", "can_access_waiter"],
  waiter: ["can_access_waiter"],
};

export function AdminDashboardView() {
  const { staff, clientIp, logout } = useAuth();
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState<"accounts" | "staff">("accounts");
  const [selectedCounterTab, setSelectedCounterTab] = useState<string>("all");
  const [staffRoleFilter, setStaffRoleFilter] = useState<
    "all" | "admin" | "cashier" | "kitchen" | "waiter"
  >("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showEditIpModal, setShowEditIpModal] = useState<any | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  // Form State for Add Staff
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "cashier" | "waiter" | "kitchen">("cashier");
  const [newStation, setNewStation] = useState("Counter 1");
  const [newAssignedCashierId, setNewAssignedCashierId] = useState<number | null>(null);
  const [newAllowedIp, setNewAllowedIp] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>(DEFAULT_ROLE_PERMS.cashier);
  const [formError, setFormError] = useState("");

  // Form State for Edit Staff
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "cashier" | "waiter" | "kitchen">("cashier");
  const [editStation, setEditStation] = useState("");
  const [editAssignedCashierId, setEditAssignedCashierId] = useState<number | null>(null);
  const [editAllowedIp, setEditAllowedIp] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editFormError, setEditFormError] = useState("");

  // Form state for Quick Edit IP
  const [editIpValue, setEditIpValue] = useState("");

  // State for Counter In-Charge Cashier Assignment Modal
  const [showAssignCashiersModal, setShowAssignCashiersModal] = useState<string | null>(null);
  const [selectedCounterCashierIds, setSelectedCounterCashierIds] = useState<number[]>([]);

  // Queries
  const accountsQuery = trpc.admin.getAccountsOverview.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const staffQuery = trpc.admin.listStaff.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const departmentsQuery = trpc.hotel.getDepartments.useQuery();

  // Mutations
  const updateConfigMut = trpc.admin.updateSystemConfig.useMutation();
  const createStaffMut = trpc.admin.createStaff.useMutation();
  const updateStaffMut = trpc.admin.updateStaff.useMutation();
  const deleteStaffMut = trpc.admin.deleteStaff.useMutation();
  const assignCounterCashiersMut = trpc.admin.assignCounterCashiers.useMutation();

  const togglePasswordVisibility = (id: number) => {
    playTapSound();
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAssignCashiersModal = (counterName: string, currentCashiers: any[]) => {
    playTapSound();
    setShowAssignCashiersModal(counterName);
    setSelectedCounterCashierIds(currentCashiers.map((c) => c.id));
  };

  const handleSaveCounterCashiers = async () => {
    if (!showAssignCashiersModal) return;
    try {
      playTapSound();
      await assignCounterCashiersMut.mutateAsync({
        counterName: showAssignCashiersModal,
        cashierIds: selectedCounterCashierIds,
      });
      playOrderSuccessSound();
      toast.success(`In-charge cashier(s) updated for ${showAssignCashiersModal}!`);
      setShowAssignCashiersModal(null);
      accountsQuery.refetch();
      staffQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update counter cashiers");
    }
  };

  const handleToggleMode = async () => {
    const currentMode = accountsQuery.data?.operationMode || "unified";
    const nextMode = currentMode === "unified" ? "segregated" : "unified";
    playTapSound();
    try {
      await updateConfigMut.mutateAsync({ operationMode: nextMode });
      playOrderSuccessSound();
      toast.success(
        nextMode === "segregated"
          ? "Switched to Counter-Segregated Pod Mode!"
          : "Switched to Unified Shared Register Mode!"
      );
      accountsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update operation mode");
    }
  };

  const allCashiers = (staffQuery.data || []).filter((s) => s.role === "cashier");

  const handleOpenAddModal = () => {
    playTapSound();
    setNewName("");
    setNewEmail("");
    setNewPassword("1234");
    setNewRole("cashier");
    setNewStation("Counter 1");
    setNewAssignedCashierId(null);
    setNewAllowedIp("");
    setNewPermissions(DEFAULT_ROLE_PERMS.cashier);
    setFormError("");
    setShowAddModal(true);
  };

  const handleRoleChangeForAdd = (role: "admin" | "cashier" | "waiter" | "kitchen") => {
    setNewRole(role);
    setNewPermissions(DEFAULT_ROLE_PERMS[role] || []);
    if (role === "cashier") setNewStation(`Counter ${allCashiers.length + 1}`);
    else if (role === "kitchen") setNewStation("Main Kitchen KDS");
    else if (role === "waiter") {
      setNewStation("Floor Delivery");
      setNewAssignedCashierId(allCashiers[0]?.id || null);
    } else {
      setNewStation("Master Admin Terminal");
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFormError("Name, username, and password are required.");
      return;
    }
    setFormError("");

    try {
      playTapSound();
      await createStaffMut.mutateAsync({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
        stationName: newStation.trim() || null,
        assignedCashierId: newRole === "waiter" ? newAssignedCashierId : null,
        permissions: newPermissions,
        allowedIp: newAllowedIp.trim() || null,
      });

      playOrderSuccessSound();
      toast.success(`Staff member "${newName}" created successfully!`);
      setShowAddModal(false);
      staffQuery.refetch();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create staff member");
    }
  };

  const handleOpenEditModal = (member: any) => {
    playTapSound();
    setEditingStaff(member);
    setEditName(member.name || "");
    setEditEmail(member.email || "");
    setEditPassword(member.password || "");
    setEditRole(member.role || "cashier");
    setEditStation(member.stationName || "");
    setEditAssignedCashierId(member.assignedCashierId || null);
    setEditAllowedIp(member.allowedIp || "");
    setEditIsActive(member.isActive ?? true);
    setEditPermissions(
      member.permissionsList && member.permissionsList.length > 0
        ? member.permissionsList
        : DEFAULT_ROLE_PERMS[member.role] || []
    );
    setEditFormError("");
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editName.trim() || !editEmail.trim()) {
      setEditFormError("Name and username/email are required.");
      return;
    }
    setEditFormError("");

    try {
      playTapSound();
      await updateStaffMut.mutateAsync({
        id: editingStaff.id,
        name: editName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        role: editRole,
        stationName: editStation.trim() || null,
        assignedCashierId: editRole === "waiter" ? editAssignedCashierId : null,
        permissions: editPermissions,
        allowedIp: editAllowedIp.trim() || null,
        isActive: editIsActive,
      });

      playOrderSuccessSound();
      toast.success(`Staff member "${editName}" updated successfully!`);
      setEditingStaff(null);
      staffQuery.refetch();
    } catch (err: any) {
      setEditFormError(err?.message || "Failed to update staff member");
    }
  };

  const handleUpdateIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditIpModal) return;

    try {
      playTapSound();
      await updateStaffMut.mutateAsync({
        id: showEditIpModal.id,
        allowedIp: editIpValue.trim() || null,
      });
      playOrderSuccessSound();
      toast.success(`Device IP updated for ${showEditIpModal.name}!`);
      setShowEditIpModal(null);
      staffQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update IP");
    }
  };

  const handleDeleteStaff = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete staff account "${name}"?`)) {
      try {
        playTapSound();
        await deleteStaffMut.mutateAsync({ id });
        toast.success(`Staff "${name}" removed.`);
        staffQuery.refetch();
      } catch (err: any) {
        toast.error(err?.message || "Failed to remove staff");
      }
    }
  };

  const handleShareCredentials = (member: any) => {
    playTapSound();
    const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "";
    const roleEmoji =
      member.role === "admin"
        ? "Master Admin"
        : member.role === "cashier"
        ? "Cashier POS"
        : member.role === "kitchen"
        ? "Kitchen Staff"
        : "Floor Waiter";

    const text = `*Smart Quetta Hotel - Staff Login Credentials*
━━━━━━━━━━━━━━━━━━━━━━
*Name:* ${member.name}
*Role:* ${roleEmoji}
*Station / Counter:* ${member.stationName || "General"}
${member.assignedCashierName ? `*Assigned Cashier:* ${member.assignedCashierName}\n` : ""}*Username / ID:* ${member.email}
*Password / PIN:* ${member.password || "1234"}
*Portal URL:* ${portalUrl}
*Bound Device IP:* ${member.allowedIp || "Any Device Allowed"}
━━━━━━━━━━━━━━━━━━━━━━
_Please open the Portal URL on your device to sign in._`;

    if (navigator.share) {
      navigator
        .share({
          title: "Staff Login Credentials",
          text,
        })
        .catch(() => copyToClipboard(text));
    } else {
      copyToClipboard(text);
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied & WhatsApp share link opened!");
  };

  const financials = accountsQuery.data?.financials;
  const shopkeepers = accountsQuery.data?.shopkeepers || [];
  const recentPayments = accountsQuery.data?.recentPayments || [];
  const operationMode = accountsQuery.data?.operationMode || "unified";
  const countersBreakdown = accountsQuery.data?.countersBreakdown || [];

  const allStaffMembers = staffQuery.data || [];
  const filteredStaff =
    staffRoleFilter === "all"
      ? allStaffMembers
      : allStaffMembers.filter((s) => s.role === staffRoleFilter);

  const adminCount = allStaffMembers.filter((s) => s.role === "admin").length;
  const cashierCount = allStaffMembers.filter((s) => s.role === "cashier").length;
  const kitchenCount = allStaffMembers.filter((s) => s.role === "kitchen").length;
  const waiterCount = allStaffMembers.filter((s) => s.role === "waiter").length;

  // Active selected counter data (if not "all")
  const selectedCounterData = countersBreakdown.find((c) => c.counterName === selectedCounterTab);

  return (
    <StaffAuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col select-none">
        {/* Top Navigation Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs gap-3 sticky top-0 z-30 w-full">
          {/* Left: Brand + Context */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-stone-900 leading-none truncate">
                {t.hotelName || "Smart Quetta Hotel"}
              </h1>
              <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mt-0.5 truncate">
                Admin Master Portal & Multi-Terminal Control
              </p>
            </div>
          </div>

          {/* Center: Centered Tab Navigation Pill */}
          <div className="flex-1 flex justify-center items-center px-2 min-w-0">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60 overflow-x-auto no-scrollbar max-w-full">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("accounts");
                }}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "accounts"
                    ? "bg-amber-500 text-stone-950 shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Accounts & Ledger</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "accounts" ? "bg-stone-950 text-amber-400" : "bg-stone-200 text-stone-700"
                }`}>
                  {countersBreakdown.length} {countersBreakdown.length === 1 ? "Counter" : "Counters"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("staff");
                }}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "staff"
                    ? "bg-amber-500 text-stone-950 shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff & Dynamic Access</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "staff" ? "bg-stone-950 text-amber-400" : "bg-stone-200 text-stone-700"
                }`}>
                  {allStaffMembers.length}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Profile & Portal Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Staff View Links */}
            <StaffWorkspaceSwitcher current="admin" />

            <div className="hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-stone-800">{staff?.name}</span>
              <span className="text-[10px] font-extrabold text-amber-800 uppercase bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                Master Admin
              </span>
            </div>

            <LangSwitcher />

            <button
              type="button"
              onClick={() => logout()}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-3.5">
          {/* Streamlined Operation Mode Toolbar */}
          <div className="bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 shadow-2xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-stone-600 hidden sm:inline">Operation Mode:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                  operationMode === "segregated"
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    operationMode === "segregated" ? "bg-purple-600" : "bg-amber-500"
                  }`}
                />
                <span>
                  {operationMode === "segregated"
                    ? "Counter-Segregated Pods (الگ کاؤنٹرز)"
                    : "Unified Shared Register (مشترکہ رجسٹر)"}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleMode}
              disabled={updateConfigMut.isPending}
              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 active:scale-[0.98] transition border border-stone-200 text-stone-800 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {operationMode === "segregated" ? "Switch to Unified" : "Switch to Pods"}
              </span>
            </button>
          </div>

          {/* TAB 1: TOTAL ACCOUNTS & COUNTER SUB-TABS */}
          {activeTab === "accounts" && (
            <div className="space-y-3.5">
              {/* Counter Sub-Tabs Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCounterTab("all");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    selectedCounterTab === "all"
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>All Counters</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCounterTab === "all"
                        ? "bg-stone-950 text-amber-400"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {countersBreakdown.length}
                  </span>
                </button>

                {countersBreakdown.map((cnt) => (
                  <button
                    key={cnt.counterName}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedCounterTab(cnt.counterName);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      selectedCounterTab === cnt.counterName
                        ? "bg-stone-900 text-white font-black shadow-2xs"
                        : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-amber-500" />
                    <span>{cnt.counterName}</span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Rs. {cnt.todayRevenue}
                    </span>
                    {cnt.activeOrdersCount > 0 && (
                      <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                        {cnt.activeOrdersCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* VIEW 1A: GRAND TOTAL AGGREGATE */}
              {selectedCounterTab === "all" ? (
                <>
                  {/* Financial KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Today Revenue */}
                    <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Today&apos;s Revenue
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-stone-900">
                        Rs. {(financials?.todayRevenue || 0).toLocaleString()}
                      </div>
                      <div className="mt-1.5 text-[10px] font-bold text-stone-500 flex items-center gap-1.5">
                        <span className="text-emerald-700 font-extrabold">Cash: Rs. {financials?.todayCash || 0}</span>
                        <span>•</span>
                        <span className="text-blue-700 font-extrabold">Bank: Rs. {financials?.todayBank || 0}</span>
                      </div>
                    </div>

                    {/* All-Time Total Revenue */}
                    <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Total All-Time
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-amber-600">
                        Rs. {(financials?.totalRevenue || 0).toLocaleString()}
                      </div>
                      <div className="mt-1.5 text-[10px] font-bold text-stone-500 flex items-center gap-1.5">
                        <span>Cash: Rs. {financials?.totalCash || 0}</span>
                        <span>•</span>
                        <span>Bank: Rs. {financials?.totalBank || 0}</span>
                      </div>
                    </div>

                    {/* Total Khata Receivables */}
                    <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Khata Receivables
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-orange-600">
                        Rs. {(financials?.totalKhataReceivable || 0).toLocaleString()}
                      </div>
                      <div className="mt-1.5 text-[10px] font-bold text-stone-500">
                        <span>{shopkeepers.length} Market Shopkeepers</span>
                      </div>
                    </div>

                    {/* Unpaid Orders Amount */}
                    <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Pending Unpaid
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-red-600">
                        Rs. {(financials?.unpaidOrdersAmount || 0).toLocaleString()}
                      </div>
                      <div className="mt-1.5 text-[10px] font-bold text-stone-500">
                        <span>{financials?.unpaidOrdersCount || 0} Active Unpaid Bills</span>
                      </div>
                    </div>
                  </div>

                  {/* Counter Stations Summary Cards Grid */}
                  <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-amber-600" />
                        <span>Counter Stations Summary</span>
                      </h3>
                      <span className="text-[11px] text-stone-500 font-bold">
                        {countersBreakdown.length} Active Stations
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {countersBreakdown.map((cnt) => (
                        <div
                          key={cnt.counterName}
                          onClick={() => {
                            playTapSound();
                            setSelectedCounterTab(cnt.counterName);
                          }}
                          className="bg-stone-50 hover:bg-white border border-stone-200/80 hover:border-amber-500 rounded-xl p-3 transition cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                                <span>{cnt.counterName}</span>
                              </h4>
                              <p className="text-[10px] text-stone-500 mt-0.2">
                                {cnt.cashiers.length > 0
                                  ? `Cashier: ${cnt.cashiers.map((c) => c.name).join(", ")}`
                                  : "No dedicated cashier"}
                              </p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-stone-200/60 text-xs">
                            <div>
                              <span className="text-[9px] text-stone-400 block font-semibold">Today</span>
                              <span className="font-mono font-black text-amber-700 text-xs">
                                Rs. {cnt.todayRevenue.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-stone-400 block font-semibold">Orders</span>
                              <span className="font-mono font-black text-stone-900 text-xs">
                                {cnt.activeOrdersCount}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1.5 border-t border-stone-200/60">
                            <span>Waiters: {cnt.waiters.length}</span>
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <span>Details</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shopkeepers Khata Ledger */}
                  <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                          Market Shopkeepers & Khata Balances (دکاندار کھاتہ)
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        Total Due: <span className="font-mono font-black text-orange-600">Rs. {(financials?.totalKhataReceivable || 0).toLocaleString()}</span>
                      </span>
                    </div>

                    {shopkeepers.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6">
                        No registered market shopkeepers yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-stone-200/80">
                        <table className="w-full text-left text-xs text-stone-700">
                          <thead className="bg-stone-50 text-stone-500 uppercase font-extrabold text-[10px] border-b border-stone-200">
                            <tr>
                              <th className="py-2 px-3">Shop Name</th>
                              <th className="py-2 px-3">Owner Name</th>
                              <th className="py-2 px-3">Shop # / Phone</th>
                              <th className="py-2 px-3 text-right">Balance Due</th>
                              <th className="py-2 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-medium">
                            {shopkeepers.map((s: any) => (
                              <tr key={s.id} className="hover:bg-stone-50/80 transition">
                                <td className="py-2 px-3 font-bold text-stone-900">
                                  <span>{s.shopName}</span>
                                </td>
                                <td className="py-2 px-3 text-stone-700">{s.name}</td>
                                <td className="py-2 px-3 text-stone-500">
                                  {s.shopNumber ? `Shop #${s.shopNumber}` : ""} {s.phone || ""}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-black text-xs">
                                  {s.balance > 0 ? (
                                    <span className="text-orange-600">Rs. {s.balance}</span>
                                  ) : (
                                    <span className="text-emerald-600">Clear (Rs. 0)</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      s.balance > 0
                                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}
                                  >
                                    {s.balance > 0 ? "Khata Due" : "Settled"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* VIEW 1B: SPECIFIC COUNTER BREAKDOWN */
                <div className="space-y-3.5">
                  {selectedCounterData && (
                    <>
                      {/* Counter Specific Financial Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                        <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 block mb-1 truncate">
                            {selectedCounterData.counterName} — Today
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-amber-700">
                            Rs. {selectedCounterData.todayRevenue.toLocaleString()}
                          </div>
                          <div className="mt-1.5 text-[10px] font-bold text-stone-500 flex items-center gap-1.5">
                            <span>Cash: Rs. {selectedCounterData.todayCash}</span>
                            <span>•</span>
                            <span>Bank: Rs. {selectedCounterData.todayBank}</span>
                          </div>
                        </div>

                        <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 block mb-1">
                            All-Time Sales
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-stone-900">
                            Rs. {selectedCounterData.totalRevenue.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 block mb-1">
                            Active Orders
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-emerald-600">
                            {selectedCounterData.activeOrdersCount}
                          </div>
                        </div>

                        <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 block mb-1">
                            Unpaid Bills
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-red-600">
                            Rs. {selectedCounterData.unpaidAmount.toLocaleString()}
                          </div>
                          <div className="mt-1 text-[10px] text-stone-500 font-bold">
                            {selectedCounterData.unpaidOrdersCount} Pending Bills
                          </div>
                        </div>
                      </div>

                      {/* Counter Cashier & Waiter Station Staff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Cashiers in Charge */}
                        <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>In-Charge Cashier(s)</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenAssignCashiersModal(
                                  selectedCounterData.counterName,
                                  selectedCounterData.cashiers
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                            >
                              Assign Cashiers
                            </button>
                          </div>

                          {selectedCounterData.cashiers.length === 0 ? (
                            <p className="text-xs text-stone-400 py-3 text-center">
                              No cashiers assigned to this station yet.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedCounterData.cashiers.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                                      {c.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-stone-900">{c.name}</span>
                                      <span className="text-[10px] text-stone-400 ml-1.5">@{c.email}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    In-Charge
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned Waiters */}
                        <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-600" />
                              <span>Assigned Floor Waiters</span>
                            </h4>
                            <span className="text-[10px] text-stone-400 font-bold">
                              {selectedCounterData.waiters.length} Waiters
                            </span>
                          </div>

                          {selectedCounterData.waiters.length === 0 ? (
                            <p className="text-xs text-stone-400 py-3 text-center">
                              No dedicated waiters assigned. Roaming waiters serve this station.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedCounterData.waiters.map((w) => (
                                <div
                                  key={w.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                                      {w.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-stone-900">{w.name}</span>
                                      <span className="text-[10px] text-stone-400 ml-1.5">@{w.email}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                    Assigned Waiter
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF & DEVICE TERMINAL MANAGEMENT */}
          {activeTab === "staff" && (
            <div className="space-y-3.5">
              {/* Header Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200/80 p-3.5 rounded-xl shadow-2xs">
                <div>
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Staff Accounts & Multi-Terminal Control</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Manage multi-cashiers, link floor waiters, lock terminal IPs, and configure staff permissions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition text-stone-950 font-black text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Staff Account</span>
                </button>
              </div>

              {/* Role Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStaffRoleFilter("all");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    staffRoleFilter === "all"
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>All ({allStaffMembers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStaffRoleFilter("admin");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    staffRoleFilter === "admin"
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>Admins ({adminCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStaffRoleFilter("cashier");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    staffRoleFilter === "cashier"
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>Cashiers ({cashierCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStaffRoleFilter("kitchen");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    staffRoleFilter === "kitchen"
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>Kitchen ({kitchenCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStaffRoleFilter("waiter");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    staffRoleFilter === "waiter"
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <span>Waiters ({waiterCount})</span>
                </button>
              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStaff.map((member: any) => {
                  const isVisible = visiblePasswords[member.id] || false;
                  const roleBadge =
                    member.role === "admin"
                      ? { bg: "bg-amber-50 text-amber-900 border-amber-200", label: "Admin" }
                      : member.role === "cashier"
                      ? { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Cashier" }
                      : member.role === "kitchen"
                      ? { bg: "bg-blue-50 text-blue-800 border-blue-200", label: "Kitchen" }
                      : { bg: "bg-purple-50 text-purple-800 border-purple-200", label: "Waiter" };

                  const perms = member.permissionsList || [];

                  return (
                    <div
                      key={member.id}
                      className={`bg-white border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between space-y-3 transition ${
                        member.isActive ? "border-stone-200/80 hover:border-stone-300" : "border-red-200 opacity-75"
                      }`}
                    >
                      {/* Top Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-black text-sm text-stone-900 truncate">{member.name}</h4>
                              {!member.isActive && (
                                <span className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1 py-0.2 rounded font-bold">
                                  Disabled
                                </span>
                              )}
                            </div>
                            {member.role === "kitchen" ? (
                              <p className="text-[10px] font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                                <ChefHat className="w-3 h-3 text-blue-600" />
                                <span>Dept: {member.stationName || "All Departments (Main Kitchen)"}</span>
                              </p>
                            ) : member.stationName ? (
                              <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                                <span>Station: {member.stationName}</span>
                              </p>
                            ) : null}
                            {member.role === "waiter" && member.assignedCashierName && (
                              <p className="text-[10px] font-bold text-purple-700 flex items-center gap-1 mt-0.5">
                                <span>Assigned: {member.assignedCashierName}</span>
                              </p>
                            )}
                            {member.role === "waiter" && !member.assignedCashierName && (
                              <p className="text-[10px] font-bold text-stone-400 flex items-center gap-1 mt-0.5">
                                <span>Roaming (All Stations)</span>
                              </p>
                            )}
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${roleBadge.bg}`}
                          >
                            {roleBadge.label}
                          </span>
                        </div>

                        {/* Password & Credentials View for Hotel Owner */}
                        <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 space-y-1 text-xs mt-2">
                          <div className="flex items-center justify-between text-stone-500 text-[11px]">
                            <span>PIN / Password:</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(member.id)}
                              className="flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
                            >
                              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isVisible ? "Hide" : "Show"}</span>
                            </button>
                          </div>
                          <div className="font-mono font-black text-xs text-stone-900 tracking-wider">
                            {isVisible ? member.password || "1234" : "••••••••"}
                          </div>
                        </div>

                        {/* Bound Device IP Info */}
                        <div className="mt-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200/70 space-y-0.5 text-xs">
                          <div className="flex items-center justify-between text-stone-500 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-stone-400" />
                              <span>Allowed IP:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setShowEditIpModal(member);
                                setEditIpValue(member.allowedIp || "");
                              }}
                              className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                            >
                              Edit IP
                            </button>
                          </div>
                          <div className="font-mono text-stone-800 font-bold text-[11px] truncate">
                            {member.role === "admin" ? (
                              <span className="text-emerald-700">Any Network</span>
                            ) : member.allowedIp ? (
                              <span className="text-stone-800">{member.allowedIp}</span>
                            ) : (
                              <span className="text-stone-400 italic">No IP set</span>
                            )}
                          </div>
                        </div>

                        {/* Permissions Summary Tags */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {perms.length > 0 ? (
                            perms.slice(0, 2).map((p: string) => {
                              const match = PERMISSION_OPTIONS.find((opt) => opt.id === p);
                              return (
                                <span
                                  key={p}
                                  className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium border border-stone-200"
                                >
                                  {match?.label || p}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[9px] text-stone-400 italic">Standard Access</span>
                          )}
                          {perms.length > 2 && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                              +{perms.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareCredentials(member)}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          title="Share credentials via WhatsApp or Clipboard"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer border border-stone-200"
                          title="Edit Staff Member"
                        >
                          <Edit2 className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>

                        {member.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(member.id, member.name)}
                            className="p-1.5 text-stone-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Remove Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* MODAL: ADD STAFF */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-stone-900 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Register New Staff Account</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Staff Full Name *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Aslam Khan"
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Username / Login ID *
                    </label>
                    <input
                      type="text"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. cashier2, waiter3"
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Password / PIN *
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. 1234 or pass123"
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Role Assignment *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => handleRoleChangeForAdd(e.target.value as any)}
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none"
                    >
                      <option value="cashier">Cashier (POS & Billing)</option>
                      <option value="waiter">Waiter (Floor Delivery)</option>
                      <option value="kitchen">Kitchen (KDS Queue)</option>
                      <option value="admin">Admin (Master Control)</option>
                    </select>
                  </div>
                </div>

                {/* Station & Counter Configuration / Kitchen Department Configuration */}
                {newRole === "kitchen" ? (
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                        <span>Assigned Kitchen Department (شعبہ کچن)</span>
                      </label>
                      <span className="text-[10px] text-blue-700 font-bold">Live Departments</span>
                    </div>
                    <select
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      className="w-full h-11 bg-white border border-blue-200 rounded-xl px-3 text-sm text-stone-900 focus:border-blue-500 outline-none font-bold"
                    >
                      <option value="All Departments (Main Kitchen)">
                        All Departments (Main Kitchen) - سارے شعبہ جات
                      </option>
                      {(departmentsQuery.data || []).map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} Section ({d.name === "Tea" ? "چائے سیکشن" : d.name === "Parathas" ? "پراٹھا و تندور" : d.name === "Drinks" ? "مشروبات" : "سنیکس / کچن"})
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-1.5">
                      {["All Departments (Main Kitchen)", ...((departmentsQuery.data || []).map((d) => d.name))].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNewStation(preset)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition font-bold cursor-pointer ${
                              newStation === preset
                                ? "bg-blue-600 text-white border-blue-700 shadow-2xs"
                                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500">
                      Kitchen staff assigned to a specific department only receive orders containing those items (e.g. Chai section only sees tea orders).
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Station / Counter Name
                      </label>
                      <span className="text-[10px] text-stone-500">Quick Presets:</span>
                    </div>
                    <input
                      type="text"
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      placeholder="e.g. Counter 1, Counter 2, Takeaway Desk, Dining Floor A"
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {["Counter 1", "Counter 2", "Counter 3", "Takeaway Desk"].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNewStation(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition font-bold cursor-pointer ${
                              newStation === preset
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Waiter Specific Assigned Cashier Selector */}
                {newRole === "waiter" && (
                  <div>
                    <label className="text-xs font-bold text-purple-700 block mb-1">
                      Assign to Cashier / Counter Station
                    </label>
                    <select
                      value={newAssignedCashierId || ""}
                      onChange={(e) =>
                        setNewAssignedCashierId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-purple-500 outline-none"
                    >
                      <option value="">All Counters / Roaming Waiter (کوئی بھی کاؤنٹر)</option>
                      {allCashiers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.stationName || `Counter #${c.id}`})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-stone-500 mt-1">
                      In segregated mode, this waiter will only see food ready to serve for their assigned cashier.
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Bound Device IP Address (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewAllowedIp(clientIp || "127.0.0.1")}
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Use Current Device IP ({clientIp})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newAllowedIp}
                    onChange={(e) => setNewAllowedIp(e.target.value)}
                    placeholder="e.g. 192.168.1.105 (leave blank for unrestricted)"
                    className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                  />
                </div>

                {/* Dynamic Permissions Checkboxes */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <label className="text-xs font-black text-amber-800 block">
                    Dynamic Staff Permissions (اختیارات)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = newPermissions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer hover:text-stone-900"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewPermissions((prev) => [...prev, opt.id]);
                              } else {
                                setNewPermissions((prev) => prev.filter((p) => p !== opt.id));
                              }
                            }}
                            className="mt-0.5 rounded accent-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-stone-900 leading-tight">{opt.label}</div>
                            <div className="text-[10px] text-stone-500">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-700 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">
                    {formError}
                  </p>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-11 bg-stone-100 hover:bg-stone-200 text-xs font-bold rounded-xl text-stone-700 cursor-pointer border border-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStaffMut.isPending}
                    className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {createStaffMut.isPending ? "Creating…" : "Save Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT STAFF (NAME, ROLE, PASS, IP, PERMISSIONS, COUNTER, ASSIGNED CASHIER) */}
        {editingStaff && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-stone-900 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                  <span>Edit Staff Account: {editingStaff.name}</span>
                </h3>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStaff} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Staff Name *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Username / Login ID *
                    </label>
                    <input
                      type="text"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Password / PIN
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave unchanged or type new"
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Role Assignment *
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none"
                    >
                      <option value="cashier">Cashier (POS & Billing)</option>
                      <option value="waiter">Waiter (Floor Delivery)</option>
                      <option value="kitchen">Kitchen (KDS Queue)</option>
                      <option value="admin">Admin (Full Master)</option>
                    </select>
                  </div>
                </div>

                {/* Edit Station / Kitchen Department Configuration */}
                {editRole === "kitchen" ? (
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                        <span>Assigned Kitchen Department (شعبہ کچن)</span>
                      </label>
                      <span className="text-[10px] text-blue-700 font-bold">Live Departments</span>
                    </div>
                    <select
                      value={editStation}
                      onChange={(e) => setEditStation(e.target.value)}
                      className="w-full h-11 bg-white border border-blue-200 rounded-xl px-3 text-sm text-stone-900 focus:border-blue-500 outline-none font-bold"
                    >
                      <option value="All Departments (Main Kitchen)">
                        All Departments (Main Kitchen) - سارے شعبہ جات
                      </option>
                      {(departmentsQuery.data || []).map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} Section ({d.name === "Tea" ? "چائے سیکشن" : d.name === "Parathas" ? "پراٹھا و تندور" : d.name === "Drinks" ? "مشروبات" : "سنیکس / کچن"})
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-1.5">
                      {["All Departments (Main Kitchen)", ...((departmentsQuery.data || []).map((d) => d.name))].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditStation(preset)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition font-bold cursor-pointer ${
                              editStation === preset
                                ? "bg-blue-600 text-white border-blue-700 shadow-2xs"
                                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Station / Counter Name
                      </label>
                      <span className="text-[10px] text-stone-500">Quick Presets:</span>
                    </div>
                    <input
                      type="text"
                      value={editStation}
                      onChange={(e) => setEditStation(e.target.value)}
                      placeholder="e.g. Counter 1, Counter 2, Takeaway Counter, Floor Section"
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {["Counter 1", "Counter 2", "Counter 3", "Takeaway Counter"].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditStation(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition font-bold cursor-pointer ${
                              editStation === preset
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Waiter Edit: Assigned Cashier */}
                {editRole === "waiter" && (
                  <div>
                    <label className="text-xs font-bold text-purple-700 block mb-1">
                      Assign to Cashier / Counter Station
                    </label>
                    <select
                      value={editAssignedCashierId || ""}
                      onChange={(e) =>
                        setEditAssignedCashierId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-purple-500 outline-none"
                    >
                      <option value="">All Counters / Roaming Waiter (کوئی بھی کاؤنٹر)</option>
                      {allCashiers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.stationName || `Counter #${c.id}`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Bound Device IP Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditAllowedIp(clientIp || "127.0.0.1")}
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Set to Current Device ({clientIp})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editAllowedIp}
                    onChange={(e) => setEditAllowedIp(e.target.value)}
                    placeholder="e.g. 192.168.1.105 (leave blank to unlock)"
                    className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                  />
                </div>

                {/* Account Status Switch */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <div className="text-xs font-bold text-stone-900">Account Status</div>
                    <div className="text-[10px] text-stone-500">
                      {editIsActive ? "Active & can log in" : "Disabled / Frozen"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      editIsActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {editIsActive ? "Active" : "Disabled"}
                  </button>
                </div>

                {/* Dynamic Permissions Grid */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-800">
                      Dynamic Permissions (اختیارات)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditPermissions(DEFAULT_ROLE_PERMS[editRole] || [])}
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Reset to Role Preset
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = editPermissions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer hover:text-stone-900"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditPermissions((prev) => [...prev, opt.id]);
                              } else {
                                setEditPermissions((prev) => prev.filter((p) => p !== opt.id));
                              }
                            }}
                            className="mt-0.5 rounded accent-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-stone-900 leading-tight">{opt.label}</div>
                            <div className="text-[10px] text-stone-500">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {editFormError && (
                  <p className="text-xs text-red-700 font-bold text-center bg-red-50 p-2 rounded-lg border border-red-200">
                    {editFormError}
                  </p>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="flex-1 h-11 bg-stone-100 hover:bg-stone-200 text-xs font-bold rounded-xl text-stone-700 cursor-pointer border border-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStaffMut.isPending}
                    className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {updateStaffMut.isPending ? "Saving Changes…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: QUICK EDIT DEVICE IP */}
        {showEditIpModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-stone-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  <span>Update Bound Device IP</span>
                </h3>
                <button
                  onClick={() => setShowEditIpModal(null)}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-500">
                Updating device IP for <span className="text-stone-900 font-bold">{showEditIpModal.name}</span>.
              </p>

              <form onSubmit={handleUpdateIp} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Terminal IP Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIpValue(clientIp || "127.0.0.1")}
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Set to Current Device ({clientIp})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editIpValue}
                    onChange={(e) => setEditIpValue(e.target.value)}
                    placeholder="e.g. 192.168.1.105 (leave blank to unlock)"
                    className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-900 focus:border-amber-500 outline-none font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditIpModal(null)}
                    className="flex-1 h-11 bg-stone-100 hover:bg-stone-200 text-xs font-bold rounded-xl text-stone-700 cursor-pointer border border-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStaffMut.isPending}
                    className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {updateStaffMut.isPending ? "Saving…" : "Update IP"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGN IN-CHARGE CASHIERS FOR A COUNTER */}
        {showAssignCashiersModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-stone-900">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Assign Cashiers for {showAssignCashiersModal}</span>
                </h3>
                <button
                  onClick={() => setShowAssignCashiersModal(null)}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-500">
                Select one or multiple cashiers to put in charge of{" "}
                <strong className="text-stone-900">{showAssignCashiersModal}</strong>. Cashiers selected here will process orders and billing for this counter.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {allCashiers.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    No cashier accounts found in the hotel. Add cashier accounts in Staff Management first.
                  </p>
                ) : (
                  allCashiers.map((c) => {
                    const isSelected = selectedCounterCashierIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition select-none ${
                          isSelected
                            ? "bg-amber-50 border-amber-400 text-stone-900 shadow-2xs"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCounterCashierIds((prev) => [...prev, c.id]);
                              } else {
                                setSelectedCounterCashierIds((prev) =>
                                  prev.filter((id) => id !== c.id)
                                );
                              }
                            }}
                            className="rounded accent-amber-500 cursor-pointer w-4 h-4"
                          />
                          <div>
                            <span className="font-bold text-xs block text-stone-900">{c.name}</span>
                            <span className="text-[11px] text-stone-500 font-mono">@{c.email}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 block font-medium">
                            {c.stationName ? `Station: ${c.stationName}` : "Unassigned"}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              c.isActive ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {c.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignCashiersModal(null)}
                  className="flex-1 h-11 bg-stone-100 hover:bg-stone-200 text-xs font-bold rounded-xl text-stone-700 cursor-pointer border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignCounterCashiersMut.isPending}
                  onClick={handleSaveCounterCashiers}
                  className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {assignCounterCashiersMut.isPending ? "Saving…" : "Save Assignments"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffAuthGuard>
  );
}

export default AdminDashboardView;
