"use client";

import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { CartItem } from "@/types/hotel";

interface ConfirmPlaceModalProps {
  open: boolean;
  cart: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmPlaceModal({
  open,
  cart,
  cartTotal,
  onClose,
  onConfirm,
}: ConfirmPlaceModalProps) {
  const isMobile = useIsMobile();

  const renderContent = (isMob: boolean) => (
    <div className="p-4 flex flex-col gap-4 text-center">
      <div
        className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 ${
          isMob ? "pt-0" : "pt-2"
        }`}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirm Order</h3>
      </div>

      <p className="text-sm text-gray-500 my-1">
        Are you sure you want to place this order for <strong>Rs. {cartTotal.toFixed(0)}</strong>?
      </p>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-left max-h-40 overflow-y-auto space-y-1.5 border border-gray-100 dark:border-gray-800">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex justify-between text-xs text-gray-600 dark:text-gray-400"
          >
            <span>
              {item.name} ×{item.quantity}
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-200">
              Rs. {(item.price * item.quantity).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-11 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl text-sm font-semibold cursor-pointer text-gray-600 dark:text-gray-400 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onConfirm();
          }}
          className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm cursor-pointer flex items-center justify-center shadow-sm transition"
        >
          Confirm Order
        </button>
      </div>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="bg-white dark:bg-gray-950 p-0">
          <div className="mx-auto w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full my-3 shrink-0" />
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-sm mx-4 bg-white dark:bg-gray-950 p-0 overflow-hidden">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}
