import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import { requireAuth, AuthedRequest } from "./middleware/auth";
import { prisma } from "./db";
import sessionRoutes from "./routes/sessions";
import badgeRoutes from "./routes/badges";
import statsRoutes from "./routes/stats";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, xp: user.xp, level: user.level, streak: user.streak });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));