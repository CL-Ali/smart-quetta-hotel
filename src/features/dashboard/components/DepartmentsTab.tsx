"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { DepartmentForm } from "../../components/DepartmentForm";
import { Plus, Trash2, Edit3, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
<<<<<<<< HEAD:smart-quetta-hotel-next/app/src/pages/Dashboard/DepartmentsTab.tsx
import { Drawer, DrawerContent } from "../../components/ui/drawer";
import { useIsMobile } from "../../hooks/useMobile";
import { AlertDialog, AlertDialogContent } from "../../components/ui/alert-dialog";
import { fmtDate } from "../../lib/time";
========
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { fmtDate } from "@/lib/time";

>>>>>>>> v1.0.0:src/features/dashboard/components/DepartmentsTab.tsx
export const DepartmentsTab = () => {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  // tRPC Queries and Mutations
  const { data: departments, isLoading, refetch } = trpc.department.getDepartments.useQuery();
  const deleteMutation = trpc.department.deleteDepartment.useMutation();

  const handleAdd = () => {
    setEditDept(null);
    setShowForm(true);
  };

  const handleEdit = (d: any) => {
    setEditDept(d);
    setShowForm(true);
  };

  const handleDelete = (d: any) => {
    setConfirmDelete(d);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: confirmDelete.id });
      toast.success(`${confirmDelete.name} deleted`);
      setConfirmDelete(null);
      refetch();
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const renderDeleteConfirmation = (isMob: boolean) => (
    <div className="p-4 flex flex-col gap-4 text-center">
      <div
        className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 ${
          isMob ? "pt-0" : "pt-2"
        }`}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-150">Confirm Delete</h3>
      </div>
      <p className="text-sm text-gray-500 my-2">
        Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? All associated products
        will lose this department classification.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setConfirmDelete(null)}
          className="flex-1 h-11 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 rounded-xl text-sm font-semibold cursor-pointer text-gray-600 dark:text-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={deleteMutation.isPending}
          className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm cursor-pointer flex items-center justify-center"
        >
          {deleteMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Delete"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Departments</h2>
          <p className="text-xs text-gray-500">Manage categories used to group your products</p>
        </div>
        <button
          onClick={handleAdd}
          className="h-10 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!departments || departments.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <FolderOpen className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No departments found</p>
        </div>
      )}

      {/* Departments List */}
      {!isLoading && departments && departments.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50 dark:divide-gray-800">
          {departments.map((d: any) => (
            <div
              key={d.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{d.name}</h3>
                <p className="text-[10px] text-gray-400">Created: {fmtDate(d.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(d)}
                  className="p-2 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                  title="Edit Department"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(d)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete Department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Drawer / Dialog */}
      <DepartmentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        initialData={editDept}
        onSuccess={() => {
          setShowForm(false);
          refetch();
        }}
      />

      {/* Delete Confirmation */}
      {confirmDelete &&
        (isMobile ? (
          <Drawer open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
            <DrawerContent className="bg-white dark:bg-gray-950 p-0">
              <div className="mx-auto w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full my-3 shrink-0" />
              {renderDeleteConfirmation(true)}
            </DrawerContent>
          </Drawer>
        ) : (
          <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
            <AlertDialogContent className="max-w-sm mx-4 bg-white dark:bg-gray-950 p-0 overflow-hidden">
              {renderDeleteConfirmation(false)}
            </AlertDialogContent>
          </AlertDialog>
        ))}
    </div>
  );
};
