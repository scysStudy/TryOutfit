"use client";

import { Download, Share2, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TryOnResult } from "@/types";

interface ResultDisplayProps {
  result: TryOnResult | null;
  onDownload: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function ResultDisplay({
  result,
  onDownload,
  onShare,
  onRegenerate,
  isLoading,
}: ResultDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600">正在生成试穿预览...</p>
        <p className="text-sm text-gray-400 mt-1">通常需要 10-20 秒</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600">试穿预览将显示在这里</p>
        <p className="text-sm text-gray-400 mt-1">
          上传你的照片和服装图片开始体验
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        <img
          src={result.resultUrl}
          alt="试穿结果"
          className="w-full h-auto"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
          <Check size={12} />
          <span>预览已生成</span>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500">
        仅作为购前参考，实际效果可能有所不同。
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDownload}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          )}
        >
          <Download size={16} />
          <span className="text-sm">下载</span>
        </button>
        <button
          type="button"
          onClick={onShare}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          )}
        >
          <Share2 size={16} />
          <span className="text-sm">分享</span>
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          )}
        >
          <RefreshCw size={16} />
          <span className="text-sm">再试一张</span>
        </button>
      </div>
    </div>
  );
}
