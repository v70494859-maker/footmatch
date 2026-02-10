"use client";

import { useRef } from "react";
import Image from "next/image";

interface AvatarUploadProps {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

export default function AvatarUpload({
  previewUrl,
  onFileSelect,
  onRemove,
  size = "md",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 2 Mo");
        return;
      }
      onFileSelect(file);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`
          relative ${sizes[size]} rounded-full overflow-hidden
          border-2 border-dashed border-surface-300
          hover:border-pitch-500 transition-colors duration-150
          flex items-center justify-center bg-white
          group
        `}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Avatar"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <svg
            className="w-8 h-8 text-surface-400 group-hover:text-pitch-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </button>

      {/* Remove button */}
      {previewUrl && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-danger-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Remove avatar"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
