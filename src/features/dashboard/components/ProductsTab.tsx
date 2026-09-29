"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ProductForm } from "@/components/ProductForm";
import { Plus, Trash2, Edit3, Search, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

export const ProductsTab = () => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  // tRPC Queries and Mutations
  const { data: products, isLoading, refetch } = trpc.product.getProducts.useQuery({ search });
  const deleteMutation = trpc.product.deleteProduct.useMutation();

  const handleAdd = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const handleEdit = (p: any) => {
    setEditProduct(p);
    setShowForm(true);
  };

  const handleDelete = (p: any) => {
    setConfirmDelete(p);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: confirmDelete.id });
      toast.success(`${confirmDelete.name} deleted`);
      setConfirmDelete(null);
      refetch();
    } catch {
      toast.error("Failed to delete product");
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
        Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action cannot be
        undone.
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
      {/* Search and Action Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-white dark:bg-gray-900"
          />
        </div>
        <button
          onClick={handleAdd}
          className="h-11 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl flex items-center gap-1.5 text-sm font-semibold shrink-0 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!products || products.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found</p>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((p: any) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {p.imageUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 dark:border-gray-800">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-900/30">
                  <Package className="w-8 h-8 opacity-70" />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{p.name}</h3>
                    <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-lg shrink-0">
                      Rs. {p.price}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.description}</p>
                  )}
                  {(p.departmentName || p.department?.name) && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {p.departmentName || p.department?.name}
                    </span>
                  )}
                  {p.options && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium line-clamp-1 mt-1">
                      ⚙️ {p.options}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 mt-2 border-t border-gray-50 dark:border-gray-800 pt-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Drawer / Dialog */}
      <ProductForm
        open={showForm}
        onClose={() => setShowForm(false)}
        initialData={editProduct}
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
