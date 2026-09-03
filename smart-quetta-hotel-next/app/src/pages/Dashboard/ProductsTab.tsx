import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { ProductForm } from "../../components/ProductForm";
import { Plus, Trash2, Edit3, Search, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "../../components/ui/drawer";
import { useIsMobile } from "../../hooks/useMobile";
import { AlertDialog, AlertDialogContent } from "../../components/ui/alert-dialog";

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
      <div className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 ${isMob ? "pt-0" : "pt-2"}`}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-150">Confirm Delete</h3>
      </div>
      <p className="text-sm text-gray-500 my-2">
        Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action cannot be undone.
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

      {/* Products List */}
      {!isLoading && products && products.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50 dark:divide-gray-800">
          {products.map((p: any) => (
            <div
              key={p.id}
              className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors"
            >
              {/* Product Thumbnail & Main Details */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Thumbnail */}
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-150 text-sm truncate">
                      {p.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 capitalize truncate">
                      {p.category || "No Category"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {p.departmentName || "General"}
                    </span>
                    <span className="text-sm font-black text-orange-600">
                      Rs. {p.price.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0 ml-4">
                <button
                  onClick={() => handleEdit(p)}
                  className="p-1.5 bg-gray-50 hover:bg-orange-50 dark:bg-gray-950 dark:hover:bg-orange-950/20 rounded-lg text-gray-450 hover:text-orange-600 transition-colors cursor-pointer border border-gray-100 dark:border-gray-800"
                  title="Edit Product"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-1.5 bg-gray-50 hover:bg-red-50 dark:bg-gray-950 dark:hover:bg-red-950/20 rounded-lg text-gray-450 hover:text-red-600 transition-colors cursor-pointer border border-gray-100 dark:border-gray-800"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form Overlay */}
      <ProductForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
        initialData={editProduct ?? undefined}
      />

      {/* Delete Confirmation Sheet/Modal */}
      {confirmDelete && (
        isMobile ? (
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
        )
      )}
    </div>
  );
};
export default ProductsTab;
