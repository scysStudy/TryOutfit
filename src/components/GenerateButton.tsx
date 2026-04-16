"use client";

import { Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  creditsRemaining: number;
}

export function GenerateButton({
  onClick,
  disabled,
  isLoading,
  creditsRemaining,
}: GenerateButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg font-medium transition-colors",
          disabled || isLoading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>生成中...</span>
          </>
        ) : (
          <>
            <Wand2 size={20} />
            <span>生成试穿图</span>
          </>
        )}
      </button>
      <p className="text-xs text-center text-gray-500">
        剩余 {creditsRemaining} 次机会
      </p>
    </div>
  );
}
