import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { xpForMinutes, levelFromXp } from "../xp";

const router = Router();
router.use(requireAuth);

const startSchema = z.object({
  subject: z.string().min(1).max(50),
  plannedMinutes: z.number().int().min(1).max(180),
});

router.post("/start", async (req: AuthedRequest, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid subject or minutes" });

  const open = await prisma.studySession.findFirst({
    where: { userId: req.userId, completedAt: null },
  });
  if (open) return res.status(409).json({ error: "You already have a quest in progress", sessionId: open.id });

  const session = await prisma.studySession.create({
    data: { userId: req.userId!, ...parsed.data },
  });
  res.status(201).json(session);
});

router.post("/:id/complete", async (req: AuthedRequest, res) => {
  const session = await prisma.studySession.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.completedAt) return res.status(409).json({ error: "Already completed" });

  // The server measures the real elapsed time
  const elapsedMinutes = (Date.now() - session.startedAt.getTime()) / 60000;
  if (elapsedMinutes < session.plannedMinutes - 0.5) {
    return res.status(400).json({ error: "Quest not finished yet", elapsedMinutes: Math.floor(elapsedMinutes) });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });

  // Streak: consecutive days with at least one completed quest (UTC days)
  const now = new Date();
  const today = Math.floor(now.getTime() / 86400000);
  let newStreak = 1;
  if (user!.lastStudyDate) {
    const last = Math.floor(user!.lastStudyDate.getTime() / 86400000);
    if (last === today) newStreak = Math.max(1, user!.streak);
    else if (last === today - 1) newStreak = user!.streak + 1;
  }

  const streakBonus = Math.min(newStreak, 7) * 2;
  const xpEarned = xpForMinutes(session.plannedMinutes) + streakBonus;
  const newXp = user!.xp + xpEarned;
  const newLevel = levelFromXp(newXp);

  const [updatedSession, updatedUser] = await prisma.$transaction([
    prisma.studySession.update({
      where: { id: session.id },
      data: { completedAt: now, xpEarned },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { xp: newXp, level: newLevel, streak: newStreak, lastStudyDate: now },
    }),
  ]);

  res.json({
    xpEarned,
    streakBonus,
    streak: updatedUser.streak,
    xp: updatedUser.xp,
    level: updatedUser.level,
    leveledUp: newLevel > user!.level,
    session: updatedSession,
  });
});

router.post("/:id/cancel", async (req: AuthedRequest, res) => {
  const session = await prisma.studySession.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.completedAt) return res.status(409).json({ error: "Already completed" });

  await prisma.studySession.delete({ where: { id: session.id } });
  res.json({ cancelled: true });
});
router.get("/", async (req: AuthedRequest, res) => {
  const sessions = await prisma.studySession.findMany({
    where: { userId: req.userId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  res.json(sessions);
});

export default router;