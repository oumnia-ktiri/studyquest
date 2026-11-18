import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

type Me = { email: string; xp: number; level: number; streak: number };
type Session = { id: number; subject: string; plannedMinutes: number; startedAt: string; completedAt: string | null };

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
      setMessage(`+${r.xpEarned} XP!${r.leveledUp ? " Level up!" : ""}`);
      await load();
    } catch (e) { setMessage((e as Error).message); }
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (!me) return <p>Loading...</p>;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto", display: "grid", gap: 12 }}>
      <h1>Welcome, {me.email}</h1>
      <p>Level {me.level} | {me.xp} XP | Streak {me.streak}</p>

      {active ? (
        <div>
          <h2>{active.subject}: {mm}:{ss}</h2>
          <button onClick={complete} disabled={secondsLeft > 0}>Complete quest</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <input type="number" min={1} max={180} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          <button onClick={start}>Start quest</button>
        </div>
      )}

      {message && <p>{message}</p>}
      <button onClick={logout}>Log out</button>
    </div>
  );
}