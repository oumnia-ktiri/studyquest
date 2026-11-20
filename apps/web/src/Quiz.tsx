import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";

type Question = { question: string; options: string[]; answerIndex: number; explanation: string };

export default function Quiz() {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setError("");
    setQuestions([]);
    setPicked({});
    setLoading(true);
    try {
      const data = await api("/quiz", { method: "POST", body: JSON.stringify({ notes, count }) });
      setQuestions(data.questions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const answered = Object.keys(picked).length;
  const score = questions.filter((q, i) => picked[i] === q.answerIndex).length;
  const card = "rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">AI quiz</h1>
        <Link to="/" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Back to dashboard</Link>
      </div>

      <div className={`${card} space-y-3`}>
        <textarea
          className="h-40 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
          placeholder="Paste your study notes here (at least 50 characters)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={6000}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm">Questions:</label>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate quiz"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className={card}>
          <p className="mb-3 font-semibold">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const done = picked[qi] !== undefined;
              const isRight = oi === q.answerIndex;
              const isPicked = picked[qi] === oi;
              let style = "border-slate-300 dark:border-slate-600";
              if (done && isRight) style = "border-emerald-500 bg-emerald-50 text-slate-900 dark:bg-emerald-900/30 dark:text-emerald-100";
              else if (done && isPicked) style = "border-red-500 bg-red-50 text-slate-900 dark:bg-red-900/30 dark:text-red-100";
              return (
                <button
                  key={oi}
                  disabled={done}
                  onClick={() => setPicked({ ...picked, [qi]: oi })}
                  className={`w-full rounded-lg border px-4 py-2 text-left text-sm ${style}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked[qi] !== undefined && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{q.explanation}</p>
          )}
        </div>
      ))}

      {questions.length > 0 && answered === questions.length && (
        <p className="text-center text-xl font-bold text-amber-600 dark:text-amber-400">
          Score: {score} / {questions.length}
        </p>
      )}
    </div>
  );
}