"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function FooterSection() {
  const { t } = useTranslation();

  const links = [
    { label: t.footer.matches, href: "/matches" },
    { label: t.footer.becomeOperator, href: "/operator-onboarding" },
    { label: t.footer.login, href: "/login" },
  ];

  return (
    <footer className="border-t border-surface-800">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Logo variant="full" />

          {/* Links */}
          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-surface-400 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-surface-800">
          <p className="text-xs text-surface-500 text-center">
            &copy; {new Date().getFullYear()} FootMatch. {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
