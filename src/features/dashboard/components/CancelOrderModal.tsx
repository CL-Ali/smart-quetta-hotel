"use client";

import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { useLang } from "@/contexts/LangContext";

interface CancelOrderModalProps {
  orderId: number | null;
  onClose: () => void;
  onConfirm: (orderId: number) => void;
}

export function CancelOrderModal({ orderId, onClose, onConfirm }: CancelOrderModalProps) {
  const { t } = useLang();
  const isMobile = useIsMobile();

  if (orderId === null) return null;

  const content = (
    <div className="p-4 flex flex-col gap-4 text-center">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.confirmCancel}</h3>
      </div>
      <p className="text-sm text-gray-500 my-2">
        {t.confirmCancelDesc} (Order #{orderId})
      </p>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-11 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl text-sm font-semibold cursor-pointer text-gray-600 dark:text-gray-400 transition"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm(orderId);
            onClose();
          }}
          className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm cursor-pointer flex items-center justify-center transition shadow-sm"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={orderId !== null} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="bg-white dark:bg-gray-950 p-0">
          <div className="mx-auto w-12 h-1.5 bg-gray-200 rounded-full my-3 shrink-0" />
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={orderId !== null} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-sm p-0 overflow-hidden bg-white dark:bg-gray-950">
        {content}
      </AlertDialogContent>
    </AlertDialog>
  );
}
