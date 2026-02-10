"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "google" | "apple";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-pitch-500 text-white hover:bg-pitch-600 active:bg-pitch-700",
  secondary:
    "bg-surface-800 text-surface-100 hover:bg-surface-700 active:bg-surface-600",
  ghost:
    "bg-transparent text-pitch-400 hover:bg-surface-800 active:bg-surface-700",
  danger:
    "bg-danger-500 text-white hover:bg-red-600 active:bg-red-700",
  google:
    "bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200",
  apple:
    "bg-black text-white hover:bg-gray-900 active:bg-gray-800 border border-surface-700",
};

export default function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        relative flex items-center justify-center gap-2
        rounded-xl px-5 py-3 text-sm font-semibold
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
