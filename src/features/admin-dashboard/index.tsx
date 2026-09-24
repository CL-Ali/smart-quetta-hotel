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
  User,
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

  const allCashiers = (staffQuery.data || []).filter((s) => s.role === "cashier" || s.role === "admin");

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
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC] flex flex-col select-none">
        {/* Top Navigation Header (Floating Pill / Squircle Card) */}
        <header className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] border-0 shadow-none px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 gap-3 sticky top-3 z-30 mx-3 sm:mx-4 my-2">
          {/* Left: Brand + Context */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#D98A3C] text-white flex items-center justify-center font-black shrink-0">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white leading-none truncate">
                {t.hotelName || "Smart Quetta Hotel"}
              </h1>
              <p className="text-[10px] text-[#D98A3C] font-extrabold uppercase tracking-widest mt-1 truncate">
                Admin Master Portal & Multi-Terminal Control
              </p>
            </div>
          </div>

          {/* Center: Centered Tab Navigation Pill */}
          <div className="flex-1 flex justify-center items-center px-2 min-w-0">
            <div className="flex items-center gap-1.5 bg-[#F4EFEA] dark:bg-[#1A2234] p-1.5 rounded-full overflow-x-auto no-scrollbar max-w-full">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("accounts");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "accounts"
                    ? "bg-[#D98A3C] text-white shadow-none"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Accounts & Ledger</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "accounts" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
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
                className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "staff"
                    ? "bg-[#D98A3C] text-white shadow-none"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff & Dynamic Access</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "staff" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
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

            <div className="hidden md:flex items-center gap-2 bg-[#F4EFEA] dark:bg-[#1A2234] px-3.5 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#24180A] dark:text-stone-200">{staff?.name}</span>
              <span className="text-[10px] font-extrabold text-[#D98A3C] uppercase bg-amber-500/15 px-2 py-0.5 rounded-full">
                Master Admin
              </span>
            </div>

            <LangSwitcher />

            <button
              type="button"
              onClick={() => logout()}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-4">
          {/* Streamlined Operation Mode Floating Bar */}
          <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[26px] p-4 flex items-center justify-between gap-3 text-xs border-0 shadow-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-stone-500 dark:text-stone-400 hidden sm:inline">Operation Mode:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                  operationMode === "segregated"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    operationMode === "segregated" ? "bg-purple-600" : "bg-[#D98A3C]"
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
              className="px-4 py-2 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-amber-100 dark:hover:bg-stone-800 active:scale-[0.98] transition text-stone-800 dark:text-stone-200 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-[#D98A3C]" />
              <span>
                {operationMode === "segregated" ? "Switch to Unified" : "Switch to Pods"}
              </span>
            </button>
          </div>

          {/* TAB 1: TOTAL ACCOUNTS & COUNTER SUB-TABS */}
          {activeTab === "accounts" && (
            <div className="space-y-4">
              {/* Counter Sub-Tabs Selector Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCounterTab("all");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer border-0 shadow-none ${
                    selectedCounterTab === "all"
                      ? "bg-[#D98A3C] text-white font-black"
                      : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>All Counters</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedCounterTab === "all"
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
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
                    className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer border-0 shadow-none ${
                      selectedCounterTab === cnt.counterName
                        ? "bg-[#24180A] dark:bg-stone-800 text-white font-black"
                        : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-[#D98A3C]" />
                    <span>{cnt.counterName}</span>
                    <span className="text-[10px] font-mono opacity-70">
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
                  {/* Financial Floating KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Today Revenue */}
                    <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none transition hover:scale-[1.01]">
                      <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Today&apos;s Revenue
                        </span>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#24180A] dark:text-white font-mono">
                        Rs. {(financials?.todayRevenue || 0).toLocaleString()}
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Cash: Rs. {financials?.todayCash || 0}</span>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-extrabold">Bank: Rs. {financials?.todayBank || 0}</span>
                      </div>
                    </div>

                    {/* All-Time Total Revenue */}
                    <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none transition hover:scale-[1.01]">
                      <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Total All-Time
                        </span>
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-[#D98A3C] flex items-center justify-center">
                          <Wallet className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#D98A3C] font-mono">
                        Rs. {(financials?.totalRevenue || 0).toLocaleString()}
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                        <span>Cash: Rs. {financials?.totalCash || 0}</span>
                        <span>•</span>
                        <span>Bank: Rs. {financials?.totalBank || 0}</span>
                      </div>
                    </div>

                    {/* Total Khata Receivables */}
                    <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none transition hover:scale-[1.01]">
                      <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Khata Receivables
                        </span>
                        <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 font-mono">
                        Rs. {(financials?.totalKhataReceivable || 0).toLocaleString()}
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                        <span>{shopkeepers.length} Market Shopkeepers</span>
                      </div>
                    </div>

                    {/* Unpaid Orders Amount */}
                    <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none transition hover:scale-[1.01]">
                      <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                          Pending Unpaid
                        </span>
                        <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 font-mono">
                        Rs. {(financials?.unpaidOrdersAmount || 0).toLocaleString()}
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                        <span>{financials?.unpaidOrdersCount || 0} Active Unpaid Bills</span>
                      </div>
                    </div>
                  </div>

                  {/* Counter Stations Summary Cards Grid */}
                  <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#24180A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#D98A3C]" />
                        <span>Counter Stations Summary</span>
                      </h3>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">
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
                          className="bg-[#F8F3EC] dark:bg-[#182030] hover:bg-[#F4EFEA] dark:hover:bg-[#1E283C] rounded-[22px] p-4 transition cursor-pointer flex flex-col justify-between space-y-3 border-0 shadow-none"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-black text-[#24180A] dark:text-white flex items-center gap-1.5">
                                <span>{cnt.counterName}</span>
                              </h4>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                {cnt.cashiers.length > 0
                                  ? `Cashier: ${cnt.cashiers.map((c) => c.name).join(", ")}`
                                  : "No dedicated cashier"}
                              </p>
                            </div>
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/40 dark:border-stone-700/40 text-xs">
                            <div>
                              <span className="text-[10px] text-stone-400 block font-semibold">Today</span>
                              <span className="font-mono font-black text-[#D98A3C] text-sm">
                                Rs. {cnt.todayRevenue.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 block font-semibold">Orders</span>
                              <span className="font-mono font-black text-[#24180A] dark:text-white text-sm">
                                {cnt.activeOrdersCount}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-200/40 dark:border-stone-700/40">
                            <span>Waiters: {cnt.waiters.length}</span>
                            <span className="text-[#D98A3C] font-bold flex items-center gap-1">
                              <span>Details</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shopkeepers Khata Ledger */}
                  <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#D98A3C]" />
                        <h3 className="text-xs font-black text-[#24180A] dark:text-white uppercase tracking-wider">
                          Market Shopkeepers & Khata Balances (دکاندار کھاتہ)
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                        Total Due: <span className="font-mono font-black text-orange-600 dark:text-orange-400">Rs. {(financials?.totalKhataReceivable || 0).toLocaleString()}</span>
                      </span>
                    </div>

                    {shopkeepers.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6">
                        No registered market shopkeepers yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl bg-[#F8F3EC] dark:bg-[#182030] p-1">
                        <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                          <thead className="text-stone-400 uppercase font-extrabold text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Shop Name</th>
                              <th className="py-2.5 px-3">Owner Name</th>
                              <th className="py-2.5 px-3">Shop # / Phone</th>
                              <th className="py-2.5 px-3 text-right">Balance Due</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-200/50 dark:divide-stone-700/50 font-medium">
                            {shopkeepers.map((s: any) => (
                              <tr key={s.id} className="hover:bg-white/60 dark:hover:bg-stone-700/40 transition">
                                <td className="py-2.5 px-3 font-bold text-[#24180A] dark:text-white">
                                  <span>{s.shopName}</span>
                                </td>
                                <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300">{s.name}</td>
                                <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400">
                                  {s.shopNumber ? `Shop #${s.shopNumber}` : ""} {s.phone || ""}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-xs">
                                  {s.balance > 0 ? (
                                    <span className="text-orange-600 dark:text-orange-400">Rs. {s.balance}</span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400">Clear (Rs. 0)</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      s.balance > 0
                                        ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300"
                                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
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
                <div className="space-y-4">
                  {selectedCounterData && (
                    <>
                      {/* Counter Specific Financial Floating Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-stone-400 block mb-1 truncate">
                            {selectedCounterData.counterName} — Today
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-[#D98A3C] font-mono">
                            Rs. {selectedCounterData.todayRevenue.toLocaleString()}
                          </div>
                          <div className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                            <span>Cash: Rs. {selectedCounterData.todayCash}</span>
                            <span>•</span>
                            <span>Bank: Rs. {selectedCounterData.todayBank}</span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-stone-400 block mb-1">
                            All-Time Sales
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-[#24180A] dark:text-white font-mono">
                            Rs. {selectedCounterData.totalRevenue.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-stone-400 block mb-1">
                            Active Orders
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {selectedCounterData.activeOrdersCount}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none">
                          <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-stone-400 block mb-1">
                            Unpaid Bills
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 font-mono">
                            Rs. {selectedCounterData.unpaidAmount.toLocaleString()}
                          </div>
                          <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 font-bold">
                            {selectedCounterData.unpaidOrdersCount} Pending Bills
                          </div>
                        </div>
                      </div>

                      {/* Counter Cashier & Waiter Station Staff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cashiers in Charge */}
                        <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-[#24180A] dark:text-white uppercase tracking-wide flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-emerald-600" />
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
                              className="px-3 py-1.5 text-xs font-bold text-[#D98A3C] bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-full transition cursor-pointer"
                            >
                              Assign Cashiers
                            </button>
                          </div>

                          {selectedCounterData.cashiers.length === 0 ? (
                            <p className="text-xs text-stone-400 py-4 text-center">
                              No cashiers assigned to this station yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {selectedCounterData.cashiers.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F3EC] dark:bg-[#182030] text-xs border-0"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
                                      {c.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-[#24180A] dark:text-white">{c.name}</span>
                                      <span className="text-[11px] text-stone-400 ml-1.5 font-mono">@{c.email}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                                    In-Charge
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned Waiters */}
                        <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-[#24180A] dark:text-white uppercase tracking-wide flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span>Assigned Floor Waiters</span>
                            </h4>
                            <span className="text-[11px] text-stone-400 font-bold">
                              {selectedCounterData.waiters.length} Waiters
                            </span>
                          </div>

                          {selectedCounterData.waiters.length === 0 ? (
                            <p className="text-xs text-stone-400 py-4 text-center">
                              No dedicated waiters assigned. Roaming waiters serve this station.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {selectedCounterData.waiters.map((w) => (
                                <div
                                  key={w.id}
                                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F3EC] dark:bg-[#182030] text-xs border-0"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center justify-center font-black text-xs">
                                      {w.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-[#24180A] dark:text-white">{w.name}</span>
                                      <span className="text-[11px] text-stone-400 ml-1.5 font-mono">@{w.email}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
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
            <div className="space-y-4">
              {/* Header Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121824] p-5 rounded-[26px] border-0 shadow-none">
                <div>
                  <h3 className="text-sm font-black text-[#24180A] dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D98A3C]" />
                    <span>Staff Accounts & Multi-Terminal Control</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Manage multi-cashiers, link floor waiters, lock terminal IPs, and configure staff permissions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-5 py-2.5 bg-[#D98A3C] hover:bg-[#c27931] active:scale-[0.98] transition text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Staff Account</span>
                </button>
              </div>

              {/* Role Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStaffRoleFilter("all");
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-none ${
                    staffRoleFilter === "all"
                      ? "bg-[#D98A3C] text-white font-black"
                      : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-none ${
                    staffRoleFilter === "admin"
                      ? "bg-[#D98A3C] text-white font-black"
                      : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-none ${
                    staffRoleFilter === "cashier"
                      ? "bg-[#D98A3C] text-white font-black"
                      : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-none ${
                    staffRoleFilter === "kitchen"
                      ? "bg-[#D98A3C] text-white font-black"
                      : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-none ${
                    staffRoleFilter === "waiter"
                      ? "bg-[#D98A3C] text-white font-black"
                      : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <span>Waiters ({waiterCount})</span>
                </button>
              </div>

              {/* Staff Floating Squircle Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredStaff.map((member: any) => {
                  const isVisible = visiblePasswords[member.id] || false;
                  const roleBadge =
                    member.role === "admin"
                      ? { bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300", label: "Admin" }
                      : member.role === "cashier"
                      ? { bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300", label: "Cashier" }
                      : member.role === "kitchen"
                      ? { bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300", label: "Kitchen" }
                      : { bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300", label: "Waiter" };

                  const perms = member.permissionsList || [];

                  return (
                    <div
                      key={member.id}
                      className={`bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none flex flex-col justify-between space-y-4 transition hover:scale-[1.01] ${
                        member.isActive ? "" : "opacity-75"
                      }`}
                    >
                      {/* Top Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-sm text-[#24180A] dark:text-white truncate">{member.name}</h4>
                              {!member.isActive && (
                                <span className="text-[9px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold">
                                  Disabled
                                </span>
                              )}
                            </div>
                            {member.role === "kitchen" ? (
                              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                <ChefHat className="w-3 h-3 text-blue-600" />
                                <span>Dept: {member.stationName || "All Departments (Main Kitchen)"}</span>
                              </p>
                            ) : member.stationName ? (
                              <p className="text-[11px] font-bold text-[#D98A3C] flex items-center gap-1 mt-0.5">
                                <span>Station: {member.stationName}</span>
                              </p>
                            ) : null}
                            {member.role === "waiter" && member.assignedCashierName && (
                              <p className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                                <span>Assigned: {member.assignedCashierName}</span>
                              </p>
                            )}
                            {member.role === "waiter" && !member.assignedCashierName && (
                              <p className="text-[11px] font-bold text-stone-400 flex items-center gap-1 mt-0.5">
                                <span>Roaming (All Stations)</span>
                              </p>
                            )}
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${roleBadge.bg}`}
                          >
                            {roleBadge.label}
                          </span>
                        </div>

                        {/* Password & Credentials View for Hotel Owner */}
                        <div className="bg-[#F8F3EC] dark:bg-[#182030] p-3 rounded-2xl space-y-1 text-xs mt-3">
                          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-[11px]">
                            <span>PIN / Password:</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(member.id)}
                              className="flex items-center gap-1 text-[10px] text-[#D98A3C] font-bold cursor-pointer"
                            >
                              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isVisible ? "Hide" : "Show"}</span>
                            </button>
                          </div>
                          <div className="font-mono font-black text-xs text-[#24180A] dark:text-white tracking-wider">
                            {isVisible ? member.password || "1234" : "••••••••"}
                          </div>
                        </div>

                        {/* Bound Device IP Info */}
                        <div className="mt-2.5 p-3 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl space-y-0.5 text-xs">
                          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-[11px]">
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
                              className="text-[10px] text-[#D98A3C] hover:underline font-bold cursor-pointer"
                            >
                              Edit IP
                            </button>
                          </div>
                          <div className="font-mono text-[#24180A] dark:text-white font-bold text-[11px] truncate">
                            {member.role === "admin" ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Any Network</span>
                            ) : member.allowedIp ? (
                              <span>{member.allowedIp}</span>
                            ) : (
                              <span className="text-stone-400 italic">No IP set</span>
                            )}
                          </div>
                        </div>

                        {/* Permissions Summary Tags */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {perms.length > 0 ? (
                            perms.slice(0, 2).map((p: string) => {
                              const match = PERMISSION_OPTIONS.find((opt) => opt.id === p);
                              return (
                                <span
                                  key={p}
                                  className="text-[10px] bg-[#F4EFEA] dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2.5 py-0.5 rounded-full font-medium"
                                >
                                  {match?.label || p}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">Standard Access</span>
                          )}
                          {perms.length > 2 && (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-[#D98A3C] px-2 py-0.5 rounded-full font-bold">
                              +{perms.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleShareCredentials(member)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition text-white text-xs font-bold rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Share credentials via WhatsApp or Clipboard"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="py-2 px-3.5 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-amber-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-full flex items-center gap-1.5 transition cursor-pointer"
                          title="Edit Staff Member"
                        >
                          <Edit2 className="w-3 h-3 text-[#D98A3C]" />
                          <span>Edit</span>
                        </button>

                        {member.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(member.id, member.name)}
                            className="p-2 text-stone-400 hover:text-red-600 transition rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
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
            <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-[#24180A] dark:text-white my-8 max-h-[90vh] overflow-y-auto border-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#24180A] dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D98A3C]" />
                  <span>Register New Staff Account</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Staff Full Name *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Aslam Khan"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Username / Login ID *
                    </label>
                    <input
                      type="text"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. cashier2, waiter3"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Password / PIN *
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. 1234 or pass123"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Role Assignment *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => handleRoleChangeForAdd(e.target.value as any)}
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
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
                  <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                        <span>Assigned Kitchen Department (شعبہ کچن)</span>
                      </label>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">Live Departments</span>
                    </div>
                    <select
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white outline-none font-bold border-0"
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
                            className={`text-[10px] px-3 py-1 rounded-full transition font-bold cursor-pointer border-0 ${
                              newStation === preset
                                ? "bg-blue-600 text-white shadow-none"
                                : "bg-white dark:bg-[#121824] text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                            }`}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                      Kitchen staff assigned to a specific department only receive orders containing those items (e.g. Chai section only sees tea orders).
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                        Station / Counter Name
                      </label>
                      <span className="text-[10px] text-stone-500">Quick Presets:</span>
                    </div>
                    <input
                      type="text"
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      placeholder="e.g. Counter 1, Counter 2, Takeaway Desk, Dining Floor A"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Counter 1", "Counter 2", "Counter 3", "Takeaway Desk"].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNewStation(preset)}
                            className={`text-[10px] px-3 py-1 rounded-full transition font-bold cursor-pointer border-0 ${
                              newStation === preset
                                ? "bg-amber-100 dark:bg-amber-950/60 text-[#D98A3C]"
                                : "bg-[#F8F3EC] dark:bg-[#182030] text-stone-600 dark:text-stone-300 hover:bg-stone-200/60"
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
                    <label className="text-xs font-bold text-purple-700 dark:text-purple-300 block mb-1">
                      Assign to Cashier / Counter Station
                    </label>
                    <select
                      value={newAssignedCashierId || ""}
                      onChange={(e) =>
                        setNewAssignedCashierId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-purple-500/30 outline-none border-0 font-bold"
                    >
                      <option value="">All Counters / Roaming Waiter (کوئی بھی کاؤنٹر)</option>
                      {allCashiers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.stationName || `Counter #${c.id}`})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                      In segregated mode, this waiter will only see food ready to serve for their assigned cashier.
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                      Bound Device IP Address (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewAllowedIp(clientIp || "127.0.0.1")}
                      className="text-[10px] text-[#D98A3C] hover:underline font-bold cursor-pointer"
                    >
                      Use Current Device IP ({clientIp})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newAllowedIp}
                    onChange={(e) => setNewAllowedIp(e.target.value)}
                    placeholder="e.g. 192.168.1.105 (leave blank for unrestricted)"
                    className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                  />
                </div>

                {/* Dynamic Permissions Checkboxes */}
                <div className="p-4 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl space-y-2 border-0">
                  <label className="text-xs font-black text-[#D98A3C] block">
                    Dynamic Staff Permissions (اختیارات)
                  </label>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = newPermissions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer hover:text-[#24180A] dark:hover:text-white"
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
                            className="mt-0.5 rounded accent-[#D98A3C] cursor-pointer w-4 h-4"
                          />
                          <div>
                            <div className="font-bold text-[#24180A] dark:text-white leading-tight">{opt.label}</div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold text-center bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl">
                    {formError}
                  </p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-12 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold rounded-full text-stone-700 dark:text-stone-300 cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStaffMut.isPending}
                    className="flex-1 h-12 bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-bold rounded-full cursor-pointer shadow-none"
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
            <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-[#24180A] dark:text-white my-8 max-h-[90vh] overflow-y-auto border-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#24180A] dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#D98A3C]" />
                  <span>Edit Staff Account: {editingStaff.name}</span>
                </h3>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStaff} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Staff Name *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Username / Login ID *
                    </label>
                    <input
                      type="text"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Password / PIN
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave unchanged or type new"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Role Assignment *
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
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
                  <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                        <span>Assigned Kitchen Department (شعبہ کچن)</span>
                      </label>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">Live Departments</span>
                    </div>
                    <select
                      value={editStation}
                      onChange={(e) => setEditStation(e.target.value)}
                      className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white outline-none font-bold border-0"
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
                            className={`text-[10px] px-3 py-1 rounded-full transition font-bold cursor-pointer border-0 ${
                              editStation === preset
                                ? "bg-blue-600 text-white shadow-none"
                                : "bg-white dark:bg-[#121824] text-stone-700 dark:text-stone-300 hover:bg-stone-50"
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
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                        Station / Counter Name
                      </label>
                      <span className="text-[10px] text-stone-500">Quick Presets:</span>
                    </div>
                    <input
                      type="text"
                      value={editStation}
                      onChange={(e) => setEditStation(e.target.value)}
                      placeholder="e.g. Counter 1, Counter 2, Takeaway Counter, Floor Section"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-medium"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Counter 1", "Counter 2", "Counter 3", "Takeaway Counter"].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditStation(preset)}
                            className={`text-[10px] px-3 py-1 rounded-full transition font-bold cursor-pointer border-0 ${
                              editStation === preset
                                ? "bg-amber-100 dark:bg-amber-950/60 text-[#D98A3C]"
                                : "bg-[#F8F3EC] dark:bg-[#182030] text-stone-600 dark:text-stone-300 hover:bg-stone-200/60"
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
                    <label className="text-xs font-bold text-purple-700 dark:text-purple-300 block mb-1">
                      Assign to Cashier / Counter Station
                    </label>
                    <select
                      value={editAssignedCashierId || ""}
                      onChange={(e) =>
                        setEditAssignedCashierId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-purple-500/30 outline-none border-0 font-bold"
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
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                      Bound Device IP Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditAllowedIp(clientIp || "127.0.0.1")}
                      className="text-[10px] text-[#D98A3C] hover:underline font-bold cursor-pointer"
                    >
                      Set to Current Device ({clientIp})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editAllowedIp}
                    onChange={(e) => setEditAllowedIp(e.target.value)}
                    placeholder="e.g. 192.168.1.105 (leave blank to unlock)"
                    className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                  />
                </div>

                {/* Account Status Switch */}
                <div className="flex items-center justify-between p-4 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl border-0">
                  <div>
                    <div className="text-xs font-bold text-[#24180A] dark:text-white">Account Status</div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">
                      {editIsActive ? "Active & can log in" : "Disabled / Frozen"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive((prev) => !prev)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 ${
                      editIsActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {editIsActive ? "Active" : "Disabled"}
                  </button>
                </div>

                {/* Dynamic Permissions Grid */}
                <div className="p-4 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl space-y-2 border-0">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#D98A3C]">
                      Dynamic Permissions (اختیارات)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditPermissions(DEFAULT_ROLE_PERMS[editRole] || [])}
                      className="text-[10px] text-[#D98A3C] hover:underline font-bold cursor-pointer"
                    >
                      Reset to Role Preset
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = editPermissions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer hover:text-[#24180A] dark:hover:text-white"
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
                            className="mt-0.5 rounded accent-[#D98A3C] cursor-pointer w-4 h-4"
                          />
                          <div>
                            <div className="font-bold text-[#24180A] dark:text-white leading-tight">{opt.label}</div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {editFormError && (
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold text-center bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl">
                    {editFormError}
                  </p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="flex-1 h-12 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold rounded-full text-stone-700 dark:text-stone-300 cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStaffMut.isPending}
                    className="flex-1 h-12 bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-bold rounded-full cursor-pointer shadow-none"
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-[#24180A] dark:text-white border-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#24180A] dark:text-white leading-tight">
                      Update Bound IP
                    </h3>
                    <p className="text-[11px] text-[#D98A3C] font-extrabold mt-0.5">
                      Staff: {showEditIpModal.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditIpModal(null)}
                  className="w-9 h-9 rounded-full bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400">
                Updating terminal hardware IP lock for <span className="text-[#24180A] dark:text-white font-bold">{showEditIpModal.name}</span>.
              </p>

              <form onSubmit={handleUpdateIp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                      Terminal IP Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIpValue(clientIp || "127.0.0.1")}
                      className="text-[10px] text-[#D98A3C] hover:underline font-bold cursor-pointer"
                    >
                      Use Current Device ({clientIp})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editIpValue}
                    onChange={(e) => setEditIpValue(e.target.value)}
                    placeholder="e.g. 192.168.1.105 (leave blank to unlock)"
                    className="w-full h-11 bg-[#F4EFEA] dark:bg-[#1A2234] rounded-full px-4 text-xs font-bold text-[#24180A] dark:text-white focus:ring-2 focus:ring-[#D98A3C] outline-none border-0 font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditIpModal(null)}
                    className="flex-1 h-11 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold rounded-full text-stone-700 dark:text-stone-300 cursor-pointer border-0 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStaffMut.isPending}
                    className="flex-1 h-11 bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-black rounded-full cursor-pointer shadow-none transition flex items-center justify-center gap-2"
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
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setShowAssignCashiersModal(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 text-[#24180A] dark:text-white border-0 cursor-default animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center shrink-0 font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#24180A] dark:text-white leading-tight">
                      Assign Cashiers & Staff
                    </h3>
                    <p className="text-[11px] text-[#D98A3C] font-extrabold mt-0.5">
                      Counter: {showAssignCashiersModal}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignCashiersModal(null)}
                  className="w-9 h-9 rounded-full bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed shrink-0">
                Select one or multiple cashiers to put in charge of{" "}
                <strong className="text-[#24180A] dark:text-white font-bold">{showAssignCashiersModal}</strong>. Cashiers selected here will process orders and billing for this counter.
              </p>

              {/* Scrollable List with ample space */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[55vh]">
                {allCashiers.length === 0 ? (
                  <div className="text-xs text-stone-400 py-10 text-center bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl">
                    No cashier accounts found in the hotel. Add cashier accounts in Staff Management first.
                  </div>
                ) : (
                  allCashiers.map((c) => {
                    const isSelected = selectedCounterCashierIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          playTapSound();
                          if (isSelected) {
                            setSelectedCounterCashierIds((prev) => prev.filter((id) => id !== c.id));
                          } else {
                            setSelectedCounterCashierIds((prev) => [...prev, c.id]);
                          }
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all select-none border-0 ${
                          isSelected
                            ? "bg-[#D98A3C]/10 dark:bg-[#D98A3C]/15 ring-2 ring-[#D98A3C]"
                            : "bg-[#F8F3EC] dark:bg-[#1A2234] hover:bg-[#EAE4DC] dark:hover:bg-[#222C42]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Custom Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition shrink-0 ${
                              isSelected
                                ? "bg-[#D98A3C] text-white shadow-2xs"
                                : "bg-white dark:bg-[#121824] text-transparent border border-stone-300 dark:border-zinc-700"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          {/* Cashier Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-[#24180A] dark:text-white truncate">
                                {c.name}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-bold">
                                {c.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono block truncate mt-0.5">
                              @{c.email}
                            </span>
                          </div>
                        </div>

                        {/* Right Details */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5 ml-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#121824] text-stone-700 dark:text-stone-300 shadow-2xs">
                            {c.stationName ? `Station: ${c.stationName}` : "Unassigned"}
                          </span>
                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${
                              c.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-stone-400"}`} />
                            {c.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAssignCashiersModal(null)}
                  className="flex-1 h-11 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold rounded-full text-stone-700 dark:text-stone-300 cursor-pointer border-0 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignCounterCashiersMut.isPending}
                  onClick={handleSaveCounterCashiers}
                  className="flex-1 h-11 bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-black rounded-full cursor-pointer shadow-none transition flex items-center justify-center gap-2"
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
