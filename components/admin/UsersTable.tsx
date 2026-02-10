"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { type Column } from "@/components/admin/DataTable";
import { USER_ROLE_LABELS, type UserRole } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  role: UserRole;
  created_at: string;
  subscription_status: "active" | null;
}

const ROLE_COLORS: Record<UserRole, string> = {
  player: "bg-surface-700/50 text-surface-300",
  operator: "bg-pitch-500/10 text-pitch-400",
  admin: "bg-amber-500/10 text-amber-500",
};

function SubscriptionAction({
  userId,
  role,
  status,
}: {
  userId: string;
  role: UserRole;
  status: "active" | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (role !== "player") return <span className="text-surface-600 text-xs">--</span>;

  async function handleGrant() {
    setLoading(true);
    await fetch("/api/admin/grant-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: userId }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleRevoke() {
    setLoading(true);
    await fetch("/api/admin/grant-subscription", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: userId }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status === "active") {
    return (
      <button
        type="button"
        onClick={handleRevoke}
        disabled={loading}
        className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-danger-500/10 text-danger-500 hover:bg-danger-500/20 transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Révoquer"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGrant}
      disabled={loading}
      className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-pitch-500/10 text-pitch-400 hover:bg-pitch-500/20 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Accorder"}
    </button>
  );
}

interface UsersTableProps {
  users: UserRow[];
  page: number;
  totalPages: number;
}

export default function UsersTable({ users, page, totalPages }: UsersTableProps) {
  const { t } = useTranslation();

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      label: "Nom",
      render: (row) => (
        <span className="text-foreground font-medium">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: "city",
      label: "Ville",
      render: (row) => row.city ?? "--",
    },
    {
      key: "role",
      label: t.admin.role,
      render: (row) => (
        <span
          className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 ${ROLE_COLORS[row.role]}`}
        >
          {USER_ROLE_LABELS[row.role]}
        </span>
      ),
    },
    {
      key: "subscription",
      label: t.admin.subscribers,
      render: (row) => {
        if (row.role !== "player") return <span className="text-surface-600 text-xs">--</span>;
        return row.subscription_status === "active" ? (
          <span className="text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 bg-pitch-500/10 text-pitch-400">
            {t.admin.active}
          </span>
        ) : (
          <span className="text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 bg-surface-700/50 text-surface-400">
            {t.common.none}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <SubscriptionAction
          userId={row.id}
          role={row.role}
          status={row.subscription_status}
        />
      ),
    },
    {
      key: "created_at",
      label: t.admin.joinedOn,
      render: (row) =>
        new Date(row.created_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      searchPlaceholder={`${t.common.search}...`}
      page={page}
      totalPages={totalPages}
      basePath="/admin/users"
    />
  );
}
