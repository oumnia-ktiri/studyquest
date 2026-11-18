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

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", display: "grid", gap: 12 }}>
      <h1>StudyQuest</h1>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password (8+ characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={submit}>{mode === "login" ? "Log in" : "Create account"}</button>
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "No account? Register" : "Have an account? Log in"}
      </button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}