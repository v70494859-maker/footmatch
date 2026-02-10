"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { OperatorApplication } from "@/types";
import Button from "@/components/ui/Button";

interface Props {
  application: OperatorApplication;
}

function UploadBox({
  label,
  description,
  file,
  existingUrl,
  onFileSelect,
  accept,
}: {
  label: string;
  description: string;
  file: File | null;
  existingUrl: string | null;
  onFileSelect: (file: File | null) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFile = file !== null || existingUrl !== null;
  const fileName = file?.name || (existingUrl ? "Déjà téléchargé" : null);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-surface-500 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`
          w-full rounded-xl border-2 border-dashed p-6
          flex flex-col items-center gap-2 transition-colors duration-150
          ${
            hasFile
              ? "border-pitch-500/40 bg-pitch-500/5"
              : "border-surface-700 bg-surface-900 hover:border-surface-600"
          }
        `}
      >
        {hasFile ? (
          <svg
            className="w-8 h-8 text-pitch-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        ) : (
          <svg
            className="w-8 h-8 text-surface-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
        )}
        <span
          className={`text-sm ${hasFile ? "text-pitch-400" : "text-surface-400"}`}
        >
          {fileName || "Cliquez pour télécharger"}
        </span>
        <span className="text-xs text-surface-500">{description}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          onFileSelect(selected);
        }}
      />
    </div>
  );
}

export default function DocumentsForm({ application }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [certDocument, setCertDocument] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // At least the ID document must be uploaded (or already exist)
  const hasIdDoc = idDocument !== null || application.id_document_url !== null;

  async function uploadFile(
    file: File,
    folder: string
  ): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${application.profile_id}/${folder}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updates: Partial<OperatorApplication> = {};

      if (idDocument) {
        updates.id_document_url = await uploadFile(idDocument, "id");
      }

      if (certDocument) {
        updates.cert_document_url = await uploadFile(certDocument, "cert");
      }

      // Only update if there are new uploads
      if (Object.keys(updates).length > 0) {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from("operator_applications")
          .update(updates)
          .eq("id", application.id);

        if (updateError) throw updateError;
      }

      router.push("/operator-onboarding/terms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface-900 rounded-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-pitch-500/10 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-pitch-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.operatorOnboarding.documents}</h1>
          <p className="text-surface-400 text-sm">
            {t.operatorOnboarding.uploadId}
          </p>
        </div>

        {error && (
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
            <p className="text-danger-500 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <UploadBox
            label={`${t.operatorOnboarding.idDocument} *`}
            description="Passeport, carte d'identité ou permis de conduire (PDF, JPG, PNG)"
            file={idDocument}
            existingUrl={application.id_document_url}
            onFileSelect={setIdDocument}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <UploadBox
            label="Document de certification (optionnel)"
            description="Licence d'entraîneur, certificat de premiers secours, etc."
            file={certDocument}
            existingUrl={application.cert_document_url}
            onFileSelect={setCertDocument}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/operator-onboarding/experience")}
          className="flex-1"
        >
          {t.operatorOnboarding.previous}
        </Button>
        <Button
          type="submit"
          disabled={!hasIdDoc}
          loading={saving}
          className="flex-1"
        >
          {t.operatorOnboarding.next}
        </Button>
      </div>
    </form>
  );
}
