import { getTranslations } from "@/lib/i18n/server";
import CreateMatchForm from "@/components/operator/CreateMatchForm";

export const metadata = { title: "FootMatch Opérateur - Créer un match" };

export default async function CreateMatchPage() {
  const t = await getTranslations();

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t.operator.createMatchTitle}</h1>
          <p className="text-sm text-surface-400 mt-1">
            {t.operator.createMatchSubtitle}
          </p>
        </div>
        <CreateMatchForm />
      </div>
    </div>
  );
}
