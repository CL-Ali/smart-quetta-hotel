"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLang, LANG_OPTIONS, Lang } from "@/contexts/LangContext";
import { StaffHeaderBar } from "@/components/StaffHeaderBar";
import { StaffBottomNav } from "@/components/StaffBottomNav";
import { StaffDrawerSheet } from "@/components/StaffDrawerSheet";
import { StaffAuthGuard } from "@/components/StaffAuthGuard";
import { playTapSound, playOrderSuccessSound, unlockAudio } from "@/lib/sound";
import { ShiftSessionManager } from "./components/ShiftSessionManager";
import { SettingsTab } from "./components/SettingsTab";
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
  Globe,
  Store,
  Split,
  Maximize2,
  X,
  ChefHat,
  Utensils,
  User,
  LayoutGrid,
  Percent,
  BookOpen,
  Ban,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PERMISSION_OPTIONS = [
  {
    id: "can_access_pos",
    label: "POS Terminal Ordering Access",
    desc: "Open live touchscreen POS register, select dishes, and punch orders",
    icon: LayoutGrid,
    roles: ["admin", "cashier", "waiter", "kitchen"],
  },
  {
    id: "can_access_cashier",
    label: "Cashier Management Access",
    desc: "Manage customer orders, unpaid bills, guests, products, and inventory stock",
    icon: Store,
    roles: ["admin", "cashier", "waiter", "kitchen"],
  },
  {
    id: "can_access_kitchen",
    label: "Kitchen KDS Station Access",
    desc: "View live cooking queue and update food preparation status",
    icon: ChefHat,
    roles: ["admin", "cashier", "kitchen", "waiter"],
  },
  {
    id: "can_access_waiter",
    label: "Waiter Delivery Station Access",
    desc: "Serve ready food items and manage table delivery",
    icon: Utensils,
    roles: ["admin", "cashier", "kitchen", "waiter"],
  },
  {
    id: "can_access_admin",
    label: "Master Admin Dashboard Control",
    desc: "Access financial analytics, audit logs, and staff management",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    id: "can_discount",
    label: "Apply Discounts & Vouchers",
    desc: "Allow applying custom discounts & vouchers on checkout",
    icon: Percent,
    roles: ["admin", "cashier"],
  },
  {
    id: "can_settle_khata",
    label: "Settle Khata / Udhar Ledger",
    desc: "Collect payments & clear shopkeeper ledger balances",
    icon: BookOpen,
    roles: ["admin", "cashier"],
  },
  {
    id: "can_void_order",
    label: "Void / Cancel Placed Orders",
    desc: "Cancel active, unpaid or misplaced orders",
    icon: Ban,
    roles: ["admin", "cashier"],
  },
  {
    id: "can_view_reports",
    label: "Financial Analytics & Reports",
    desc: "View daily sales, total cash/bank breakdown & charts",
    icon: BarChart3,
    roles: ["admin", "cashier"],
  },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  admin: [
    "can_access_admin",
    "can_access_cashier",
    "can_access_pos",
    "can_access_kitchen",
    "can_access_waiter",
    "can_discount",
    "can_settle_khata",
    "can_void_order",
    "can_view_reports",
  ],
  cashier: [
    "can_access_cashier",
    "can_access_pos",
    "can_discount",
    "can_settle_khata",
  ],
  kitchen: ["can_access_kitchen"],
  waiter: ["can_access_waiter", "can_access_pos"],
};

export function AdminDashboardView() {
  const { staff, clientIp, logout, permissions } = useAuth();
  const { t, lang } = useLang();

  const [activeTab, setActiveTab] = useState<"accounts" | "staff" | "shift_session" | "settings">(
    permissions?.canViewReports !== false ? "accounts" : "staff"
  );

  useEffect(() => {
    if (permissions && !permissions.canViewReports && activeTab === "accounts") {
      setActiveTab("staff");
    }
  }, [permissions, activeTab]);
  const [selectedCounterTab, setSelectedCounterTab] = useState<string>("all");
  const [staffRoleFilter, setStaffRoleFilter] = useState<
    "all" | "admin" | "cashier" | "kitchen" | "waiter"
  >("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showEditIpModal, setShowEditIpModal] = useState<any | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form State for Add Staff
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "cashier" | "waiter" | "kitchen">("cashier");
  const [newStation, setNewStation] = useState("Counter 1");
  const [newAssignedCashierIds, setNewAssignedCashierIds] = useState<number[]>([]);
  const [newAllowedIp, setNewAllowedIp] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>(DEFAULT_ROLE_PERMS.cashier);
  const [formError, setFormError] = useState("");

  // Form State for Edit Staff
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "cashier" | "waiter" | "kitchen">("cashier");
  const [editStation, setEditStation] = useState("");
  const [editAssignedCashierIds, setEditAssignedCashierIds] = useState<number[]>([]);
  const [editAllowedIp, setEditAllowedIp] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editFormError, setEditFormError] = useState("");

  // Form state for Quick Edit IP
  const [editIpValue, setEditIpValue] = useState("");

  // State for Counter In-Charge Cashier Assignment Modal
  const [showAssignCashiersModal, setShowAssignCashiersModal] = useState<string | null>(null);
  const [selectedCounterCashierIds, setSelectedCounterCashierIds] = useState<number[]>([]);

  // State for Create / Edit Counter Modals
  const [showAddCounterModal, setShowAddCounterModal] = useState(false);
  const [newCounterName, setNewCounterName] = useState("");
  const [newCounterCode, setNewCounterCode] = useState("");
  const [newCounterDesc, setNewCounterDesc] = useState("");
  const [editingCounter, setEditingCounter] = useState<{
    id: number;
    name: string;
    code?: string | null;
    description?: string | null;
    isActive?: boolean;
  } | null>(null);

  // Language Control Modal State
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedAllowedLangs, setSelectedAllowedLangs] = useState<string[]>([]);
  const [selectedDefaultLang, setSelectedDefaultLang] = useState<string>("ur");

  // Queries
  const accountsQuery = trpc.admin.getAccountsOverview.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const staffQuery = trpc.admin.listStaff.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const countersQuery = trpc.admin.listCounters.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const departmentsQuery = trpc.hotel.getDepartments.useQuery();
  const systemConfigQuery = trpc.hotel.getSystemConfig.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Mutations
  const updateConfigMut = trpc.admin.updateSystemConfig.useMutation();
  const createStaffMut = trpc.admin.createStaff.useMutation();
  const updateStaffMut = trpc.admin.updateStaff.useMutation();
  const deleteStaffMut = trpc.admin.deleteStaff.useMutation();
  const assignCounterCashiersMut = trpc.admin.assignCounterCashiers.useMutation();
  const createCounterMut = trpc.admin.createCounter.useMutation();
  const updateCounterMut = trpc.admin.updateCounter.useMutation();
  const deleteCounterMut = trpc.admin.deleteCounter.useMutation();

  const handleOpenLanguageModal = () => {
    playTapSound();
    const allowed = (systemConfigQuery.data?.allowedLanguages as string[]) || ["ur", "en", "ps", "bal", "brh", "sd", "pa", "fa"];
    const def = (systemConfigQuery.data?.defaultLanguage as string) || "ur";
    setSelectedAllowedLangs(allowed);
    setSelectedDefaultLang(def);
    setShowLanguageModal(true);
  };

  const handleSaveLanguages = async () => {
    if (selectedAllowedLangs.length === 0) {
      toast.error(lang === "ur" ? "کم از کم ایک زبان فعال ہونی چاہیے" : "At least one language must be enabled");
      return;
    }
    try {
      playTapSound();
      await updateConfigMut.mutateAsync({
        allowedLanguages: selectedAllowedLangs,
        defaultLanguage: selectedDefaultLang,
      });
      playOrderSuccessSound();
      toast.success(
        lang === "ur"
          ? "زبانوں کی سیٹنگز کامیابی سے محفوظ ہو گئیں!"
          : "System language permissions saved successfully!"
      );
      setShowLanguageModal(false);
      systemConfigQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update language settings");
    }
  };

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

  const handleToggleCustomerQueue = async () => {
    const currentQueueState = (accountsQuery.data as any)?.showCustomerQueue ?? true;
    const nextState = !currentQueueState;
    playTapSound();
    try {
      await updateConfigMut.mutateAsync({ showCustomerQueue: nextState });
      playOrderSuccessSound();
      toast.success(
        nextState
          ? "Customer Live Kitchen Queue is now Visible!"
          : "Customer Live Kitchen Queue is now Hidden!"
      );
      accountsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update customer queue visibility");
    }
  };

  const soundEnabled = (accountsQuery.data as any)?.soundEnabled ?? (systemConfigQuery.data as any)?.soundEnabled ?? true;

  const handleToggleSound = async () => {
    const nextSound = !soundEnabled;
    playTapSound();
    try {
      await updateConfigMut.mutateAsync({ soundEnabled: nextSound });
      if (nextSound) {
        unlockAudio();
        playOrderSuccessSound();
      }
      toast.success(
        nextSound
          ? (lang === "ur" ? "تمام ڈیوائسز اور کسٹمرز کے لیے ساؤنڈ آن کر دی گئی ہے!" : "Global Sound Effects are now ENABLED across all devices!")
          : (lang === "ur" ? "تمام ڈیوائسز اور کسٹمرز کے لیے ساؤنڈ بند کر دی گئی ہے!" : "Global Sound Effects are now MUTED across all devices!")
      );
      accountsQuery.refetch();
      systemConfigQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update sound setting");
    }
  };

  const defaultPosAccess = (systemConfigQuery.data as any)?.defaultPosAccess !== false;

  const getRoleDefaultPerms = (role: string) => {
    const base = DEFAULT_ROLE_PERMS[role] || [];
    if (role === "admin") return base;
    if (!defaultPosAccess) {
      return base.filter((p) => p !== "can_access_pos");
    } else {
      if (["cashier", "waiter"].includes(role) && !base.includes("can_access_pos")) {
        return ["can_access_pos", ...base];
      }
      return base;
    }
  };

  const handleToggleDefaultPosAccess = async () => {
    const nextVal = !defaultPosAccess;
    playTapSound();
    try {
      await updateConfigMut.mutateAsync({ defaultPosAccess: nextVal });
      playOrderSuccessSound();
      toast.success(
        nextVal
          ? (lang === "ur"
            ? "نئے عملے کے لیے ڈیفالٹ POS رسائی آن کر دی گئی ہے!"
            : "Default POS access enabled for newly registered staff!")
          : (lang === "ur"
            ? "نئے عملے کے لیے ڈیفالٹ POS رسائی بند کر دی گئی ہے!"
            : "Default POS access disabled for newly registered staff!")
      );
      systemConfigQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update default POS setting");
    }
  };

  // Counter Management Handlers
  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) {
      toast.error(lang === "ur" ? "کاؤنٹر کا نام درج کریں" : "Please enter a counter name");
      return;
    }
    playTapSound();
    try {
      await createCounterMut.mutateAsync({
        name: newCounterName.trim(),
        code: newCounterCode.trim() || undefined,
        description: newCounterDesc.trim() || undefined,
      });
      playOrderSuccessSound();
      toast.success(
        lang === "ur"
          ? `نیا کاؤنٹر "${newCounterName}" کامیابی سے بنا دیا گیا!`
          : `Counter "${newCounterName}" created successfully!`
      );
      setShowAddCounterModal(false);
      setNewCounterName("");
      setNewCounterCode("");
      setNewCounterDesc("");
      countersQuery.refetch();
      accountsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create counter");
    }
  };

  const handleUpdateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounter || !editingCounter.name.trim()) return;
    playTapSound();
    try {
      await updateCounterMut.mutateAsync({
        id: editingCounter.id,
        name: editingCounter.name.trim(),
        code: editingCounter.code?.trim() || undefined,
        description: editingCounter.description?.trim() || undefined,
        isActive: editingCounter.isActive,
      });
      playOrderSuccessSound();
      toast.success(
        lang === "ur"
          ? "کاؤنٹر کی ترتیبات تبدیل ہو گئیں!"
          : "Counter updated successfully!"
      );
      setEditingCounter(null);
      countersQuery.refetch();
      accountsQuery.refetch();
      staffQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update counter");
    }
  };

  const handleDeleteCounter = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete counter "${name}"? Any staff attached to it will be detached.`)) return;
    playTapSound();
    try {
      await deleteCounterMut.mutateAsync({ id });
      playOrderSuccessSound();
      toast.success(
        lang === "ur"
          ? `کاؤنٹر "${name}" ختم کر دیا گیا!`
          : `Counter "${name}" deleted.`
      );
      countersQuery.refetch();
      accountsQuery.refetch();
      staffQuery.refetch();
      if (selectedCounterTab === name) setSelectedCounterTab("all");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete counter");
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
    setNewAssignedCashierIds([]);
    setNewAllowedIp("");
    setNewPermissions(getRoleDefaultPerms("cashier"));
    setFormError("");
    setShowAddModal(true);
  };

  const handleRoleChangeForAdd = (role: "admin" | "cashier" | "waiter" | "kitchen") => {
    setNewRole(role);
    setNewPermissions(getRoleDefaultPerms(role));
    if (role === "cashier") setNewStation(`Counter ${allCashiers.length + 1}`);
    else if (role === "kitchen") setNewStation("Main Kitchen KDS");
    else if (role === "waiter") {
      setNewStation("Floor Delivery");
      setNewAssignedCashierIds([]);
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
        assignedCashierIds: (newRole === "waiter" || newRole === "kitchen") ? newAssignedCashierIds : null,
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
    setEditAssignedCashierIds(
      member.assignedCashierIds && Array.isArray(member.assignedCashierIds)
        ? member.assignedCashierIds
        : []
    );
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
        assignedCashierIds: (editRole === "waiter" || editRole === "kitchen") ? editAssignedCashierIds : null,
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

    const text = `*Smart Hotel - Staff Login Credentials*
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
  const showCustomerQueue = (accountsQuery.data as any)?.showCustomerQueue ?? true;
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
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC] flex flex-col select-none pb-20 md:pb-4">
        {/* Top Unified Navigation Header */}
        <StaffHeaderBar
          current="admin"
          title={t.hotelName || "Smart Hotel"}
          subtitle={t.adminMasterPortal || (lang === "ur" ? "ایڈمن کنٹرول پینل" : "Admin Master Portal & Control")}
          icon={Hotel}
          onOpenDrawer={() => setDrawerOpen(true)}
          centerContent={
            <div className="inline-flex items-center bg-[#F4EFEA] dark:bg-[#1A2234] p-1 rounded-full overflow-x-auto no-scrollbar max-w-full border-0 shadow-none relative">
              {permissions?.canViewReports && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setActiveTab("accounts");
                  }}
                  className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                    activeTab === "accounts"
                      ? "text-white"
                      : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                  }`}
                >
                  {activeTab === "accounts" && (
                    <motion.div
                      layoutId="adminTabIndicator"
                      className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Wallet className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{t.accountsLedger || (lang === "ur" ? "کھاتہ و مالیات" : "Accounts & Ledger")}</span>
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "accounts" ? "bg-white/25 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                  }`}>
                    {countersBreakdown.length} {countersBreakdown.length === 1 ? (lang === "ur" ? "کاؤنٹر" : "Counter") : (lang === "ur" ? "کاؤنٹرز" : "Counters")}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("staff");
                }}
                className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                  activeTab === "staff"
                    ? "text-white"
                    : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                }`}
              >
                {activeTab === "staff" && (
                  <motion.div
                    layoutId="adminTabIndicator"
                    className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Users className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{t.staffAccess || (lang === "ur" ? "عملہ و رسائی کنٹرول" : "Staff & Dynamic Access")}</span>
                <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "staff" ? "bg-white/25 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}>
                  {allStaffMembers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("shift_session");
                }}
                className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                  activeTab === "shift_session"
                    ? "text-white"
                    : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                }`}
              >
                {activeTab === "shift_session" && (
                  <motion.div
                    layoutId="adminTabIndicator"
                    className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Layers className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{lang === "ur" ? "شفٹ و ڈے کلوز" : "Shift & Day Close"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("settings");
                }}
                className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                  activeTab === "settings"
                    ? "text-white"
                    : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                }`}
              >
                {activeTab === "settings" && (
                  <motion.div
                    layoutId="adminTabIndicator"
                    className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Settings className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{lang === "ur" ? "سیٹنگز" : "Settings"}</span>
              </button>
            </div>
          }
        />

        {/* Main Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto space-y-4">
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
                  <span>{lang === "ur" ? "تمام کاؤنٹرز" : "All Counters"}</span>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-black text-[#24180A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <Store className="w-4 h-4 text-[#D98A3C]" />
                          <span>{lang === "ur" ? "کاؤنٹر اسٹیشنز و پوائنٹ آف سیلز" : "Counter Stations & POS Pods"}</span>
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                          {countersBreakdown.length} {lang === "ur" ? "فعال کاؤنٹرز موجود ہیں" : "Active Stations"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setNewCounterName("");
                          setNewCounterCode("");
                          setNewCounterDesc("");
                          setShowAddCounterModal(true);
                        }}
                        className="px-4 py-2 rounded-full text-xs font-black bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white transition flex items-center gap-1.5 cursor-pointer border-0 shadow-none self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === "ur" ? "نیا کاؤنٹر بنائیں" : "Add Counter"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {countersBreakdown.map((cnt) => {
                        const dbCounter = countersQuery.data?.find((c) => c.name === cnt.counterName);
                        return (
                          <div
                            key={cnt.counterName}
                            onClick={() => {
                              playTapSound();
                              setSelectedCounterTab(cnt.counterName);
                            }}
                            className="bg-[#F8F3EC] dark:bg-[#182030] hover:bg-[#F4EFEA] dark:hover:bg-[#1E283C] rounded-[22px] p-4 transition cursor-pointer flex flex-col justify-between space-y-3 border-0 shadow-none relative group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1 mr-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-black text-[#24180A] dark:text-white truncate">
                                    {cnt.counterName}
                                  </h4>
                                  {dbCounter?.code && (
                                    <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/15 text-[#D98A3C]">
                                      {dbCounter.code}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                                  {cnt.cashiers.length > 0
                                    ? `Cashier: ${cnt.cashiers.map((c) => c.name).join(", ")}`
                                    : "No dedicated cashier"}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {dbCounter && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playTapSound();
                                        setEditingCounter(dbCounter);
                                      }}
                                      className="p-1 rounded-lg text-stone-400 hover:text-[#D98A3C] hover:bg-white dark:hover:bg-[#121824] transition cursor-pointer border-0"
                                      title="Edit Counter"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCounter(dbCounter.id, dbCounter.name)}
                                      className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer border-0"
                                      title="Delete Counter"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              </div>
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
                                <span>Details & Staff</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
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
                  {selectedCounterData && (() => {
                    const activeDbCounter = countersQuery.data?.find((c) => c.name === selectedCounterData.counterName);
                    return (
                    <>
                      {/* Counter Station Details & Actions Bar */}
                      <div className="bg-white dark:bg-[#121824] rounded-[26px] p-5 sm:p-6 border-0 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black shrink-0">
                            <Store className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-[#24180A] dark:text-white">
                                {selectedCounterData.counterName}
                              </h3>
                              {activeDbCounter?.code && (
                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-[#D98A3C]">
                                  {activeDbCounter.code}
                                </span>
                              )}
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                                Active Station
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {activeDbCounter?.description || (lang === "ur" ? "مخصوص پوائنٹ آف سیل کاؤنٹر" : "Dedicated POS & Billing Counter Pod")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                          {activeDbCounter && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  playTapSound();
                                  setEditingCounter(activeDbCounter);
                                }}
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F8F3EC] dark:bg-[#1A2234] hover:bg-[#EFE6DC] text-stone-800 dark:text-stone-200 transition flex items-center gap-1.5 cursor-pointer border-0"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#D98A3C]" />
                                <span>{lang === "ur" ? "کاؤنٹر ایڈٹ کریں" : "Edit Counter"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCounter(activeDbCounter.id, activeDbCounter.name)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-300 transition flex items-center gap-1.5 cursor-pointer border-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{lang === "ur" ? "ڈیلیٹ کریں" : "Delete"}</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setSelectedCounterTab("all");
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition flex items-center gap-1.5 cursor-pointer border-0"
                          >
                            <span>{lang === "ur" ? "← تمام کاؤنٹرز" : "← All Counters"}</span>
                          </button>
                        </div>
                      </div>

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
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF & DEVICE TERMINAL MANAGEMENT */}
          {activeTab === "staff" && (
            <div className="space-y-4">
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
                  <span>{lang === "ur" ? `تمام (${allStaffMembers.length})` : `All (${allStaffMembers.length})`}</span>
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
                  <span>{lang === "ur" ? `ایڈمنز (${adminCount})` : `Admins (${adminCount})`}</span>
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
                  <span>{lang === "ur" ? `کیشیئرز (${cashierCount})` : `Cashiers (${cashierCount})`}</span>
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
                  <span>{lang === "ur" ? `کچن (${kitchenCount})` : `Kitchen (${kitchenCount})`}</span>
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
                  <span>{lang === "ur" ? `ویٹرز (${waiterCount})` : `Waiters (${waiterCount})`}</span>
                </button>
              </div>

              {/* Staff Directory Table Format */}
              <div className="bg-white dark:bg-[#121824] rounded-[26px] p-4 sm:p-6 border-0 shadow-none space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#24180A] dark:text-white">
                      {lang === "ur"
                        ? `رجسٹرڈ عملہ اکاؤنٹس (${filteredStaff.length})`
                        : `Registered Staff Accounts (${filteredStaff.length})`}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      {lang === "ur"
                        ? "عملے کا پن، مخصوص کاؤنٹرز، ڈیوائس آئی پی اور اختیارات کا انتظام کریں۔"
                        : "Manage staff login PINs, assigned counter stations, device IP bindings, and access permissions"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-[#D98A3C] hover:bg-[#C27930] active:scale-[0.98] transition text-white text-xs font-black rounded-full flex items-center gap-1.5 shadow-none cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addStaff || (lang === "ur" ? "+ نیا عملہ شامل کریں" : "Register New Staff")}</span>
                  </button>
                </div>

                {filteredStaff.length === 0 ? (
                  <div className="text-center py-12 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl text-stone-400">
                    <p className="text-xs font-bold">
                      {lang === "ur" ? "اس فلٹر کے مطابق کوئی عملہ نہیں ملا۔" : "No staff members found matching this filter."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl bg-[#F8F3EC] dark:bg-[#182030] p-1">
                    <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300 border-collapse">
                      <thead className="text-stone-400 uppercase font-extrabold text-[10px] border-b border-stone-200/60 dark:border-stone-700/60">
                        <tr>
                          <th className="py-3 px-3.5">{t.staffMember || (lang === "ur" ? "عملہ ممبر" : "Staff Member")}</th>
                          <th className="py-3 px-3.5">{t.role || (lang === "ur" ? "عہدہ" : "Role")}</th>
                          <th className="py-3 px-3.5">{t.stationCounter || (lang === "ur" ? "مخصوص کاؤنٹر / شعبہ" : "Station / Dept")}</th>
                          <th className="py-3 px-3.5">{lang === "ur" ? "لاگ ان پن" : "Login PIN"}</th>
                          <th className="py-3 px-3.5">{t.deviceIp || (lang === "ur" ? "ڈیوائس آئی پی" : "Allowed Device IP")}</th>
                          <th className="py-3 px-3.5">{t.permissions || (lang === "ur" ? "اختیارات" : "Permissions")}</th>
                          <th className="py-3 px-3.5 text-right">{t.actions || (lang === "ur" ? "کارروائی" : "Actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/50 dark:divide-stone-700/50 font-medium">
                        {filteredStaff.map((member: any) => {
                          const isVisible = visiblePasswords[member.id] || false;
                          const roleBadge =
                            member.role === "admin"
                              ? { bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300", label: lang === "ur" ? "ایڈمن" : "Admin" }
                              : member.role === "cashier"
                              ? { bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300", label: lang === "ur" ? "کیشیئر" : "Cashier" }
                              : member.role === "kitchen"
                              ? { bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300", label: lang === "ur" ? "کچن" : "Kitchen" }
                              : { bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300", label: lang === "ur" ? "ویٹر" : "Waiter" };

                          const perms = member.permissionsList || [];

                          return (
                            <tr
                              key={member.id}
                              className={`hover:bg-white/80 dark:hover:bg-stone-800/60 transition ${
                                member.isActive ? "" : "opacity-60 bg-red-50/20"
                              }`}
                            >
                              {/* Column 1: Staff Member */}
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-[#D98A3C]/15 text-[#D98A3C] font-black text-xs flex items-center justify-center shrink-0">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-black text-xs text-[#24180A] dark:text-white truncate">
                                        {member.name}
                                      </span>
                                      {!member.isActive && (
                                        <span className="text-[9px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-1.5 py-0.2 rounded-full font-bold">
                                          Disabled
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                      {member.email || member.username}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Column 2: Role */}
                              <td className="py-3 px-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-block ${roleBadge.bg}`}>
                                  {roleBadge.label}
                                </span>
                              </td>

                              {/* Column 3: Assigned Station / Dept */}
                              <td className="py-3 px-3.5">
                                {member.role === "kitchen" && (
                                  <div className="space-y-0.5">
                                    <span className="text-[11px] font-bold text-[#D98A3C] flex items-center gap-1">
                                      <ChefHat className="w-3 h-3 text-[#D98A3C] shrink-0" />
                                      <span>{member.stationName || "All Departments"}</span>
                                    </span>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                      {member.assignedCashierName ? member.assignedCashierName : "All Counters / Roaming"}
                                    </p>
                                  </div>
                                )}
                                {member.role === "cashier" && (
                                  <span className="text-[11px] font-bold text-[#D98A3C]">
                                    {member.stationName || "Main Counter"}
                                  </span>
                                )}
                                {member.role === "waiter" && (
                                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                                    {member.assignedCashierName || "Roaming (All Stations)"}
                                  </span>
                                )}
                                {member.role === "admin" && (
                                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                    All Systems & Controls
                                  </span>
                                )}
                              </td>

                              {/* Column 4: Login PIN / Password */}
                              <td className="py-3 px-3.5">
                                <div className="inline-flex items-center gap-2 bg-white dark:bg-[#121824] px-2.5 py-1 rounded-xl border border-stone-200/50 dark:border-zinc-800">
                                  <span className="font-mono font-bold text-xs text-[#24180A] dark:text-white tracking-wider">
                                    {isVisible ? member.password || "1234" : "••••••••"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(member.id)}
                                    className="text-stone-400 hover:text-[#D98A3C] cursor-pointer"
                                    title={isVisible ? "Hide Password" : "Show Password"}
                                  >
                                    {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </div>
                              </td>

                              {/* Column 5: Allowed Device IP */}
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold">
                                    {member.role === "admin" ? (
                                      <span className="text-emerald-600 dark:text-emerald-400">Any Network</span>
                                    ) : member.allowedIp ? (
                                      <span className="text-[#24180A] dark:text-white">{member.allowedIp}</span>
                                    ) : (
                                      <span className="text-stone-400 italic">No IP set</span>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playTapSound();
                                      setShowEditIpModal(member);
                                      setEditIpValue(member.allowedIp || "");
                                    }}
                                    className="p-1 text-[#D98A3C] hover:bg-amber-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition"
                                    title="Edit Network IP binding"
                                  >
                                    <Smartphone className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Column 6: Permissions */}
                              <td className="py-3 px-3.5">
                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                  {perms.length > 0 ? (
                                    perms.slice(0, 2).map((p: string) => {
                                      const match = PERMISSION_OPTIONS.find((opt) => opt.id === p);
                                      const MatchIcon = match?.icon || ShieldCheck;
                                      return (
                                        <span
                                          key={p}
                                          className="text-[9px] bg-[#F4EFEA] dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                                        >
                                          <MatchIcon className="w-2.5 h-2.5 text-[#D98A3C] shrink-0" />
                                          <span className="truncate max-w-[90px]">{match?.label || p}</span>
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-[10px] text-stone-400 italic">Standard</span>
                                  )}
                                  {perms.length > 2 && (
                                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-[#D98A3C] px-1.5 py-0.5 rounded-md font-bold">
                                      +{perms.length - 2}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Column 7: Actions */}
                              <td className="py-3 px-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleShareCredentials(member)}
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white text-[11px] font-bold rounded-full flex items-center gap-1 cursor-pointer"
                                    title="Share credentials via WhatsApp"
                                  >
                                    <Share2 className="w-3 h-3" />
                                    <span className="hidden sm:inline">Share</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(member)}
                                    className="h-7 px-2.5 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-amber-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-[11px] font-bold rounded-full flex items-center gap-1 transition cursor-pointer"
                                    title="Edit Staff Member"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#D98A3C]" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>

                                  {member.role !== "admin" && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStaff(member.id, member.name)}
                                      className="h-7 w-7 text-stone-400 hover:text-red-600 transition rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer"
                                      title="Remove Staff Member"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* MODAL: ADD STAFF */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 sm:space-y-5 text-[#24180A] dark:text-white max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar border-0 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#24180A] dark:text-white leading-tight">
                      Register New Staff Account
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      Create staff credentials, assign station & dynamic permissions
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-9 h-9 rounded-full bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition cursor-pointer border-0 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                {/* 1. Account Credentials */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3 border-0">
                  <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                    Account Credentials (حساب کی تفصیلات)
                  </div>
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
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-medium"
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
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
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
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
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
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
                      >
                        <option value="cashier">Cashier (POS & Billing)</option>
                        <option value="waiter">Waiter (Floor Delivery)</option>
                        <option value="kitchen">Kitchen (KDS Queue)</option>
                        <option value="admin">Admin (Master Control)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Station & Routing Configuration */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3 border-0">
                  <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                    Station & Routing (کاؤنٹر و تعیناتی)
                  </div>

                  {newRole === "admin" ? (
                    <div className="p-3.5 bg-white dark:bg-[#121824] rounded-2xl flex items-center gap-2.5 border-0">
                      <ShieldCheck className="w-4 h-4 text-[#D98A3C] shrink-0" />
                      <div className="text-xs text-stone-600 dark:text-stone-300">
                        <span className="font-bold text-[#24180A] dark:text-white">Master Admin: </span>
                        Unrestricted global access across all registers, kitchen pods, and waiter stations.
                      </div>
                    </div>
                  ) : newRole === "cashier" ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                          Station / Counter Name (کاؤنٹر کا نام) *
                        </label>
                        <span className="text-[10px] text-stone-500">Quick Presets:</span>
                      </div>
                      <input
                        type="text"
                        value={newStation}
                        onChange={(e) => setNewStation(e.target.value)}
                        placeholder="e.g. Counter 1, Counter 2, Takeaway Desk"
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
                        required
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {((countersQuery.data && countersQuery.data.length > 0)
                          ? countersQuery.data.map((c) => c.name)
                          : ["Counter 1", "Counter 2", "Takeaway Desk"]
                        ).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNewStation(preset)}
                            className={`text-[10px] px-3 py-1 rounded-full transition font-bold cursor-pointer border-0 ${
                              newStation === preset
                                ? "bg-amber-100 dark:bg-amber-950/60 text-[#D98A3C]"
                                : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:bg-stone-200/60"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : newRole === "kitchen" ? (
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                            <ChefHat className="w-3.5 h-3.5 text-[#D98A3C]" />
                            <span>Assigned Kitchen Department (شعبہ کچن)</span>
                          </label>
                          <span className="text-[10px] text-[#D98A3C] font-bold">Live Departments</span>
                        </div>
                        <select
                          value={newStation}
                          onChange={(e) => setNewStation(e.target.value)}
                          className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none font-bold border-0"
                        >
                          <option value="All Departments (Main Kitchen)">
                            All Departments (Main Kitchen) - سارے شعبہ جات
                          </option>
                          {(departmentsQuery.data || []).map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} Department ({d.name} سیکشن)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Multi-Counter Cashier Assignment for Kitchen */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                            Assigned Counters / Cashiers (مختص کردہ کاؤنٹرز)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setNewAssignedCashierIds([]);
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer border-0 transition ${
                                newAssignedCashierIds.length === 0
                                  ? "bg-[#D98A3C] text-white"
                                  : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:bg-amber-100"
                              }`}
                            >
                              All Counters (Roaming)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setNewAssignedCashierIds(allCashiers.map((c) => c.id));
                              }}
                              className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setNewAssignedCashierIds([]);
                              }}
                              className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-red-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {allCashiers.length === 0 ? (
                          <div className="text-xs text-stone-400 p-3 bg-white dark:bg-[#121824] rounded-2xl">
                            No cashier accounts found. Kitchen will display orders from all counters.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allCashiers.map((c) => {
                              const isSelected = newAssignedCashierIds.includes(c.id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    playTapSound();
                                    if (isSelected) {
                                      setNewAssignedCashierIds((prev) => prev.filter((id) => id !== c.id));
                                    } else {
                                      setNewAssignedCashierIds((prev) => [...prev, c.id]);
                                    }
                                  }}
                                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition active:scale-[0.98] select-none cursor-pointer border-0 ${
                                    isSelected
                                      ? "bg-white dark:bg-[#121824] ring-2 ring-[#D98A3C] shadow-xs"
                                      : "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition ${
                                        isSelected
                                          ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                                          : "bg-stone-200/60 dark:bg-white/5 text-stone-400"
                                      }`}
                                    >
                                      <Store className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-[#24180A] dark:text-white truncate">
                                        {c.name}
                                      </div>
                                      <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                        {c.stationName || `Counter #${c.id}`}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                                      isSelected
                                        ? "bg-[#D98A3C] text-white shadow-xs"
                                        : "border-2 border-stone-300 dark:border-stone-600 bg-transparent"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5">
                          {newAssignedCashierIds.length === 0
                            ? "Roaming Mode: Kitchen displays incoming tickets from all active counters."
                            : `Restricted Mode: Kitchen receives tickets from ${newAssignedCashierIds.length} selected counter(s).`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                          Assigned Counters / Cashiers (مختص کردہ کاؤنٹرز)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setNewAssignedCashierIds([]);
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer border-0 transition ${
                              newAssignedCashierIds.length === 0
                                ? "bg-[#D98A3C] text-white"
                                : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:bg-amber-100"
                            }`}
                          >
                            All Counters (Roaming)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setNewAssignedCashierIds(allCashiers.map((c) => c.id));
                            }}
                            className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setNewAssignedCashierIds([]);
                            }}
                            className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-red-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {allCashiers.length === 0 ? (
                        <div className="text-xs text-stone-400 p-3 bg-white dark:bg-[#121824] rounded-2xl">
                          No cashier accounts found. Waiter will operate across all counters.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {allCashiers.map((c) => {
                            const isSelected = newAssignedCashierIds.includes(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  playTapSound();
                                  if (isSelected) {
                                    setNewAssignedCashierIds((prev) => prev.filter((id) => id !== c.id));
                                  } else {
                                    setNewAssignedCashierIds((prev) => [...prev, c.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition active:scale-[0.98] select-none cursor-pointer border-0 ${
                                  isSelected
                                    ? "bg-white dark:bg-[#121824] ring-2 ring-[#D98A3C] shadow-xs"
                                    : "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 opacity-75 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition ${
                                      isSelected
                                        ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                                        : "bg-stone-200/60 dark:bg-white/5 text-stone-400"
                                    }`}
                                  >
                                    <Store className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-[#24180A] dark:text-white truncate">
                                      {c.name}
                                    </div>
                                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                      {c.stationName || `Counter #${c.id}`}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? "bg-[#D98A3C] text-white shadow-xs"
                                      : "border-2 border-stone-300 dark:border-stone-600 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5">
                        {newAssignedCashierIds.length === 0
                          ? "Roaming Mode: Waiter can deliver orders from all counters."
                          : `Restricted Mode: Waiter delivers orders for ${newAssignedCashierIds.length} selected counter(s).`}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Dynamic Permissions Grid (HIG Accessible Tap Cards) */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3 border-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                        Dynamic Permissions (اختیارات)
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {newPermissions.length} of {PERMISSION_OPTIONS.length} permissions granted
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewPermissions(PERMISSION_OPTIONS.map((p) => p.id))}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-amber-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPermissions([])}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-red-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPermissions(getRoleDefaultPerms(newRole))}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-[#D98A3C]/15 text-[#D98A3C] hover:bg-[#D98A3C]/25 font-bold cursor-pointer border-0 transition"
                      >
                        Reset Preset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = newPermissions.includes(opt.id);
                      const OptIcon = opt.icon;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            playTapSound();
                            if (isChecked) {
                              setNewPermissions((prev) => prev.filter((p) => p !== opt.id));
                            } else {
                              setNewPermissions((prev) => [...prev, opt.id]);
                            }
                          }}
                          className={`p-3 rounded-2xl flex items-start gap-2.5 transition active:scale-[0.98] select-none cursor-pointer border-0 ${
                            isChecked
                              ? "bg-white dark:bg-[#121824] ring-2 ring-[#D98A3C] shadow-xs"
                              : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                              isChecked
                                ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                                : "bg-stone-200/50 dark:bg-white/5 text-stone-400"
                            }`}
                          >
                            <OptIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-[#24180A] dark:text-white leading-tight">
                              {opt.label}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5 line-clamp-2">
                              {opt.desc}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isChecked
                                ? "bg-[#D98A3C] text-white shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 bg-transparent"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Security & Status (LAST Section) */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3.5 border-0">
                  <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                    Security & Account Status (سیکیورٹی اور حیثیت)
                  </div>

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
                        Set to Current Device ({clientIp})
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newAllowedIp}
                      onChange={(e) => setNewAllowedIp(e.target.value)}
                      placeholder="e.g. 192.168.1.105 (leave blank for unrestricted access)"
                      className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                    />
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
                    className="flex-1 h-12 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold rounded-full text-stone-700 dark:text-stone-300 cursor-pointer border-0 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStaffMut.isPending}
                    className="flex-1 h-12 bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-black rounded-full cursor-pointer shadow-none transition"
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
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 sm:space-y-5 text-[#24180A] dark:text-white max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar border-0 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black shrink-0">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#24180A] dark:text-white leading-tight">
                      Edit Staff Account: {editingStaff.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      Update credentials, bound station & dynamic permissions
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="w-9 h-9 rounded-full bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition cursor-pointer border-0 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateStaff} className="space-y-4">
                {/* 1. Account Credentials */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3 border-0">
                  <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                    Account Credentials (حساب کی تفصیلات)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                        Staff Name *
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-medium"
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
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
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
                        placeholder="Leave blank to keep unchanged"
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                        Role Assignment *
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as any)}
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
                      >
                        <option value="cashier">Cashier (POS & Billing)</option>
                        <option value="waiter">Waiter (Floor Delivery)</option>
                        <option value="kitchen">Kitchen (KDS Queue)</option>
                        <option value="admin">Admin (Full Master)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Station & Routing Configuration */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3 border-0">
                  <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                    Station & Routing (کاؤنٹر و تعیناتی)
                  </div>

                  {editRole === "admin" ? (
                    <div className="p-3.5 bg-white dark:bg-[#121824] rounded-2xl flex items-center gap-2.5 border-0">
                      <ShieldCheck className="w-4 h-4 text-[#D98A3C] shrink-0" />
                      <div className="text-xs text-stone-600 dark:text-stone-300">
                        <span className="font-bold text-[#24180A] dark:text-white">Master Admin: </span>
                        Unrestricted global access across all registers, kitchen pods, and waiter stations.
                      </div>
                    </div>
                  ) : editRole === "cashier" ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                          Station / Counter Name (کاؤنٹر کا نام) *
                        </label>
                        <span className="text-[10px] text-stone-500">Quick Presets:</span>
                      </div>
                      <input
                        type="text"
                        value={editStation}
                        onChange={(e) => setEditStation(e.target.value)}
                        placeholder="e.g. Counter 1, Counter 2, Takeaway Desk"
                        className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
                        required
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {((countersQuery.data && countersQuery.data.length > 0)
                          ? countersQuery.data.map((c) => c.name)
                          : ["Counter 1", "Counter 2", "Takeaway Desk"]
                        ).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditStation(preset)}
                            className={`text-[10px] px-3 py-1 rounded-full transition font-bold cursor-pointer border-0 ${
                              editStation === preset
                                ? "bg-amber-100 dark:bg-amber-950/60 text-[#D98A3C]"
                                : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:bg-stone-200/60"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : editRole === "kitchen" ? (
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                            <ChefHat className="w-3.5 h-3.5 text-[#D98A3C]" />
                            <span>Assigned Kitchen Department (شعبہ کچن)</span>
                          </label>
                          <span className="text-[10px] text-[#D98A3C] font-bold">Live Departments</span>
                        </div>
                        <select
                          value={editStation}
                          onChange={(e) => setEditStation(e.target.value)}
                          className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none font-bold border-0"
                        >
                          <option value="All Departments (Main Kitchen)">
                            All Departments (Main Kitchen) - سارے شعبہ جات
                          </option>
                          {(departmentsQuery.data || []).map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} Department ({d.name} سیکشن)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Multi-Counter Cashier Assignment for Kitchen */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                            Assigned Counters / Cashiers (مختص کردہ کاؤنٹرز)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setEditAssignedCashierIds([]);
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer border-0 transition ${
                                editAssignedCashierIds.length === 0
                                  ? "bg-[#D98A3C] text-white"
                                  : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:bg-amber-100"
                              }`}
                            >
                              All Counters (Roaming)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setEditAssignedCashierIds(allCashiers.map((c) => c.id));
                              }}
                              className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setEditAssignedCashierIds([]);
                              }}
                              className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-red-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {allCashiers.length === 0 ? (
                          <div className="text-xs text-stone-400 p-3 bg-white dark:bg-[#121824] rounded-2xl">
                            No cashier accounts found. Kitchen will display orders from all counters.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allCashiers.map((c) => {
                              const isSelected = editAssignedCashierIds.includes(c.id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    playTapSound();
                                    if (isSelected) {
                                      setEditAssignedCashierIds((prev) => prev.filter((id) => id !== c.id));
                                    } else {
                                      setEditAssignedCashierIds((prev) => [...prev, c.id]);
                                    }
                                  }}
                                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition active:scale-[0.98] select-none cursor-pointer border-0 ${
                                    isSelected
                                      ? "bg-white dark:bg-[#121824] ring-2 ring-[#D98A3C] shadow-xs"
                                      : "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition ${
                                        isSelected
                                          ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                                          : "bg-stone-200/60 dark:bg-white/5 text-stone-400"
                                      }`}
                                    >
                                      <Store className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-[#24180A] dark:text-white truncate">
                                        {c.name}
                                      </div>
                                      <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                        {c.stationName || `Counter #${c.id}`}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                                      isSelected
                                        ? "bg-[#D98A3C] text-white shadow-xs"
                                        : "border-2 border-stone-300 dark:border-stone-600 bg-transparent"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5">
                          {editAssignedCashierIds.length === 0
                            ? "Roaming Mode: Kitchen displays incoming tickets from all active counters."
                            : `Restricted Mode: Kitchen receives tickets from ${editAssignedCashierIds.length} selected counter(s).`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                          Assigned Counters / Cashiers (مختص کردہ کاؤنٹرز)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setEditAssignedCashierIds([]);
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer border-0 transition ${
                              editAssignedCashierIds.length === 0
                                ? "bg-[#D98A3C] text-white"
                                : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:bg-amber-100"
                            }`}
                          >
                            All Counters (Roaming)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setEditAssignedCashierIds(allCashiers.map((c) => c.id));
                            }}
                            className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setEditAssignedCashierIds([]);
                            }}
                            className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-red-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {allCashiers.length === 0 ? (
                        <div className="text-xs text-stone-400 p-3 bg-white dark:bg-[#121824] rounded-2xl">
                          No cashier accounts found. Waiter will operate across all counters.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {allCashiers.map((c) => {
                            const isSelected = editAssignedCashierIds.includes(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  playTapSound();
                                  if (isSelected) {
                                    setEditAssignedCashierIds((prev) => prev.filter((id) => id !== c.id));
                                  } else {
                                    setEditAssignedCashierIds((prev) => [...prev, c.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition active:scale-[0.98] select-none cursor-pointer border-0 ${
                                  isSelected
                                    ? "bg-white dark:bg-[#121824] ring-2 ring-[#D98A3C] shadow-xs"
                                    : "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 opacity-75 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition ${
                                      isSelected
                                        ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                                        : "bg-stone-200/60 dark:bg-white/5 text-stone-400"
                                    }`}
                                  >
                                    <Store className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-[#24180A] dark:text-white truncate">
                                      {c.name}
                                    </div>
                                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                      {c.stationName || `Counter #${c.id}`}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? "bg-[#D98A3C] text-white shadow-xs"
                                      : "border-2 border-stone-300 dark:border-stone-600 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5">
                        {editAssignedCashierIds.length === 0
                          ? "Roaming Mode: Waiter can deliver orders from all counters."
                          : `Restricted Mode: Waiter delivers orders for ${editAssignedCashierIds.length} selected counter(s).`}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Dynamic Permissions Grid (HIG Accessible Tap Cards) */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3 border-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                        Dynamic Permissions (اختیارات)
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {editPermissions.length} of {PERMISSION_OPTIONS.length} permissions granted
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditPermissions(PERMISSION_OPTIONS.map((p) => p.id))}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-amber-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPermissions([])}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-[#121824] hover:bg-red-50 text-stone-700 dark:text-stone-300 font-bold cursor-pointer border-0 transition"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPermissions(DEFAULT_ROLE_PERMS[editRole] || [])}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-[#D98A3C]/15 text-[#D98A3C] hover:bg-[#D98A3C]/25 font-bold cursor-pointer border-0 transition"
                      >
                        Reset Preset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = editPermissions.includes(opt.id);
                      const OptIcon = opt.icon;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            playTapSound();
                            if (isChecked) {
                              setEditPermissions((prev) => prev.filter((p) => p !== opt.id));
                            } else {
                              setEditPermissions((prev) => [...prev, opt.id]);
                            }
                          }}
                          className={`p-3 rounded-2xl flex items-start gap-2.5 transition active:scale-[0.98] select-none cursor-pointer border-0 ${
                            isChecked
                              ? "bg-white dark:bg-[#121824] ring-2 ring-[#D98A3C] shadow-xs"
                              : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                              isChecked
                                ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                                : "bg-stone-200/50 dark:bg-white/5 text-stone-400"
                            }`}
                          >
                            <OptIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-[#24180A] dark:text-white leading-tight">
                              {opt.label}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5 line-clamp-2">
                              {opt.desc}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isChecked
                                ? "bg-[#D98A3C] text-white shadow-xs"
                                : "border-2 border-stone-300 dark:border-stone-600 bg-transparent"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Security & Status (LAST Section as requested) */}
                <div className="p-4 bg-[#F8F3EC]/80 dark:bg-[#182030] rounded-2xl space-y-3.5 border-0">
                  <div className="text-xs font-black text-[#D98A3C] uppercase tracking-wider">
                    Security & Account Status (سیکیورٹی اور حیثیت)
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                        Bound Device IP Address (Optional)
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
                      className="w-full h-11 bg-white dark:bg-[#121824] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono"
                    />
                  </div>

                  {/* Account Status Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-[#121824] rounded-2xl border-0">
                    <div>
                      <div className="text-xs font-bold text-[#24180A] dark:text-white">Account Status</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {editIsActive ? "Active & can log in to workspaces" : "Disabled / Frozen (cannot log in)"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsActive((prev) => !prev)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1.5 cursor-pointer border-0 select-none ${
                        editIsActive
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${editIsActive ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span>{editIsActive ? "Active" : "Disabled"}</span>
                    </button>
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
                    className="flex-1 h-12 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold rounded-full text-stone-700 dark:text-stone-300 cursor-pointer border-0 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStaffMut.isPending}
                    className="flex-1 h-12 bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-black rounded-full cursor-pointer shadow-none transition"
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-[#24180A] dark:text-white border-0 max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 text-[#24180A] dark:text-white border-0 cursor-default animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
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
              <div className="space-y-2.5 overflow-y-auto no-scrollbar pr-1 flex-1 max-h-[55vh]">
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

        {/* MODAL: ADD COUNTER */}
        {showAddCounterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white dark:bg-[#121824] rounded-[28px] max-w-md w-full p-5 sm:p-6 space-y-4 border-0 shadow-2xl relative text-[#24180A] dark:text-white">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#24180A] dark:text-white">
                      {lang === "ur" ? "نیا کاؤنٹر بنائیں" : "Create New Counter Station"}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {lang === "ur" ? "پوائنٹ آف سیل (POS) کیش کاؤنٹر شامل کریں" : "Register a new POS terminal pod for cashiers"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCounterModal(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 cursor-pointer border-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateCounter} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                    {lang === "ur" ? "کاؤنٹر کا نام *" : "Counter Name *"}
                  </label>
                  <input
                    type="text"
                    value={newCounterName}
                    onChange={(e) => setNewCounterName(e.target.value)}
                    placeholder="e.g. Counter 3, Express Takeaway, Rooftop Counter"
                    className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      {lang === "ur" ? "مختصر کوڈ (Code)" : "Station Code"}
                    </label>
                    <input
                      type="text"
                      value={newCounterCode}
                      onChange={(e) => setNewCounterCode(e.target.value)}
                      placeholder="e.g. C3, RT1"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      {lang === "ur" ? "اسٹیٹس" : "Status"}
                    </label>
                    <div className="h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{lang === "ur" ? "فعال (Active)" : "Active on Create"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                    {lang === "ur" ? "تفصیل و مقام" : "Description / Location"}
                  </label>
                  <input
                    type="text"
                    value={newCounterDesc}
                    onChange={(e) => setNewCounterDesc(e.target.value)}
                    placeholder="e.g. Second Floor Hall, Main Cash Desk"
                    className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCounterModal(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer border-0"
                  >
                    {lang === "ur" ? "منسوخ" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={createCounterMut.isPending}
                    className="px-5 py-2.5 rounded-full text-xs font-black bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white transition cursor-pointer flex items-center gap-1.5 border-0 disabled:opacity-50"
                  >
                    {createCounterMut.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{lang === "ur" ? "کاؤنٹر بنائیں" : "Create Counter"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT COUNTER */}
        {editingCounter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white dark:bg-[#121824] rounded-[28px] max-w-md w-full p-5 sm:p-6 space-y-4 border-0 shadow-2xl relative text-[#24180A] dark:text-white">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#24180A] dark:text-white">
                      {lang === "ur" ? "کاؤنٹر ایڈٹ کریں" : "Edit Counter Station"}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {lang === "ur" ? "کاؤنٹر کا نام، کوڈ یا فعال حیثیت تبدیل کریں" : "Update counter details or rename station"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCounter(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 cursor-pointer border-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateCounter} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                    {lang === "ur" ? "کاؤنٹر کا نام *" : "Counter Name *"}
                  </label>
                  <input
                    type="text"
                    value={editingCounter.name}
                    onChange={(e) =>
                      setEditingCounter({ ...editingCounter, name: e.target.value })
                    }
                    placeholder="e.g. Counter 1, Takeaway Desk"
                    className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-bold"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    {lang === "ur"
                      ? "نام تبدیل کرنے پر عملہ اور آرڈرز خودکار طریقے سے اپڈیٹ ہو جائیں گے"
                      : "Renaming will automatically update staff station mappings"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      {lang === "ur" ? "مختصر کوڈ" : "Station Code"}
                    </label>
                    <input
                      type="text"
                      value={editingCounter.code || ""}
                      onChange={(e) =>
                        setEditingCounter({ ...editingCounter, code: e.target.value })
                      }
                      placeholder="e.g. C1"
                      className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      {lang === "ur" ? "فعال حیثیت" : "Station Status"}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCounter({
                          ...editingCounter,
                          isActive: editingCounter.isActive !== false ? false : true,
                        })
                      }
                      className={`w-full h-11 rounded-2xl px-3.5 flex items-center justify-between text-xs font-bold cursor-pointer transition border-0 ${
                        editingCounter.isActive !== false
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                      }`}
                    >
                      <span>
                        {editingCounter.isActive !== false
                          ? (lang === "ur" ? "فعال (Active)" : "Active")
                          : (lang === "ur" ? "غیر فعال (Disabled)" : "Disabled")}
                      </span>
                      {editingCounter.isActive !== false ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-1">
                    {lang === "ur" ? "تفصیل و لوکیشن" : "Description / Location"}
                  </label>
                  <input
                    type="text"
                    value={editingCounter.description || ""}
                    onChange={(e) =>
                      setEditingCounter({ ...editingCounter, description: e.target.value })
                    }
                    placeholder="e.g. Front Gate Register"
                    className="w-full h-11 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl px-3.5 text-sm text-[#24180A] dark:text-white focus:ring-2 focus:ring-amber-500/30 outline-none border-0"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleDeleteCounter(editingCounter.id, editingCounter.name)}
                    className="px-3.5 py-2 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer border-0 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === "ur" ? "ڈیلیٹ کاؤنٹر" : "Delete"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCounter(null)}
                      className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer border-0"
                    >
                      {lang === "ur" ? "منسوخ" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={updateCounterMut.isPending}
                      className="px-5 py-2 rounded-full text-xs font-black bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white transition cursor-pointer flex items-center gap-1.5 border-0 disabled:opacity-50"
                    >
                      {updateCounterMut.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{lang === "ur" ? "تبدیلی محفوظ کریں" : "Save Changes"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* System Language Management Modal */}
        {showLanguageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div className="bg-white dark:bg-[#121824] rounded-[28px] max-w-xl w-full p-5 sm:p-6 space-y-4 border-0 shadow-2xl relative">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#24180A] dark:text-white">
                      {lang === "ur" ? "سسٹم کی زبانوں کا انتظام" : "System Language Permissions"}
                    </h3>
                    <p className="text-xs text-[#786B5D] dark:text-zinc-400">
                      {lang === "ur"
                        ? "یہاں سے طے کریں کہ کسٹمر اور کیشیر کو کون سی زبانیں دستیاب ہوں گی"
                        : "Choose which languages are allowed across the entire system header"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLanguageModal(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0">
                  {lang === "ur" ? "کوئیک سیٹ:" : "Quick Presets:"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedAllowedLangs(["ur", "en", "ps", "bal", "brh", "sd", "pa", "fa"]);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-700 dark:text-stone-200 hover:bg-[#EFE6DC] cursor-pointer"
                >
                  {lang === "ur" ? "تمام زبانیں (8)" : "Allow All (8)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedAllowedLangs(["ur", "en"]);
                    if (!["ur", "en"].includes(selectedDefaultLang)) setSelectedDefaultLang("ur");
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-700 dark:text-stone-200 hover:bg-[#EFE6DC] cursor-pointer"
                >
                  {lang === "ur" ? "صرف اردو و انگریزی" : "Urdu & English Only"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedAllowedLangs(["ur"]);
                    setSelectedDefaultLang("ur");
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-700 dark:text-stone-200 hover:bg-[#EFE6DC] cursor-pointer"
                >
                  {lang === "ur" ? "صرف اردو (Urdu Only)" : "Urdu Only"}
                </button>
              </div>

              {/* Languages List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {LANG_OPTIONS.map((opt) => {
                  const isAllowed = selectedAllowedLangs.includes(opt.value);
                  const isDefault = selectedDefaultLang === opt.value;

                  return (
                    <div
                      key={opt.value}
                      onClick={() => {
                        playTapSound();
                        if (isAllowed) {
                          if (selectedAllowedLangs.length <= 1) {
                            toast.error(lang === "ur" ? "کم از کم ایک زبان فعال ہونی چاہیے" : "At least one language must remain allowed");
                            return;
                          }
                          const next = selectedAllowedLangs.filter((l) => l !== opt.value);
                          setSelectedAllowedLangs(next);
                          if (isDefault) {
                            setSelectedDefaultLang(next[0] || "ur");
                          }
                        } else {
                          setSelectedAllowedLangs([...selectedAllowedLangs, opt.value]);
                        }
                      }}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-2 border transition cursor-pointer ${
                        isAllowed
                          ? "bg-amber-50/40 dark:bg-amber-950/20 border-[#D98A3C]/40 text-[#24180A] dark:text-white"
                          : "bg-stone-50 dark:bg-zinc-900/60 border-stone-200 dark:border-zinc-800 text-stone-400 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white text-xs ${
                            isAllowed ? "bg-[#D98A3C]" : "bg-stone-300 dark:bg-zinc-700"
                          }`}
                        >
                          {isAllowed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm">{opt.nativeName}</span>
                            <span className="text-[10px] text-stone-500 font-mono font-bold">({opt.englishName})</span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase">
                            {opt.shortCode} • {opt.dir.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {isAllowed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            setSelectedDefaultLang(opt.value);
                          }}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full transition cursor-pointer border-0 shrink-0 ${
                            isDefault
                              ? "bg-[#D98A3C] text-white"
                              : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-600 dark:text-stone-300 hover:bg-[#EFE6DC]"
                          }`}
                        >
                          {isDefault
                            ? (lang === "ur" ? "ڈیفالٹ" : "Default")
                            : (lang === "ur" ? "ڈیفالٹ بنائیں" : "Set Default")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowLanguageModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer border-0"
                >
                  {lang === "ur" ? "منسوخ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveLanguages}
                  disabled={updateConfigMut.isPending}
                  className="px-5 py-2 rounded-full text-xs font-black bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white transition cursor-pointer flex items-center gap-1.5 border-0 disabled:opacity-50"
                >
                  {updateConfigMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{lang === "ur" ? "محفوظ کریں" : "Save Language Settings"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

          {/* TAB 3: SHIFT & DAY CLOSE SESSION MANAGER */}
          {activeTab === "shift_session" && <ShiftSessionManager />}

          {/* TAB 4: SYSTEM SETTINGS & CONFIGURATION */}
          {activeTab === "settings" && (
            <SettingsTab
              operationMode={operationMode}
              showCustomerQueue={showCustomerQueue}
              soundEnabled={soundEnabled}
              defaultPosAccess={defaultPosAccess}
              allowedLanguages={(systemConfigQuery.data?.allowedLanguages as string[]) || ["ur", "en", "ps", "bal", "brh", "sd", "pa", "fa"]}
              defaultLanguage={(systemConfigQuery.data?.defaultLanguage as string) || "ur"}
              onToggleMode={handleToggleMode}
              onToggleCustomerQueue={handleToggleCustomerQueue}
              onToggleSound={handleToggleSound}
              onToggleDefaultPosAccess={handleToggleDefaultPosAccess}
              onSaveLanguages={async (allowed, defLang) => {
                try {
                  await updateConfigMut.mutateAsync({
                    allowedLanguages: allowed,
                    defaultLanguage: defLang,
                  });
                  playOrderSuccessSound();
                  toast.success(
                    lang === "ur"
                      ? "زبانوں کی ترتیبات کامیابی سے محفوظ ہو گئیں!"
                      : "Language permissions updated successfully!"
                  );
                  systemConfigQuery.refetch();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to save language settings");
                }
              }}
              isSaving={updateConfigMut.isPending}
              clientIp={clientIp}
              staffName={staff?.name || "Admin"}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <StaffBottomNav
          current="admin"
          items={[
            { key: "accounts", label: lang === "ur" ? "کھاتہ جات" : "Accounts", icon: Building2 },
            { key: "staff", label: lang === "ur" ? "عملہ و اختیارات" : "Staff & Roles", icon: Users, badge: allStaffMembers.length },
            { key: "shift_session", label: lang === "ur" ? "شفٹ و کلوز" : "Shift & Close", icon: Layers },
            { key: "settings", label: lang === "ur" ? "سیٹنگز" : "Settings", icon: Settings },
          ]}
          activeItem={activeTab}
          onSelectItem={(k) => setActiveTab(k as "accounts" | "staff" | "shift_session" | "settings")}
          onOpenDrawer={() => setDrawerOpen(false)}
        />

        {/* Mobile Drawer Sheet */}
        <StaffDrawerSheet
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          current="admin"
        />
      </div>
    </StaffAuthGuard>
  );
}

export default AdminDashboardView;
