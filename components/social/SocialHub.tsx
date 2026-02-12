"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface SocialHubProps {
  pendingFriendRequests: number;
  teamCount: number;
  unreadMessages: number;
}

export default function SocialHub({ pendingFriendRequests, teamCount, unreadMessages }: SocialHubProps) {
  const { t } = useTranslation();

  const sections = [
    {
      href: "/social/friends",
      title: t.social.friends.title,
      description: t.social.friends.myFriends,
      badge: pendingFriendRequests > 0 ? pendingFriendRequests : null,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      href: "/social/teams",
      title: t.social.teams.title,
      description: `${teamCount} ${teamCount === 1 ? "team" : "teams"}`,
      badge: null,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      href: "/social/messages",
      title: t.social.messages.title,
      description: t.social.messages.noConversations,
      badge: unreadMessages > 0 ? unreadMessages : null,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
    },
    {
      href: "/social/feed",
      title: t.social.feed.title,
      description: t.social.feed.noPosts,
      badge: null,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-50 mb-6">{t.social.hub}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative bg-surface-900 border border-surface-800 rounded-2xl p-5 hover:border-surface-700 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="text-pitch-400">{section.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-surface-100 group-hover:text-pitch-400 transition-colors">
                    {section.title}
                  </h2>
                  {section.badge && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-400 text-surface-950 text-xs font-bold">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-surface-400 mt-1">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
