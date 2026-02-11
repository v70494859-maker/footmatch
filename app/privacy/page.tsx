import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: `FootMatch - ${t.privacy.title}` };
}

export default async function PrivacyPage() {
  const t = await getTranslations();
  const p = t.privacy;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-800">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0">
            <span className="text-xl font-extrabold text-pitch-400 tracking-tight">
              Foot
            </span>
            <span className="text-xl font-extrabold text-foreground tracking-tight">
              Match
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-surface-400 hover:text-foreground transition-colors"
          >
            &larr;
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {p.title}
        </h1>
        <p className="text-sm text-surface-500 mb-8">{p.lastUpdated}</p>

        <p className="text-base text-surface-300 leading-relaxed mb-10">
          {p.intro}
        </p>

        <div className="space-y-8">
          {p.sections.map(
            (
              section: {
                title: string;
                content: string;
                items?: string[];
              },
              i: number
            ) => (
              <section key={i}>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {section.title}
                </h2>
                <p className="text-sm text-surface-300 leading-relaxed">
                  {section.content}
                </p>
                {section.items && (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item: string, j: number) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-sm text-surface-400"
                      >
                        <span className="text-pitch-400 mt-1 shrink-0">
                          &#8226;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-surface-800 text-center">
          <p className="text-xs text-surface-500">
            FootMatch &mdash; Gen&egrave;ve, Suisse
          </p>
          <p className="text-xs text-surface-600 mt-1">
            contact@footmatch.ch
          </p>
        </div>
      </main>
    </div>
  );
}
