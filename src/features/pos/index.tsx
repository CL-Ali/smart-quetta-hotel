"use client";

import React, { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { StaffHeaderBar } from "@/components/StaffHeaderBar";
import { StaffDrawerSheet } from "@/components/StaffDrawerSheet";
import { StaffAuthGuard } from "@/components/StaffAuthGuard";
import { PosTerminalTab } from "@/features/dashboard/components/PosTerminalTab";
import { PaymentSheet } from "@/features/dashboard/components/PaymentSheet";

export function PosView() {
  const { t, lang } = useLang();
  const { staff } = useAuth();
  const [payOrder, setPayOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <StaffAuthGuard requiredPermission="canPos" allowedRoles={["admin", "cashier", "waiter", "kitchen"]}>
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC] flex flex-col">
        {/* ── Top Unified Navigation Header ───────────────────────── */}
        <StaffHeaderBar
          current="pos"
          title={t.hotelName || "Smart Hotel"}
          subtitle={`${lang === "ur" ? "پی او ایس ٹرمینل" : "POS Terminal"}${staff?.stationName ? ` • ${staff.stationName}` : ""}`}
          icon={LayoutGrid}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        {/* ── Main Viewport Area (100% Height Filled, Dual Pane POS Terminal) ──── */}
        <main className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:px-6 py-2.5 overflow-hidden">
          <PosTerminalTab
            onOrderCreated={(newOrder) => {
              setPayOrder(newOrder);
            }}
          />
        </main>

        {/* Payment Settlement Modal */}
        {payOrder && (
          <PaymentSheet
            order={payOrder}
            open={!!payOrder}
            onClose={() => setPayOrder(null)}
            onDone={() => setPayOrder(null)}
          />
        )}

        {/* Mobile Drawer Sheet */}
        <StaffDrawerSheet
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          current="pos"
        />
      </div>
    </StaffAuthGuard>
  );
}

export default PosView;
