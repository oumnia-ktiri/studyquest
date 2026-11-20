import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Monday 00:00 UTC of the current week
function startOfWeekUtc() {
  const now = new Date();
  const dayFromMonday = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayFromMonday));
}

router.get("/", async (req: AuthedRequest, res) => {
  const since = startOfWeekUtc();

  const grouped = await prisma.studySession.groupBy({
    by: ["userId"],
    where: { completedAt: { gte: since } },
    _sum: { xpEarned: true },
    orderBy: { _sum: { xpEarned: "desc" } },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, email: true, level: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const ranking = grouped.map((g, i) => {
    const u = byId.get(g.userId);
    return {
      rank: i + 1,
      name: u ? u.email.split("@")[0] : "unknown", // only the part before @
      level: u?.level ?? 1,
      xp: g._sum.xpEarned ?? 0,
      isMe: g.userId === req.userId,
    };
  });

  res.json({
    weekStart: since.toISOString().slice(0, 10),
    top: ranking.slice(0, 10),
    me: ranking.find((r) => r.isMe) ?? null,
  });
});

export default router;