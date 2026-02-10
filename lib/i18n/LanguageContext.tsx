"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import translations, { type Locale, type Translations } from "./translations";

export const DATE_LOCALES: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  dateLocale: string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const router = useRouter();

  useEffect(() => {
    const stored = (getCookie("footmatch-locale") ||
      localStorage.getItem("footmatch-locale")) as Locale | null;
    if (stored && stored in translations) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("footmatch-locale", l);
    document.cookie = `footmatch-locale=${l};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale], dateLocale: DATE_LOCALES[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
