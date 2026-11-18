import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

type Me = { email: string; xp: number; level: number; streak: number };
type Session = { id: number; subject: string; plannedMinutes: number; startedAt: string; completedAt: string | null };

const xpForLevel = (level: number) => Math.round(100 * Math.pow(level - 1, 1.5));

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [subject, setSubject] = useState("Math");
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function load() {
    try {
      setMe(await api("/me"));
      const sessions: Session[] = await api("/sessions");
      setActive(sessions.find((s) => !s.completedAt) || null);
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const end = new Date(active.startedAt).getTime() + active.plannedMinutes * 60000;
      setSecondsLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  async function start() {
    setMessage("");
    try {
      await api("/sessions/start", { method: "POST", body: JSON.stringify({ subject, plannedMinutes: minutes }) });
      await load();
    } catch (e) { setMessage((e as Error).message); }
  }

  async function complete() {
    setMessage("");
    try {
      const r = await api(`/sessions/${active!.id}/complete`, { method: "POST" });
      setMessage(`+${r.xpEarned} XP (streak bonus +${r.streakBonus})!${r.leveledUp ? " Level up!" : ""}`);
      await load();
    } catch (e) { setMessage((e as Error).message); }
  }
    async function cancel() {
    setMessage("");
    try {
      await api(`/sessions/${active!.id}/cancel`, { method: "POST" });
      await load();
    } catch (e) { setMessage((e as Error).message); }
  }
  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (!me) return <p className="p-8">Loading...</p>;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const from = xpForLevel(me.level);
  const to = xpForLevel(me.level + 1);
  const progress = Math.min(100, Math.round(((me.xp - from) / (to - from)) * 100));

  const card = "rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800";
  const field =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6 pt-16">
      <div className={card}>
        <p className="text-sm text-slate-500 dark:text-slate-400">{me.email}</p>
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Level {me.level}</h1>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {me.xp} / {to} XP to level {me.level + 1} | Streak {me.streak}
        </p>
      </div>

      <div className={card}>
        {active ? (
          <div className="space-y-4 text-center">
            <p className="text-slate-500 dark:text-slate-400">Quest: {active.subject}</p>
            <p className="text-6xl font-bold tabular-nums">{mm}:{ss}</p>
            <button
              onClick={complete}
              disabled={secondsLeft > 0}
              className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Complete quest
            </button>
                        <button onClick={cancel} className="w-full text-sm text-slate-500 hover:underline dark:text-slate-400">
              Cancel quest
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Start a quest</h2>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <input className={field} type="number" min={1} max={180} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
            <button onClick={start} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700">
              Start quest
            </button>
          </div>
        )}
        {message && <p className="mt-4 text-center font-medium text-amber-600 dark:text-amber-400">{message}</p>}
      </div>

      <button onClick={logout} className="w-full text-sm text-slate-500 hover:underline dark:text-slate-400">
        Log out
      </button>
    </div>
  );
}