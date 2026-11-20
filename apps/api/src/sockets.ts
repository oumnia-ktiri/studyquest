import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

type Member = { userId: number; name: string; studying: string | null };

// room name -> (socket id -> member)
const rooms = new Map<string, Map<string, Member>>();

function cleanRoom(raw: unknown) {
  const name = String(raw || "").toLowerCase().trim();
  return /^[a-z0-9-]{1,30}$/.test(name) ? name : null;
}

// One entry per user, even if they have two tabs open
function presence(room: string) {
  const byUser = new Map<number, Member>();
  for (const m of rooms.get(room)?.values() ?? []) byUser.set(m.userId, m);
  return Array.from(byUser.values());
}

export function setupSockets(server: HttpServer) {
  const io = new Server(server, { cors: { origin: "*" } });

  // Only logged-in users can connect
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return next(new Error("User not found"));
      socket.data.userId = user.id;
      socket.data.name = user.email.split("@")[0]; // show only the part before @
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  function leaveCurrent(socket: Socket) {
    const room: string | undefined = socket.data.room;
    if (!room) return;
    rooms.get(room)?.delete(socket.id);
    if (rooms.get(room)?.size === 0) rooms.delete(room);
    socket.leave(room);
    socket.data.room = undefined;
    io.to(room).emit("presence", presence(room));
  }

  io.on("connection", (socket) => {
    socket.on("room:join", async (raw: string) => {
      const room = cleanRoom(raw);
      if (!room) return;
      leaveCurrent(socket);

      const open = await prisma.studySession.findFirst({
        where: { userId: socket.data.userId, completedAt: null },
      });

      if (!rooms.has(room)) rooms.set(room, new Map());
      rooms.get(room)!.set(socket.id, {
        userId: socket.data.userId,
        name: socket.data.name,
        studying: open ? open.subject : null,
      });
      socket.join(room);
      socket.data.room = room;
      io.to(room).emit("presence", presence(room));
    });

    socket.on("chat:message", (raw: string) => {
      const room: string | undefined = socket.data.room;
      const text = String(raw || "").trim().slice(0, 300);
      if (!room || !text) return;
      io.to(room).emit("chat:message", { name: socket.data.name, text, at: Date.now() });
    });

    // Also runs when a connection drops unexpectedly (Socket.IO detects it with pings)
    socket.on("disconnect", () => leaveCurrent(socket));
  });

  return io;
}