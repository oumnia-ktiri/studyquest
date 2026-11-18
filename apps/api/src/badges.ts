import { prisma } from "./db";

export const BADGES = [
  { code: "first_quest", name: "First Quest", description: "Complete your first quest" },
  { code: "on_fire", name: "On Fire", description: "Reach a 3-day streak" },
  { code: "level_5", name: "Level 5", description: "Reach level 5" },
  { code: "marathon", name: "Marathon", description: "Complete a quest of 60+ minutes" },
];

export async function awardBadges(
  userId: number,
  ctx: { streak: number; level: number; plannedMinutes: number }
) {
  const completed = await prisma.studySession.count({
    where: { userId, completedAt: { not: null } },
  });

  const qualified: string[] = [];
  if (completed >= 1) qualified.push("first_quest");
  if (ctx.streak >= 3) qualified.push("on_fire");
  if (ctx.level >= 5) qualified.push("level_5");
  if (ctx.plannedMinutes >= 60) qualified.push("marathon");

  const existing = await prisma.userBadge.findMany({ where: { userId } });
  const have = new Set(existing.map((b) => b.code));
  const fresh = qualified.filter((code) => !have.has(code));

  for (const code of fresh) {
    await prisma.userBadge.create({ data: { userId, code } });
  }
  return BADGES.filter((b) => fresh.includes(b.code));
}