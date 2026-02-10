import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import UsersTable from "@/components/admin/UsersTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Admin - Utilisateurs" };

const PER_PAGE = 20;

async function UsersStats() {
  const supabase = await createClient();
  const t = await getTranslations();

  const [
    { count: totalUsers },
    { count: totalPlayers },
    { count: totalOperators },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "player"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "operator"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const stats = [
    { label: t.admin.totalUsers, value: totalUsers ?? 0, color: "text-foreground" },
    { label: t.admin.player, value: totalPlayers ?? 0, color: "text-blue-400" },
    { label: t.admin.operators, value: totalOperators ?? 0, color: "text-pitch-400" },
    { label: `${t.admin.subscribers} ${t.admin.active}`, value: activeSubscriptions ?? 0, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-900 rounded-xl border border-surface-800 px-4 py-3"
        >
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

async function UsersData({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1"));

  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, city, role, created_at, subscriptions(status)", {
      count: "exact",
    });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,city.ilike.%${search}%`
    );
  }

  const { data: users, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  const rows = (users ?? []).map((u) => {
    const raw = u.subscriptions;
    const subs = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const hasActive = subs.some(
      (s: { status: string }) => s.status === "active"
    );
    return {
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      city: u.city,
      role: u.role,
      created_at: u.created_at,
      subscription_status: hasActive ? ("active" as const) : null,
    };
  });

  return <UsersTable users={rows} page={page} totalPages={totalPages} />;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const t = await getTranslations();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t.admin.users}</h1>
      <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="bg-surface-900 rounded-xl border border-surface-800 px-4 py-3 h-16 animate-pulse" />))}</div>}>
        <UsersStats />
      </Suspense>
      <Suspense fallback={<p className="text-surface-500 text-sm">{t.common.loading}</p>}>
        <UsersData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
