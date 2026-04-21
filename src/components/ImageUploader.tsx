"use client";

import { useCallback, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonImage, ClothingImage, ClothingCategory } from "@/types";

interface ImageUploaderProps {
  type: "person" | "clothing";
  image: PersonImage | ClothingImage | null;
  onImageUpload: (image: PersonImage | ClothingImage) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

export function ImageUploader({
  type,
  image,
  onImageUpload,
  onImageRemove,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const id = `${type}-${Date.now()}`;
        const timestamp = Date.now();

        if (type === "person") {
          onImageUpload({ id, url, timestamp } as PersonImage);
        } else {
          onImageUpload({
            id,
            url,
            category: null,
            timestamp,
          } as ClothingImage);
        }
      };
      reader.readAsDataURL(file);
    },
    [type, onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const id = `${type}-${Date.now()}`;
        const timestamp = Date.now();

        if (type === "person") {
          onImageUpload({ id, url, timestamp } as PersonImage);
        } else {
          onImageUpload({
            id,
            url,
            category: null,
            timestamp,
          } as ClothingImage);
        }
      };
      reader.readAsDataURL(file);
    },
    [type, onImageUpload, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const label = type === "person" ? "你的照片" : "服装图片";
  const hint =
    type === "person"
      ? "上传你的照片"
      : "上传服装图片";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          image && "border-solid border-gray-400"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {image ? (
          <>
            <img
              src={image.url}
              alt={type}
              className="object-contain w-full h-full rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove();
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              disabled={false}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={disabled}
            />
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload size={32} />
              <span className="text-sm">{hint}</span>
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
