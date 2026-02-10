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
  uploadedText,
  clickText,
}: {
  label: string;
  description: string;
  file: File | null;
  existingUrl: string | null;
  onFileSelect: (file: File | null) => void;
  accept: string;
  uploadedText: string;
  clickText: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFile = file !== null || existingUrl !== null;
  const fileName = file?.name || (existingUrl ? uploadedText : null);

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
          {fileName || clickText}
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

  const hasIdDoc = idDocument !== null || application.id_document_url !== null;

  const ob = t.operatorOnboarding;

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

  const reasons = [
    {
      icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
      title: ob.docsReason1Title,
      desc: ob.docsReason1Desc,
    },
    {
      icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
      title: ob.docsReason2Title,
      desc: ob.docsReason2Desc,
    },
    {
      icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z",
      title: ob.docsReason3Title,
      desc: ob.docsReason3Desc,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-blue-500/10 via-surface-900 to-pitch-500/10 border border-surface-800 rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-pitch-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-pitch-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{ob.docsHeroTitle}</h1>
        <p className="text-surface-300 text-sm leading-relaxed max-w-sm mx-auto">
          {ob.docsHeroSubtitle}
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-pitch-400">{ob.docsStat1Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.docsStat1Label}</p>
          </div>
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-foreground">{ob.docsStat2Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.docsStat2Label}</p>
          </div>
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-pitch-400">{ob.docsStat3Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.docsStat3Label}</p>
          </div>
        </div>
      </div>

      {/* Why verify */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-surface-300">{ob.docsWhyVerify}</h2>
        <div className="space-y-4">
          {reasons.map((reason, i) => (
            <div key={i} className="flex gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-pitch-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={reason.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{reason.title}</p>
                <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{reason.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 rounded-2xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground">{ob.docsFormTitle}</h2>
          </div>

          {error && (
            <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
              <p className="text-danger-500 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <UploadBox
              label={`${ob.idDocument} *`}
              description={ob.docsIdDesc}
              file={idDocument}
              existingUrl={application.id_document_url}
              onFileSelect={setIdDocument}
              accept=".pdf,.jpg,.jpeg,.png"
              uploadedText={ob.docsAlreadyUploaded}
              clickText={ob.docsClickToUpload}
            />
            <UploadBox
              label={ob.docsCertLabel}
              description={ob.docsCertDesc}
              file={certDocument}
              existingUrl={application.cert_document_url}
              onFileSelect={setCertDocument}
              accept=".pdf,.jpg,.jpeg,.png"
              uploadedText={ob.docsAlreadyUploaded}
              clickText={ob.docsClickToUpload}
            />
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 justify-center text-xs text-surface-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            {ob.docsSecureNote}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/operator-onboarding/experience")}
            className="flex-1"
          >
            {ob.previous}
          </Button>
          <Button
            type="submit"
            disabled={!hasIdDoc}
            loading={saving}
            className="flex-1"
          >
            {ob.next}
          </Button>
        </div>
      </form>
    </div>
  );
}
