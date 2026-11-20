import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const bodySchema = z.object({
  notes: z.string().min(50, "Please paste at least 50 characters").max(6000),
  count: z.number().int().min(3).max(10).default(5),
});

const quizSchema = z.array(
  z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    answerIndex: z.number().int().min(0).max(3),
    explanation: z.string(),
  })
);

const lastCall = new Map<number, number>();

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(503).json({ error: "Quiz generator is not configured (missing API key)" });
  }

  const now = Date.now();
  if (now - (lastCall.get(req.userId!) ?? 0) < 10000) {
    return res.status(429).json({ error: "Please wait a few seconds before generating another quiz" });
  }
  lastCall.set(req.userId!, now);

  const { notes, count } = parsed.data;
  const prompt = `Create ${count} multiple-choice questions from the study notes below.
Respond with ONLY a JSON array. Each item must have:
"question" (string), "options" (array of exactly 4 strings), "answerIndex" (0-3), "explanation" (one short sentence).
Only use facts from the notes.

NOTES:
${notes}`;

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      if (response.status === 429) {
        return res.status(429).json({ error: "Free AI limit reached. Try again in a minute." });
      }
      if (response.status === 404) {
        return res.status(502).json({ error: "AI model not found. Check GEMINI_MODEL in .env." });
      }
      return res.status(502).json({ error: "The AI service failed. Try again in a moment." });
    }

    const data: any = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const questions = quizSchema.parse(JSON.parse(clean));
    res.json({ questions });
  } catch (e) {
    console.error("Quiz error:", e);
    res.status(502).json({ error: "Could not build a quiz from the AI answer. Try again." });
  }
});

export default router;