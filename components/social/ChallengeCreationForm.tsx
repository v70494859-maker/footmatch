"use client";

import { useState, useEffect } from "react";
import type { SocialTeam, TeamChallengeWithTeams } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface ChallengeCreationFormProps {
  teamId: string;
  onCreated: (challenge: TeamChallengeWithTeams) => void;
  onCancel: () => void;
}

export default function ChallengeCreationForm({ teamId, onCreated, onCancel }: ChallengeCreationFormProps) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<SocialTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("teams")
        .select("*")
        .neq("id", teamId)
        .order("name");
      setTeams(data ?? []);
      setLoadingTeams(false);
    };
    fetchTeams();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_challenges")
      .insert({
        challenger_team_id: teamId,
        challenged_team_id: selectedTeamId,
        status: "proposed",
        proposed_date: date || null,
        proposed_venue: venue || null,
        message: message || null,
      })
      .select("*, challenger_team:teams!team_challenges_challenger_team_id_fkey(id, name, crest_url, crest_preset, member_count), challenged_team:teams!team_challenges_challenged_team_id_fkey(id, name, crest_url, crest_preset, member_count)")
      .single();

    if (data && !error) {
      onCreated(data as TeamChallengeWithTeams);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-900 border border-surface-800 rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-surface-200">{t.social.challenges.createChallenge}</h3>

      {/* Select team */}
      <div>
        <label className="block text-xs text-surface-400 mb-1">{t.social.challenges.selectTeam}</label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          required
          className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100 focus:outline-none focus:border-pitch-500"
        >
          <option value="">{t.social.challenges.selectTeam}...</option>
          {loadingTeams ? (
            <option disabled>{t.common.loading}</option>
          ) : (
            teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name} ({team.member_count} {t.social.teams.member}s)</option>
            ))
          )}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs text-surface-400 mb-1">{t.social.challenges.proposedDate}</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100 focus:outline-none focus:border-pitch-500"
        />
      </div>

      {/* Venue */}
      <div>
        <label className="block text-xs text-surface-400 mb-1">{t.social.challenges.venue}</label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder={t.social.challenges.venue}
          className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs text-surface-400 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="..."
          className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || !selectedTeamId}
          className="px-4 py-2 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-lg hover:bg-pitch-300 transition-colors disabled:opacity-50"
        >
          {t.social.challenges.challengeTeam}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-surface-800 text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-700 transition-colors"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
