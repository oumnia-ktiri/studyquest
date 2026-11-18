import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const sessions = await prisma.studySession.findMany({
    where: { userId: req.userId, completedAt: { not: null } },
  });

  // Minutes per subject
  const bySubject: Record<string, number> = {};
  for (const s of sessions) {
    bySubject[s.subject] = (bySubject[s.subject] || 0) + s.plannedMinutes;
  }

  // Minutes per day for the last 7 days (UTC days, like the streak)
  const days: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({ date: d.toISOString().slice(0, 10), minutes: 0 });
  }
  for (const s of sessions) {
    const key = s.completedAt!.toISOString().slice(0, 10);
    const day = days.find((d) => d.date === key);
    if (day) day.minutes += s.plannedMinutes;
  }

  res.json({
    totalMinutes: sessions.reduce((sum, s) => sum + s.plannedMinutes, 0),
    totalSessions: sessions.length,
    bySubject: Object.entries(bySubject).map(([subject, minutes]) => ({ subject, minutes })),
    last7Days: days.map((d) => ({ date: d.date.slice(5), minutes: d.minutes })),
  });
});

export default router;