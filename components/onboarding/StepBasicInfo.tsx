"use client";

import type { OnboardingFormData } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CitySelect from "@/components/ui/CitySelect";
import OriginSelect from "@/components/ui/OriginSelect";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import ClubPicker from "@/components/profile/ClubPicker";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface Props {
  data: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  onSubmit: () => void;
  saving: boolean;
}

export default function StepBasicInfo({
  data,
  onChange,
  onSubmit,
  saving,
}: Props) {
  const { t } = useTranslation();
  const isValid =
    data.first_name.trim().length > 0 && data.last_name.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{t.onboarding.yourProfile}</h1>
        <p className="text-surface-400 text-sm">
          {t.onboarding.tellUs}
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center">
        <ProfileAvatar
          firstName={data.first_name || "?"}
          lastName={data.last_name || "?"}
          country={data.origin_country || null}
          clubSlug={data.favorite_club || null}
          size="lg"
        />
      </div>

      <div className="space-y-4">
        <Input
          label={t.operatorOnboarding.firstName}
          value={data.first_name}
          onChange={(e) => onChange({ first_name: e.target.value })}
          placeholder={t.operatorOnboarding.firstName}
          required
        />
        <Input
          label={t.operatorOnboarding.lastName}
          value={data.last_name}
          onChange={(e) => onChange({ last_name: e.target.value })}
          placeholder={t.operatorOnboarding.lastName}
          required
        />

        {/* City dropdown */}
        <CitySelect
          label={t.onboarding.residence}
          country={data.country}
          city={data.city}
          onCountryChange={(country) => onChange({ country })}
          onCityChange={(city) => onChange({ city })}
        />

        {/* Origin country */}
        <OriginSelect
          value={data.origin_country}
          onChange={(origin_country) => onChange({ origin_country })}
        />
        <ClubPicker
          value={data.favorite_club || null}
          onChange={(favorite_club) => onChange({ favorite_club: favorite_club ?? "" })}
        />
      </div>

      <Button onClick={onSubmit} disabled={!isValid} loading={saving} fullWidth>
        {t.onboarding.createProfile}
      </Button>
    </div>
  );
}
