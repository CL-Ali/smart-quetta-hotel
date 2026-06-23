import React from "react";
import { Plus } from "lucide-react";

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => (

      <button
        onClick={onClick}
        className="sm:hidden fixed bottom-6 right-6 z-40 bg-black hover:bg-black/90 active:scale-95 text-white rounded-full p-4 shadow-xl transition-all flex items-center justify-center cursor-pointer border border-neutral-800"
      >
        <Plus className="w-6 h-6" />
      </button>
);

  {/* <button
    onClick={onClick}
    className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-shadow"
  >
    <Plus className="w-6 h-6" />
  </button> */}
