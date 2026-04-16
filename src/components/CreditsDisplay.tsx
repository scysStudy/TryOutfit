"use client";

import { Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserCredits } from "@/types";

interface CreditsDisplayProps {
  credits: UserCredits;
  onSubscribe: () => void;
}

export function CreditsDisplay({ credits, onSubscribe }: CreditsDisplayProps) {
  const hasLowCredits = credits.remaining <= 1;
  const hasNoCredits = credits.remaining === 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            hasNoCredits
              ? "bg-red-100 text-red-600"
              : hasLowCredits
              ? "bg-yellow-100 text-yellow-600"
              : "bg-green-100 text-green-600"
          )}
        >
          <Zap size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {credits.remaining} / {credits.total} 次机会
          </p>
          <p className="text-xs text-gray-500">
            {hasNoCredits
              ? "次数已用完"
              : hasLowCredits
              ? "次数不足"
              : "可用次数"}
          </p>
        </div>
      </div>
      {!credits.isSubscribed && (
        <button
          type="button"
          onClick={onSubscribe}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            hasNoCredits
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          <Crown size={16} />
          <span>订阅</span>
        </button>
      )}
      {credits.isSubscribed && (
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full">
          <Crown size={12} />
          <span>高级会员</span>
        </div>
      )}
    </div>
  );
}
