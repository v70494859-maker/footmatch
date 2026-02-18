"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import StatsSection from "@/components/landing/StatsSection";
import PricingSection from "@/components/landing/PricingSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FooterSection from "@/components/landing/FooterSection";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-surface-950/60 backdrop-blur-2xl border-b border-white/[0.04] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo variant="full" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm font-medium text-surface-400 hover:text-foreground transition-colors"
            >
              {t.header.login}
            </Link>
          </div>
        </div>
      </header>

      {/* Sections */}
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <HowItWorksSection />
      <FooterSection />
    </div>
  );
}
