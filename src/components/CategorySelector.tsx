"use client";

import { Shirt, CircleDot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClothingCategory } from "@/types";

interface CategorySelectorProps {
  selected: ClothingCategory | null;
  onSelect: (category: ClothingCategory) => void;
  disabled?: boolean;
}

const categories: { value: ClothingCategory; label: string; icon: React.ReactNode }[] = [
  { value: "tops", label: "上衣", icon: <Shirt size={20} /> },
  { value: "bottoms", label: "下装", icon: <CircleDot size={20} /> },
  { value: "dresses", label: "连衣裙", icon: <Sparkles size={20} /> },
];

export function CategorySelector({
  selected,
  onSelect,
  disabled = false,
}: CategorySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        服装类别
      </label>
      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors",
              selected === cat.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 hover:border-gray-400 text-gray-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {cat.icon}
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
