import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io, Socket } from "socket.io-client";

type Member = { userId: number; name: string; studying: string | null };
type Msg = { name: string; text: string; at: number };

const ROOMS = ["general", "math", "science", "languages", "coding"];

export default function Rooms() {
  const [room, setRoom] = useState("general");
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io({ auth: { token: localStorage.getItem("token") } });
    socketRef.current = socket;
    socket.on("connect", () => { setConnected(true); setError(""); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setError("Could not connect. Try logging in again."));
    socket.on("presence", (list: Member[]) => setMembers(list));
    socket.on("chat:message", (m: Msg) => setMessages((prev) => [...prev.slice(-99), m]));
    return () => { socket.disconnect(); };
  }, []);

  // Join (or re-join after a reconnect) whenever the room changes
  useEffect(() => {
    if (!connected) return;
    setMessages([]);
    socketRef.current?.emit("room:join", room);
  }, [room, connected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!text.trim()) return;
    socketRef.current?.emit("chat:message", text);
    setText("");
  }

  const card = "rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Study rooms</h1>
        <Link to="/" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Back to dashboard</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROOMS.map((r) => (
          <button
            key={r}
            onClick={() => setRoom(r)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              r === room
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 shadow dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            #{r}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">
          Studying now in #{room} ({members.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between">
              <span>{m.name}</span>
              <span className={m.studying ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                {m.studying ? `Studying ${m.studying}` : "Idle"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold">Chat</h2>
        <div className="mb-3 h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900">
          {messages.length === 0 && <p className="text-slate-400">No messages yet. Say hi!</p>}
          {messages.map((m, i) => (
            <p key={i}>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{m.name}: </span>
              {m.text}
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message"
            maxLength={300}
          />
          <button onClick={send} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}