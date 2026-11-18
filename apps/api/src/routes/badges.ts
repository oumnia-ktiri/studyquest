import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { BADGES } from "../badges";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const earned = await prisma.userBadge.findMany({ where: { userId: req.userId } });
  const earnedAt = new Map(earned.map((b) => [b.code, b.earnedAt]));
  res.json(BADGES.map((b) => ({ ...b, earnedAt: earnedAt.get(b.code) ?? null })));
});

export default router;