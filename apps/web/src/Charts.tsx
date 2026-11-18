import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "./api";

type Stats = {
  totalMinutes: number;
  totalSessions: number;
  bySubject: { subject: string; minutes: number }[];
  last7Days: { date: string; minutes: number }[];
};

const tooltipStyle = { backgroundColor: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" };

export default function Charts({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api("/stats").then(setStats).catch(() => setStats(null));
  }, [refreshKey]);

  if (!stats) return null;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
      <h2 className="text-xl font-semibold">Your stats</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {stats.totalMinutes} minutes studied in {stats.totalSessions} quests
      </p>

      <p className="mb-2 text-sm font-medium">Last 7 days (minutes)</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.last7Days}>
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.15)" }} />
            <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mb-2 mt-6 text-sm font-medium">By subject (minutes)</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.bySubject}>
            <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.15)" }} />
            <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}