import { cookies } from "next/headers";
import translations, { type Locale, type Translations } from "./translations";

const DATE_LOCALES: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get("footmatch-locale")?.value as Locale | undefined;
  if (stored && stored in translations) return stored;
  return "fr";
}

export async function getTranslations(): Promise<Translations> {
  const locale = await getLocale();
  return translations[locale];
}

export async function getDateLocale(): Promise<string> {
  const locale = await getLocale();
  return DATE_LOCALES[locale];
}
