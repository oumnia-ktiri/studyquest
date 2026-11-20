import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";

type Row = { rank: number; name: string; level: number; xp: number; isMe: boolean };
type Data = { weekStart: string; top: Row[]; me: Row | null };

const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

export default function Leaderboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/leaderboard").then(setData).catch((e) => setError((e as Error).message));
  }, []);

  const card = "rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Leaderboard</h1>
        <Link to="/" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Back to dashboard</Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <div className={card}>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            XP earned since Monday {data.weekStart} (UTC)
          </p>

          {data.top.length === 0 && (
            <p className="text-slate-400">Nobody has finished a quest this week. Be the first!</p>
          )}

          <ul className="space-y-2">
            {data.top.map((r) => (
              <li
                key={r.rank}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  r.isMe ? "bg-indigo-100 dark:bg-indigo-900/40" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 text-center">{medal(r.rank)}</span>
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Lv {r.level}</span>
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{r.xp} XP</span>
              </li>
            ))}
          </ul>

          {data.me && data.me.rank > 10 && (
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Your rank: #{data.me.rank} with {data.me.xp} XP
            </p>
          )}
        </div>
      )}
    </div>
  );
}