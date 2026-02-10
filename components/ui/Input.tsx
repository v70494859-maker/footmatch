"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-500 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-xl bg-surface-900 border border-surface-800
          px-4 py-3 text-sm text-foreground placeholder-surface-500
          outline-none transition-colors duration-150
          focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500
          ${error ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-danger-500">{error}</p>
      )}
    </div>
  );
}
