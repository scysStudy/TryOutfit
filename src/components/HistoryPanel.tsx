"use client";

import { Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoryItem } from "@/types";

interface HistoryPanelProps {
  items: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryPanel({
  items,
  onItemClick,
  onDeleteItem,
}: HistoryPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Clock size={32} />
        <p className="mt-2 text-sm">暂无历史记录</p>
        <p className="text-xs">你的试穿结果将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-700">历史记录</h3>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
            onClick={() => onItemClick(item)}
          >
            <div className="aspect-square relative">
              <img
                src={item.result.resultUrl}
                alt="结果"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs">查看</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="p-1.5 bg-gray-50">
              <p className="text-xs text-gray-500 truncate">
                {new Date(item.result.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
