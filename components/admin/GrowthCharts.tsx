"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type DataPoint = { label: string; value: number };

interface ChartCardProps {
  title: string;
  data: DataPoint[];
  type: "area" | "bar";
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  total?: string;
  trend?: { value: number; label: string };
}

function ChartCard({
  title,
  data,
  type,
  color = "#4ade80",
  valuePrefix = "",
  valueSuffix = "",
  total,
  trend,
}: ChartCardProps) {
  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-surface-400">{title}</h3>
          {total && (
            <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
          )}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.value >= 0
                ? "bg-pitch-500/10 text-pitch-400"
                : "bg-danger-500/10 text-danger-400"
            }`}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: 12,
                }}
                formatter={(val) => [
                  `${valuePrefix}${val ?? 0}${valueSuffix}`,
                  "",
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title})`}
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: 12,
                }}
                formatter={(val) => [
                  `${valuePrefix}${val ?? 0}${valueSuffix}`,
                  "",
                ]}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export interface GrowthChartsProps {
  userGrowth: DataPoint[];
  matchActivity: DataPoint[];
  registrationActivity: DataPoint[];
  revenueGrowth: DataPoint[];
  userGrowthTotal: number;
  userGrowthTrend: number;
  matchTotal: number;
  matchTrend: number;
  registrationTotal: number;
  revenueTotal: string;
}

export default function GrowthCharts({
  userGrowth,
  matchActivity,
  registrationActivity,
  revenueGrowth,
  userGrowthTotal,
  userGrowthTrend,
  matchTotal,
  matchTrend,
  registrationTotal,
  revenueTotal,
}: GrowthChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartCard
        title={t.admin.usersChart}
        data={userGrowth}
        type="area"
        color="#4ade80"
        total={`${userGrowthTotal}`}
        trend={{ value: userGrowthTrend, label: "vs sem. préc." }}
      />
      <ChartCard
        title={t.common.matches}
        data={matchActivity}
        type="bar"
        color="#60a5fa"
        total={`${matchTotal}`}
        trend={{ value: matchTrend, label: "vs sem. préc." }}
      />
      <ChartCard
        title={t.common.matches}
        data={registrationActivity}
        type="area"
        color="#f59e0b"
        total={`${registrationTotal}`}
      />
      <ChartCard
        title={t.admin.revenueChart}
        data={revenueGrowth}
        type="area"
        color="#a78bfa"
        valuePrefix=""
        valueSuffix=" EUR"
        total={revenueTotal}
      />
    </div>
  );
}
