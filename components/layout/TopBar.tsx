"use client";

import Logo from "@/components/ui/Logo";

export default function TopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <Logo variant="full" />
      </div>
    </header>
  );
}
