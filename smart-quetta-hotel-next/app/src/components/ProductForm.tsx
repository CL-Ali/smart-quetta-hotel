// src/components/ProductForm.tsx
import React, { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Loader2, X, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from "../hooks/useMobile";
import {
  AlertDialog, AlertDialogContent,
} from "../components/ui/alert-dialog";
import {
  Drawer, DrawerContent,
} from "../components/ui/drawer";
import { DepartmentSelect } from "./DepartmentSelect";

export interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** If editing, pass the existing product data */
  initialData?: {
    id: number;
    name: string;
    price: number;
    category?: string | null;
    departmentId: number;
    imageUrl?: string | null;
  };
}

export const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, onSuccess, initialData }) => {
  const isMobile = useIsMobile();
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [departmentId, setDepartmentId] = useState<number | undefined>(initialData?.departmentId);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.imageUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);

  // Update preview when a new file is selected
  useEffect(() => {
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Sync initial data if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price.toString());
      setCategory(initialData.category ?? "");
      setDepartmentId(initialData.departmentId);
      setPreviewUrl(initialData.imageUrl ?? "");
      setImageFile(null);
    } else {
      setName("");
      setPrice("");
      setCategory("");
      setDepartmentId(undefined);
      setPreviewUrl("");
      setImageFile(null);
    }
  }, [initialData, open]);

  const createMutation = trpc.product.createProduct.useMutation();
  const updateMutation = trpc.product.updateProduct.useMutation();

  const handleClose = () => {
    setName("");
    setPrice("");
    setCategory("");
    setDepartmentId(undefined);
    setPreviewUrl("");
    setImageFile(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !category.trim() || !departmentId) {
      toast.error("All fields are required");
      return;
    }

    let uploadedUrl = previewUrl;
    setIsUploading(true);

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }
        const data = await uploadRes.json();
        uploadedUrl = data.url;
      } catch (err) {
        toast.error("Image upload failed");
        setIsUploading(false);
        return;
      }
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialData!.id,
          name: name.trim(),
          price: parseFloat(price),
          category: category.trim(),
          departmentId,
          imageUrl: uploadedUrl || undefined,
        });
        toast.success("Product updated");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          price: parseFloat(price),
          category: category.trim(),
          departmentId,
          imageUrl: uploadedUrl || undefined,
        });
        toast.success("Product created");
      }
      setIsUploading(false);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save product");
      setIsUploading(false);
    }
  };

  const renderContent = (isMob: boolean) => (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden max-h-[85vh]">
      {/* Header */}
      <div className={`px-4 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0 ${isMob ? "pt-2" : "pt-4"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button type="button" onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block">
            Product Name *
          </label>
          <Input
            placeholder="e.g. Special Doodh Patti"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block">
            Price (Rs.) *
          </label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 120"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block">
            Category *
          </label>
          <Input
            placeholder="e.g. Tea or Snacks"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <DepartmentSelect selectedId={departmentId} onSelect={setDepartmentId} />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block">
            Product Image
          </label>
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <label className="cursor-pointer bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition-all shrink-0 shadow-sm">
              {previewUrl ? "Change Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex-1 flex items-center justify-center border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden h-16 w-16 bg-white dark:bg-gray-950">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>
          </div>
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
          disabled={createMutation.isPending || updateMutation.isPending || isUploading}
          className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center"
        >
          {createMutation.isPending || updateMutation.isPending || isUploading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Product"
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
