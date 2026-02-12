// ─── Enums ───────────────────────────────────────────────

export type UserRole = "player" | "operator" | "admin";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete" | "trialing";

export type MatchStatus = "upcoming" | "full" | "in_progress" | "completed" | "canceled";

export type ApplicationStatus = "draft" | "pending" | "approved" | "rejected";

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export type TerrainType = "indoor" | "outdoor" | "covered";

export type RegistrationStatus = "confirmed" | "canceled";

export type MessageType = "text" | "image" | "voice";

export type MatchQuality = "excellent" | "good" | "average" | "poor";

export type Team = "A" | "B";

export type NotificationType =
  | "match_created"
  | "registration_confirmed"
  | "registration_canceled"
  | "match_canceled"
  | "match_full"
  | "subscription_activated"
  | "subscription_canceled"
  | "application_approved"
  | "application_rejected"
  | "payout_completed"
  | "match_results_available"
  | "match_mvp"
  | "xp_earned"
  | "level_up"
  | "badge_unlocked"
  | "friend_request"
  | "friend_accepted"
  | "team_invite"
  | "team_joined"
  | "new_message"
  | "post_liked"
  | "post_commented"
  | "challenge_received"
  | "challenge_accepted"
  | "challenge_declined";

// ─── Social Enums ────────────────────────────────────────

export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked";

export type TeamRole = "captain" | "co_captain" | "member";

export type TeamInvitationStatus = "pending" | "accepted" | "rejected";

export type ConversationType = "direct" | "group";

export type DirectMessageType = "text" | "image" | "voice";

export type PostVisibility = "public" | "friends" | "team";

export type PostMediaType = "image" | "video";

export type ChallengeStatus = "proposed" | "accepted" | "declined" | "scheduled" | "in_progress" | "completed" | "canceled";

// ─── Labels ──────────────────────────────────────────────

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  player: "Joueur",
  operator: "Organisateur",
  admin: "Admin",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  upcoming: "À venir",
  full: "Complet",
  in_progress: "En cours",
  completed: "Terminé",
  canceled: "Annulé",
};

export const MATCH_STATUS_STYLES: Record<MatchStatus, string> = {
  upcoming: "bg-pitch-500/10 text-pitch-400",
  full: "bg-amber-500/10 text-amber-500",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-surface-600/20 text-surface-400",
  canceled: "bg-danger-500/10 text-danger-500",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Actif",
  past_due: "Impayé",
  canceled: "Annulé",
  incomplete: "Incomplet",
  trialing: "Essai",
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Terminé",
  failed: "Échoué",
};

export const TERRAIN_TYPE_LABELS: Record<TerrainType, string> = {
  indoor: "Intérieur",
  outdoor: "Extérieur",
  covered: "Couvert",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  confirmed: "Confirmé",
  canceled: "Annulé",
};

export const MATCH_QUALITY_LABELS: Record<MatchQuality, string> = {
  excellent: "Excellent",
  good: "Bon",
  average: "Moyen",
  poor: "Médiocre",
};

export const TEAM_LABELS: Record<Team, string> = {
  A: "Équipe A",
  B: "Équipe B",
};

// ─── Entities ────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string;
  country: string | null;
  city: string | null;
  origin_country: string | null;
  role: UserRole;
  avatar_url: string | null;
  favorite_club: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  player_id: string;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Operator {
  id: string;
  profile_id: string;
  bio: string | null;
  rating: number;
  total_matches: number;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorApplication {
  id: string;
  profile_id: string;
  status: ApplicationStatus;
  phone: string | null;
  city: string | null;
  years_experience: number | null;
  description: string | null;
  certifications: string | null;
  id_document_url: string | null;
  cert_document_url: string | null;
  terms_accepted: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  operator_id: string;
  title: string;
  terrain_type: TerrainType;
  date: string;
  start_time: string;
  duration_minutes: number;
  venue_name: string;
  venue_address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  capacity: number;
  registered_count: number;
  status: MatchStatus;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRegistration {
  id: string;
  match_id: string;
  player_id: string;
  status: RegistrationStatus;
  created_at: string;
}

export interface OperatorPayout {
  id: string;
  operator_id: string;
  period_start: string;
  period_end: string;
  total_registrations: number;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
}

export interface PlatformConfig {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  media_url: string | null;
  media_duration: number | null;
  created_at: string;
}

export interface MatchResult {
  id: string;
  match_id: string;
  operator_id: string;
  score_team_a: number;
  score_team_b: number;
  duration_minutes: number;
  match_quality: MatchQuality;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface MatchPlayerStats {
  id: string;
  match_id: string;
  user_id: string;
  team: Team | null;
  goals: number;
  assists: number;
  attended: boolean;
  mvp: boolean;
  yellow_card: boolean;
  red_card: boolean;
  rating: number | null;
}

export interface PlayerCareerStats {
  user_id: string;
  total_matches: number;
  total_goals: number;
  total_assists: number;
  total_mvp: number;
  total_yellow_cards: number;
  total_red_cards: number;
  win_count: number;
  draw_count: number;
  loss_count: number;
  attendance_rate: number;
  last_updated: string;
}

export interface PlayerGamification {
  user_id: string;
  total_xp: number;
  level: number;
  level_name: string;
  current_streak: number;
  best_streak: number;
  last_match_week: string | null;
  cities_played: string[];
  xp_today: number;
  xp_today_date: string;
  created_at: string;
  updated_at: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  source: string;
  xp_amount: number;
  match_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type BadgeTier = "bronze" | "silver" | "gold";
export type BadgeCategory = "volume" | "exploration" | "social" | "reliability" | "special";

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  category: BadgeCategory;
  tier: BadgeTier;
  unlocked_at: string;
}

export interface BadgeProgress {
  user_id: string;
  badge_id: string;
  current: number;
  target: number;
  updated_at: string;
}

// ─── Join types ──────────────────────────────────────────

export interface MatchWithOperator extends Match {
  operator: Operator & { profile: Profile };
}

export interface MatchRegistrationWithProfile extends MatchRegistration {
  profile: Profile;
}

export interface MatchRegistrationWithMatch extends MatchRegistration {
  match: Match;
}

export interface MatchRegistrationWithMatchOperator extends MatchRegistration {
  match: MatchWithOperator;
}

export interface OperatorApplicationWithProfile extends OperatorApplication {
  profile: Profile;
}

export interface OperatorWithProfile extends Operator {
  profile: Profile;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: Profile;
}

export interface MatchPlayerStatsWithProfile extends MatchPlayerStats {
  profile: Profile;
}

export interface MatchResultWithStats extends MatchResult {
  match_player_stats: MatchPlayerStatsWithProfile[];
}

export interface PlayerMatchHistory extends MatchPlayerStats {
  match: Match;
  match_result: MatchResult | null;
}

// ─── Form types ──────────────────────────────────────────

export interface OnboardingFormData {
  first_name: string;
  last_name: string;
  country: string;
  city: string;
  origin_country: string;
  favorite_club: string;
}

export interface PlayerStatsFormEntry {
  user_id: string;
  profile: Profile;
  team: Team | null;
  goals: number;
  assists: number;
  attended: boolean;
  mvp: boolean;
  yellow_card: boolean;
  red_card: boolean;
}

export interface SubmitResultsPayload {
  match_id: string;
  operator_id: string;
  score_team_a: number;
  score_team_b: number;
  duration_minutes: number;
  match_quality: MatchQuality;
  notes: string;
  player_stats: Omit<PlayerStatsFormEntry, "profile">[];
}

export interface CreateMatchFormData {
  title: string;
  terrain_type: TerrainType;
  date: string;
  start_time: string;
  duration_minutes: number;
  venue_name: string;
  venue_address: string;
  city: string;
  capacity: number;
  description: string;
}

// ─── Social Entities ─────────────────────────────────────

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendshipWithProfile extends Friendship {
  requester: Profile;
  addressee: Profile;
}

export interface SocialTeam {
  id: string;
  name: string;
  description: string | null;
  crest_url: string | null;
  crest_preset: string | null;
  captain_id: string;
  city: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  profile: Profile;
}

export interface TeamWithMembers extends SocialTeam {
  team_members: TeamMemberWithProfile[];
  captain: Profile;
}

export interface TeamCharter {
  id: string;
  user_id: string;
  signed_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  status: TeamInvitationStatus;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitationWithDetails extends TeamInvitation {
  team: SocialTeam;
  inviter: Profile;
  invitee: Profile;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  muted: boolean;
  joined_at: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: DirectMessageType;
  content: string | null;
  media_url: string | null;
  reply_to_id: string | null;
  created_at: string;
}

export interface DirectMessageWithSender extends DirectMessage {
  sender: Profile;
}

export interface ConversationWithParticipants extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  last_message?: DirectMessage | null;
}

export interface Post {
  id: string;
  author_id: string;
  caption: string | null;
  visibility: PostVisibility;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_type: PostMediaType;
  media_url: string;
  thumbnail_url: string | null;
  sort_order: number;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface PostWithDetails extends Post {
  author: Profile;
  post_media: PostMedia[];
  user_has_liked?: boolean;
}

export interface PostCommentWithAuthor extends PostComment {
  author: Profile;
}

export interface TeamChallenge {
  id: string;
  challenger_team_id: string;
  challenged_team_id: string;
  status: ChallengeStatus;
  proposed_date: string | null;
  proposed_venue: string | null;
  match_id: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamChallengeWithTeams extends TeamChallenge {
  challenger_team: SocialTeam;
  challenged_team: SocialTeam;
}
