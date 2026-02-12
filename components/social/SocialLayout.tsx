"use client";

import type { PostWithDetails } from "@/types";
import ProfileWidget from "./ProfileWidget";
import ActivityWidget from "./ActivityWidget";
import SocialFeed from "./SocialFeed";

interface SocialLayoutProps {
  userId: string;
  isAdmin: boolean;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    city: string | null;
    origin_country: string | null;
    favorite_club: string | null;
  };
  level: number;
  totalXp: number;
  currentStreak: number;
  friendCount: number;
  teamCount: number;
  matchesPlayed: number;
  pendingRequests: number;
  unreadMessages: number;
  initialPosts: PostWithDetails[];
  pendingFriendRequests: { id: string; requester: { id: string; first_name: string; last_name: string; avatar_url: string | null } }[];
  recentChallenges: { id: string; challenger_team: { id: string; name: string; crest_url: string | null; crest_preset: string | null }; challenged_team: { id: string; name: string; crest_url: string | null; crest_preset: string | null }; status: string; created_at: string }[];
  trendingPosts: { id: string; caption: string | null; like_count: number; created_at: string }[];
}

export default function SocialLayout(props: SocialLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6">
        {/* Left: Profile (hidden on mobile) */}
        <aside className="hidden lg:block">
          <ProfileWidget
            profile={props.profile}
            level={props.level}
            totalXp={props.totalXp}
            currentStreak={props.currentStreak}
            friendCount={props.friendCount}
            teamCount={props.teamCount}
            matchesPlayed={props.matchesPlayed}
            pendingRequests={props.pendingRequests}
            unreadMessages={props.unreadMessages}
          />
        </aside>

        {/* Center: Feed */}
        <main className="min-w-0">
          <SocialFeed userId={props.userId} initialPosts={props.initialPosts} isAdmin={props.isAdmin} />
        </main>

        {/* Right: Activity (hidden on mobile) */}
        <aside className="hidden lg:block">
          <ActivityWidget
            pendingRequests={props.pendingFriendRequests}
            recentChallenges={props.recentChallenges}
            trendingPosts={props.trendingPosts}
            userId={props.userId}
          />
        </aside>
      </div>
    </div>
  );
}
