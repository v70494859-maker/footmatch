"use client";

import { useState } from "react";
import type { Profile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CitySelect from "@/components/ui/CitySelect";
import OriginSelect from "@/components/ui/OriginSelect";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import ClubPicker from "@/components/profile/ClubPicker";

interface ProfileEditFormProps {
  profile: Profile;
  onSave: (updated: Profile) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const supabase = createClient();
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [country, setCountry] = useState(profile.country ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [originCountry, setOriginCountry] = useState(profile.origin_country ?? "");
  const [favoriteClub, setFavoriteClub] = useState(profile.favorite_club ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);

    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      country: country || null,
      city: city || null,
      origin_country: originCountry || null,
      favorite_club: favoriteClub,
    };

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);

    if (updateError) {
      setError("Erreur : " + updateError.message);
      return;
    }

    onSave(updated as Profile);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar preview */}
      <div className="flex justify-center">
        <ProfileAvatar
          firstName={firstName || profile.first_name}
          lastName={lastName || profile.last_name}
          country={originCountry || profile.origin_country}
          clubSlug={favoriteClub}
          size="lg"
        />
      </div>

      <div className="space-y-4">
        <Input
          label="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Votre prénom"
        />
        <Input
          label="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Votre nom"
        />
        <CitySelect
          label="Lieu de résidence"
          country={country}
          city={city}
          onCountryChange={setCountry}
          onCityChange={setCity}
        />
        <OriginSelect
          value={originCountry}
          onChange={setOriginCountry}
        />
        <ClubPicker
          value={favoriteClub}
          onChange={setFavoriteClub}
        />
      </div>

      {error && (
        <p className="text-sm text-danger-500 text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          loading={saving}
          className="flex-1"
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
