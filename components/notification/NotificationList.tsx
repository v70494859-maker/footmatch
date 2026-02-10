"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";
import NotificationItem from "@/components/notification/NotificationItem";

interface NotificationListProps {
  initialNotifications: Notification[];
  userId: string;
}

export default function NotificationList({
  initialNotifications,
  userId,
}: NotificationListProps) {
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  useEffect(() => {
    const channel = supabase
      .channel(`notifs:${userId}`)
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
          setNotifications((prev) => [notif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  async function handleClick(notif: Notification) {
    if (!notif.read) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }

    if (notif.data?.matchId) {
      router.push(`/matches/${notif.data.matchId}`);
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groups: { label: string; items: Notification[] }[] = [];
  const todayItems: Notification[] = [];
  const yesterdayItems: Notification[] = [];
  const olderItems: Notification[] = [];

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    if (d === today) todayItems.push(n);
    else if (d === yesterday) yesterdayItems.push(n);
    else olderItems.push(n);
  }

  if (todayItems.length > 0) groups.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length > 0)
    groups.push({ label: "Yesterday", items: yesterdayItems });
  if (olderItems.length > 0)
    groups.push({ label: "Older", items: olderItems });

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-pitch-400 hover:text-pitch-300"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <svg
              className="w-12 h-12 text-surface-600 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <p className="text-surface-500 text-sm">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wider text-surface-400 px-4 py-2">
                  {group.label}
                </p>
                {group.items.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    type={notif.type}
                    title={notif.title}
                    body={notif.body}
                    read={notif.read}
                    createdAt={notif.created_at}
                    onClick={() => handleClick(notif)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
