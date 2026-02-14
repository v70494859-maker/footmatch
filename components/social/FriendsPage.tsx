"use client";

import { useState } from "react";
import type { FriendshipWithProfile, Profile } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import FriendsList from "./FriendsList";
import FriendRequestCard from "./FriendRequestCard";

interface FriendsPageProps {
  userId: string;
  friends: FriendshipWithProfile[];
  pendingRequests: FriendshipWithProfile[];
  sentRequests: FriendshipWithProfile[];
  friendMatchesMap: Record<string, any[]>;
  myRegisteredMatchIds: string[];
}

export default function FriendsPage({ userId, friends: initialFriends, pendingRequests: initialPending, sentRequests: initialSent, friendMatchesMap, myRegisteredMatchIds }: FriendsPageProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState(initialFriends);
  const [pendingRequests, setPendingRequests] = useState(initialPending);
  const [sentRequests, setSentRequests] = useState(initialSent);

  const getFriendProfile = (f: FriendshipWithProfile): Profile => {
    return f.requester_id === userId ? f.addressee : f.requester;
  };

  const handleAccept = (friendshipId: string) => {
    const accepted = pendingRequests.find((r) => r.id === friendshipId);
    if (accepted) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
      setFriends((prev) => [{ ...accepted, status: "accepted" }, ...prev]);
    }
  };

  const handleReject = (friendshipId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const handleCancelSent = (friendshipId: string) => {
    setSentRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const handleRemoveFriend = (friendshipId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-50 mb-6">{t.social.friends.title}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === "friends" ? "bg-surface-800 text-surface-50" : "text-surface-400 hover:text-surface-200"
          }`}
        >
          {t.social.friends.myFriends} ({friends.length})
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors relative ${
            tab === "requests" ? "bg-surface-800 text-surface-50" : "text-surface-400 hover:text-surface-200"
          }`}
        >
          {t.social.friends.requests}
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pitch-400 text-surface-950 text-[10px] font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {tab === "friends" && (
        <FriendsList
          userId={userId}
          friends={friends}
          getFriendProfile={getFriendProfile}
          onRemoveFriend={handleRemoveFriend}
          friendMatchesMap={friendMatchesMap}
          myRegisteredMatchIds={myRegisteredMatchIds}
        />
      )}

      {tab === "requests" && (
        <div className="space-y-6">
          {/* Pending (incoming) */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-surface-400 mb-3">{t.social.friends.pendingRequests}</h2>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <FriendRequestCard
                    key={req.id}
                    friendship={req}
                    profile={req.requester}
                    type="incoming"
                    onAccept={() => handleAccept(req.id)}
                    onReject={() => handleReject(req.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sent (outgoing) */}
          {sentRequests.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-surface-400 mb-3">{t.social.friends.requestSent}</h2>
              <div className="space-y-3">
                {sentRequests.map((req) => (
                  <FriendRequestCard
                    key={req.id}
                    friendship={req}
                    profile={req.addressee}
                    type="outgoing"
                    onCancel={() => handleCancelSent(req.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && sentRequests.length === 0 && (
            <p className="text-center text-surface-500 py-12">{t.social.friends.noRequests}</p>
          )}
        </div>
      )}
    </div>
  );
}
