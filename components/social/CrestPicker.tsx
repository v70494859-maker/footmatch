"use client";

import { useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const PRESET_COLORS = [
  { key: "red", bg: "bg-red-600", label: "Red" },
  { key: "blue", bg: "bg-blue-600", label: "Blue" },
  { key: "green", bg: "bg-green-600", label: "Green" },
  { key: "yellow", bg: "bg-yellow-500", label: "Yellow" },
  { key: "purple", bg: "bg-purple-600", label: "Purple" },
  { key: "orange", bg: "bg-orange-500", label: "Orange" },
  { key: "pink", bg: "bg-pink-500", label: "Pink" },
  { key: "cyan", bg: "bg-cyan-500", label: "Cyan" },
];

interface CrestPickerProps {
  teamName: string;
  crestUrl: string | null;
  crestPreset: string | null;
  onCrestUrlChange: (url: string | null) => void;
  onCrestPresetChange: (preset: string | null) => void;
}

export default function CrestPicker({
  teamName,
  crestUrl,
  crestPreset,
  onCrestUrlChange,
  onCrestPresetChange,
}: CrestPickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const initials = teamName
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePresetSelect = (key: string) => {
    onCrestPresetChange(key);
    onCrestUrlChange(null);
    setUploadError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Max 2 MB");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `crests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("team-crests")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("team-crests")
      .getPublicUrl(path);

    onCrestUrlChange(urlData.publicUrl);
    onCrestPresetChange(null);
    setUploading(false);
  };

  const handleClearUpload = () => {
    onCrestUrlChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedPreset = PRESET_COLORS.find((p) => p.key === crestPreset);

  return (
    <div className="space-y-4">
      {/* Current preview */}
      <div className="flex items-center gap-4">
        {crestUrl ? (
          <div className="relative">
            <img
              src={crestUrl}
              alt="Crest"
              className="w-16 h-16 rounded-xl object-cover"
            />
            <button
              onClick={handleClearUpload}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-200 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              selectedPreset?.bg ?? "bg-pitch-900"
            }`}
          >
            <span className={`text-xl font-bold ${selectedPreset ? "text-white" : "text-pitch-400"}`}>
              {initials || "?"}
            </span>
          </div>
        )}

        <div className="flex-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-surface-800 text-surface-300 text-xs font-medium rounded-lg hover:bg-surface-700 transition-colors disabled:opacity-50"
          >
            {uploading ? "..." : t.social.teams.uploadCrest}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploadError && (
            <p className="text-xs text-red-400 mt-1">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Preset grid */}
      <div>
        <p className="text-xs font-medium text-surface-500 mb-2">
          {t.social.teams.presetCrests}
        </p>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetSelect(preset.key)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${preset.bg} ${
                crestPreset === preset.key && !crestUrl
                  ? "ring-2 ring-pitch-400 ring-offset-2 ring-offset-surface-950"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <span className="text-xs font-bold text-white">
                {initials || "?"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
