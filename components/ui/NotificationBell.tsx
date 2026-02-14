"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Notification, NotificationType } from "@/types";
import NotificationItem from "@/components/notification/NotificationItem";

interface NotificationBellProps {
  align?: "left" | "right";
}

export default function NotificationBell({ align = "right" }: NotificationBellProps) {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch user + initial notifications
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setNotifications(data ?? []);
    })();
  }, [supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif-bell:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleNotifClick(notif: Notification) {
    if (!notif.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setOpen(false);

    // Navigate based on notification type
    const route = getNotificationRoute(notif);
    if (route) router.push(route);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute top-10 w-80 max-h-96 overflow-y-auto bg-surface-900 border border-surface-800 rounded-2xl shadow-xl z-50 ${align === "left" ? "left-0" : "right-0"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
            <span className="text-sm font-bold text-surface-100">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-surface-500">{unreadCount} new</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-surface-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-800/50">
              {notifications.slice(0, 8).map((notif) => (
                <NotificationItem
                  key={notif.id}
                  type={notif.type}
                  title={notif.title}
                  body={notif.body}
                  read={notif.read}
                  createdAt={notif.created_at}
                  onClick={() => handleNotifClick(notif)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getNotificationRoute(notif: Notification): string | null {
  const d = notif.data ?? {};
  const type = notif.type as NotificationType;

  if (d.matchId) return `/matches/${d.matchId}`;
  if (type === "friend_request" || type === "friend_accepted") return "/social/friends";
  if (type === "team_invite" || type === "team_joined") return "/teams";
  if (type === "new_message" && d.conversationId) return `/social/messages/${d.conversationId}`;
  if (type === "post_liked" || type === "post_commented") return "/social";
  if (type === "challenge_received" || type === "challenge_accepted" || type === "challenge_declined") return "/teams";
  if (type === "subscription_activated" || type === "subscription_canceled") return "/subscription";
  if (type === "payout_completed") return "/operator/payouts";
  if (type === "application_approved" || type === "application_rejected") return "/operator";

  return null;
}
