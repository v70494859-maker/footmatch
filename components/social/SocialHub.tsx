"use client";

import { useState } from "react";
import Link from "next/link";
import type { FriendshipWithProfile, Profile } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import FriendsList from "./FriendsList";
import FriendRequestCard from "./FriendRequestCard";
import SocialSidebar from "./SocialSidebar";
import ConversationItem from "@/components/messages/ConversationItem";
import NewConversationModal from "@/components/messages/NewConversationModal";

type Tab = "friends" | "messages";

interface SocialHubProps {
  userId: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  level: number;
  friendCount: number;
  matchesPlayed: number;
  pendingRequests: number;
  unreadMessages: number;
  friends: FriendshipWithProfile[];
  pendingFriendRequests: FriendshipWithProfile[];
  sentRequests: FriendshipWithProfile[];
  conversations: any[];
  friendsForDM: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">[];
}

export default function SocialHub({
  userId,
  profile,
  level,
  friendCount,
  matchesPlayed,
  pendingRequests,
  unreadMessages,
  friends: initialFriends,
  pendingFriendRequests: initialPending,
  sentRequests: initialSent,
  conversations,
  friendsForDM,
}: SocialHubProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState(initialFriends);
  const [pendingReqs, setPendingReqs] = useState(initialPending);
  const [sentReqs, setSentReqs] = useState(initialSent);
  const [friendsTab, setFriendsTab] = useState<"list" | "requests">("list");
  const [showNewConvModal, setShowNewConvModal] = useState(false);

  const getFriendProfile = (f: FriendshipWithProfile): Profile => {
    return f.requester_id === userId ? f.addressee : f.requester;
  };

  const handleAccept = (friendshipId: string) => {
    const accepted = pendingReqs.find((r) => r.id === friendshipId);
    if (accepted) {
      setPendingReqs((prev) => prev.filter((r) => r.id !== friendshipId));
      setFriends((prev) => [{ ...accepted, status: "accepted" }, ...prev]);
    }
  };

  const handleReject = (friendshipId: string) => {
    setPendingReqs((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const handleCancelSent = (friendshipId: string) => {
    setSentReqs((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const handleRemoveFriend = (friendshipId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "friends", label: t.social.friends.title, badge: pendingReqs.length > 0 ? pendingReqs.length : undefined },
    { key: "messages", label: t.social.messages.title, badge: unreadMessages > 0 ? unreadMessages : undefined },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block">
          <SocialSidebar
            profile={profile}
            level={level}
            friendCount={friendCount}
            matchesPlayed={matchesPlayed}
            pendingRequests={pendingRequests}
            unreadMessages={unreadMessages}
          />
        </aside>

        {/* CENTER */}
        <main className="min-w-0">
          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-surface-900 rounded-xl border border-surface-800 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-pitch-400/15 text-pitch-400"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pitch-400 text-surface-950 text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB: Friends */}
          {activeTab === "friends" && (
            <div>
              {/* Sub-tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFriendsTab("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    friendsTab === "list"
                      ? "bg-pitch-400/15 text-pitch-400"
                      : "bg-surface-900 text-surface-400 hover:text-surface-200 border border-surface-800"
                  }`}
                >
                  {t.social.friends.myFriends} ({friends.length})
                </button>
                <button
                  onClick={() => setFriendsTab("requests")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    friendsTab === "requests"
                      ? "bg-pitch-400/15 text-pitch-400"
                      : "bg-surface-900 text-surface-400 hover:text-surface-200 border border-surface-800"
                  }`}
                >
                  {t.social.friends.requests}
                  {pendingReqs.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-pitch-400 text-surface-950 text-[10px] font-bold">
                      {pendingReqs.length}
                    </span>
                  )}
                </button>
              </div>

              {friendsTab === "list" && (
                <FriendsList
                  userId={userId}
                  friends={friends}
                  getFriendProfile={getFriendProfile}
                  onRemoveFriend={handleRemoveFriend}
                />
              )}

              {friendsTab === "requests" && (
                <div className="space-y-6">
                  {pendingReqs.length > 0 && (
                    <div>
                      <h2 className="text-sm font-medium text-surface-400 mb-3">
                        {t.social.friends.pendingRequests}
                      </h2>
                      <div className="space-y-3">
                        {pendingReqs.map((req) => (
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

                  {sentReqs.length > 0 && (
                    <div>
                      <h2 className="text-sm font-medium text-surface-400 mb-3">
                        {t.social.friends.requestSent}
                      </h2>
                      <div className="space-y-3">
                        {sentReqs.map((req) => (
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

                  {pendingReqs.length === 0 && sentReqs.length === 0 && (
                    <p className="text-center text-surface-500 py-12">
                      {t.social.friends.noRequests}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: Messages */}
          {activeTab === "messages" && (
            <div>
              {/* New conversation button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowNewConvModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pitch-400 text-surface-950 text-sm font-semibold hover:bg-pitch-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t.social.messages.newConversation}
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="w-12 h-12 text-surface-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <p className="text-sm text-surface-500">{t.social.messages.noConversations}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      userId={userId}
                    />
                  ))}
                </div>
              )}

              {showNewConvModal && (
                <NewConversationModal
                  userId={userId}
                  friends={friendsForDM}
                  onClose={() => setShowNewConvModal(false)}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
