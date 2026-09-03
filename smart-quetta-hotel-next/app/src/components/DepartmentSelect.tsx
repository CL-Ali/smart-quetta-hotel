import React from "react";
import { trpc } from "../lib/trpc";
import { Loader2 } from "lucide-react";

interface DepartmentSelectProps {
  selectedId?: number;
  onSelect: (id: number) => void;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({ selectedId, onSelect }) => {
  const { data: departments, isLoading } = trpc.department.getDepartments.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 className="animate-spin w-4 h-4" />
        <span>Loading departments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block">
        Department *
      </label>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="w-full h-11 px-3 bg-white dark:bg-gray-850 border border-gray-250 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors cursor-pointer"
        required
      >
        <option value="" disabled>Select a department</option>
        {departments?.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
    </div>
  );
};
