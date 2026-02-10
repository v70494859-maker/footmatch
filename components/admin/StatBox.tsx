import type { ReactNode } from "react";

interface StatBoxProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export default function StatBox({ icon, label, value }: StatBoxProps) {
  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-800 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <span className="text-surface-400 shrink-0">{icon}</span>
        <span className="text-xs font-medium text-surface-400 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground truncate">{value}</p>
    </div>
  );
}
