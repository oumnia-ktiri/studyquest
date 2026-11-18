import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();

  async function submit() {
    setError("");
    try {
      if (mode === "register") {
        await api("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      }
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800">
        <h1 className="text-center text-3xl font-bold text-indigo-600 dark:text-indigo-400">StudyQuest</h1>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === "login" ? "Log in to continue your quest" : "Create your account"}
        </p>
        <input className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className={input}
          placeholder="Password (8+ characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={submit}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          {mode === "login" ? "Log in" : "Create account"}
        </button>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="w-full text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {mode === "login" ? "No account? Register" : "Have an account? Log in"}
        </button>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}