interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

export default function Logo({ variant = "full", className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon: stylized ball */}
      <div className="relative w-8 h-8 rounded-xl bg-pitch-400 flex items-center justify-center shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-5 h-5 text-white"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3l2 4.5L18 9l-3 3 1 5h-4.5L9 15l-3-1 1.5-4.5L5 6z" />
        </svg>
      </div>
      {variant === "full" && (
        <span className="text-lg font-bold text-foreground tracking-tight">
          Foot<span className="text-pitch-500">Match</span>
        </span>
      )}
    </div>
  );
}
