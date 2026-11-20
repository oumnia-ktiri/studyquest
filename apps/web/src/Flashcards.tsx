import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";

type Card = { id: number; question: string; answer: string; known: number; missed: number };

export default function Flashcards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [current, setCurrent] = useState<Card | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setCards(await api("/flashcards"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => { load(); }, []);

  async function add() {
    setError("");
    try {
      await api("/flashcards", { method: "POST", body: JSON.stringify({ question, answer }) });
      setQuestion("");
      setAnswer("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: number) {
    await api(`/flashcards/${id}`, { method: "DELETE" });
    if (current?.id === id) setCurrent(null);
    await load();
  }

  function next() {
    if (cards.length === 0) return;
    // Cards you miss more often are more likely to come up
    const weighted = cards.flatMap((c) => Array(1 + c.missed).fill(c));
    let pick: Card = weighted[Math.floor(Math.random() * weighted.length)];
    if (cards.length > 1 && current && pick.id === current.id) {
      const others = cards.filter((c) => c.id !== current.id);
      pick = others[Math.floor(Math.random() * others.length)];
    }
    setCurrent(pick);
    setRevealed(false);
  }

  async function review(knew: boolean) {
    if (!current) return;
    await api(`/flashcards/${current.id}/review`, { method: "POST", body: JSON.stringify({ knew }) });
    await load();
    next();
  }

  const card = "rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800";
  const field =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Flashcards</h1>
        <Link to="/" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Back to dashboard</Link>
      </div>

      <div className={`${card} space-y-3 text-center`}>
        <h2 className="text-lg font-semibold">Practice</h2>
        {!current ? (
          <button
            onClick={next}
            disabled={cards.length === 0}
            className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {cards.length === 0 ? "Add a card first" : "Start practising"}
          </button>
        ) : (
          <>
            <p className="text-xl font-semibold">{current.question}</p>
            {revealed ? (
              <>
                <p className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900">{current.answer}</p>
                <div className="flex gap-3">
                  <button onClick={() => review(false)} className="flex-1 rounded-lg bg-red-500 py-3 font-semibold text-white hover:bg-red-600">
                    Missed it
                  </button>
                  <button onClick={() => review(true)} className="flex-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">
                    I knew it
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setRevealed(true)} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700">
                Show answer
              </button>
            )}
          </>
        )}
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className="text-lg font-semibold">New card</h2>
        <input className={field} placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} />
        <input className={field} placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={600} />
        <button onClick={add} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700">
          Add card
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">My cards ({cards.length})</h2>
        {cards.length === 0 && <p className="text-sm text-slate-400">No cards yet.</p>}
        <ul className="space-y-2 text-sm">
          {cards.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
              <span className="flex-1">
                {c.question}
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  ✓ {c.known} · ✗ {c.missed}
                </span>
              </span>
              <button onClick={() => remove(c.id)} className="text-red-500 hover:underline">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}