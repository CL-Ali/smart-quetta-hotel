// src/components/DepartmentForm.tsx
import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import {
  AlertDialog, AlertDialogContent,
} from "@/components/ui/alert-dialog";
import {
  Drawer, DrawerContent,
} from "@/components/ui/drawer";

export interface DepartmentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** If editing, pass the existing department data */
  initialData?: {
    id: number;
    name: string;
  };
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ open, onClose, onSuccess, initialData }) => {
  const isMobile = useIsMobile();
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");

  // Sync initial data if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName("");
    }
  }, [initialData, open]);

  const createMutation = trpc.department.createDepartment.useMutation();
  const updateMutation = trpc.department.updateDepartment.useMutation();

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialData!.id,
          name: name.trim(),
        });
        toast.success("Department updated");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
        });
        toast.success("Department created");
      }
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save department");
    }
  };

  const renderContent = (isMob: boolean) => (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden max-h-[85vh]">
      {/* Header */}
      <div className={`px-4 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0 ${isMob ? "pt-2" : "pt-4"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? "Edit Department" : "Add New Department"}
          </h2>
          <button type="button" onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block">
            Department Name *
          </label>
          <Input
            placeholder="e.g. Parathas or Cold Drinks"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="h-11"
            autoFocus
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className={`px-4 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-2 ${isMob ? "pb-8" : "pb-4"}`}>
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 h-12 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-450 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center"
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Department"
          )}
        </button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => !v && handleClose()}>
        <DrawerContent className="max-h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-950">
          <div className="mx-auto w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full my-3 shrink-0" />
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={v => !v && handleClose()}>
      <AlertDialogContent className="max-w-sm mx-4 max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-gray-950">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
};
