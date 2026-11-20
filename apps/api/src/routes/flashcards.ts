import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const cardSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(600),
});

router.get("/", async (req: AuthedRequest, res) => {
  const cards = await prisma.flashcard.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(cards);
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = cardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Question and answer are required" });

  const count = await prisma.flashcard.count({ where: { userId: req.userId } });
  if (count >= 200) return res.status(400).json({ error: "Limit of 200 cards reached" });

  const card = await prisma.flashcard.create({ data: { userId: req.userId!, ...parsed.data } });
  res.status(201).json(card);
});

router.post("/:id/review", async (req: AuthedRequest, res) => {
  const card = await prisma.flashcard.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!card) return res.status(404).json({ error: "Card not found" });

  const knew = req.body?.knew === true;
  const updated = await prisma.flashcard.update({
    where: { id: card.id },
    data: knew ? { known: { increment: 1 } } : { missed: { increment: 1 } },
  });
  res.json(updated);
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const card = await prisma.flashcard.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!card) return res.status(404).json({ error: "Card not found" });

  await prisma.flashcard.delete({ where: { id: card.id } });
  res.json({ deleted: true });
});

export default router;